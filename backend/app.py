from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
import re
import traceback
import time
from collections import Counter

load_dotenv()

# Support both GEMINI_API_KEY (preferred) and legacy VITE_GEMINI_API_KEY
_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
genai.configure(api_key=_api_key)

model = genai.GenerativeModel("gemini-2.5-flash")

app = FastAPI()

# In production, set ALLOWED_ORIGINS to your frontend URL, e.g.:
# ALLOWED_ORIGINS=https://your-frontend.vercel.app
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
_allowed_origins = [o.strip() for o in _raw_origins.split(",")] if _raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input schema
class ReviewInput(BaseModel):
    reviews: list[str]

# ----------- Helper: Extract JSON -----------
def extract_json(text):
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
            
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end+1])
        except json.JSONDecodeError:
            pass
            
    raise ValueError("No JSON found in response")

# ----------- Helper: Chunk Reviews -----------
def chunk_reviews(reviews, size=10):
    return [reviews[i:i+size] for i in range(0, len(reviews), size)]

# ----------- Helper: Gemini call with retry -----------
def call_with_retry(prompt, max_retries=3):
    for attempt in range(max_retries):
        try:
            return model.generate_content(prompt)
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "quota" in err_str.lower():
                wait = 60  # wait 60s on rate limit
                print(f"[RATE LIMIT] 429 hit. Waiting {wait}s before retry {attempt+1}/{max_retries}...")
                time.sleep(wait)
            else:
                raise
    raise Exception("Max retries exceeded due to rate limiting.")

# ----------- Step 1: Analyze Each Chunk -----------
def analyze_chunk(chunk):
    prompt = f"""
    You are an AI analyzing product reviews.

    Reviews:
    {chunk}

    Extract:
    - Pros
    - Cons
    - Sentiment (positive/neutral/negative)

    Return JSON:
    {{
      "pros": [],
      "cons": [],
      "sentiment": ""
    }}
    """

    response = call_with_retry(prompt)
    
    try:
        return extract_json(response.text)
    except Exception as e:
        print(f"Error parsing analyze_chunk response: {e}")
        print(f"Raw response: {response.text}")
        return {"pros": [], "cons": [], "sentiment": "neutral"}

# ----------- Step 2: Aggregate Results -----------
def aggregate_results(results):
    pros = []
    cons = []
    sentiment_score = 0
    
    sentiments = []

    for r in results:
        pros.extend(r.get("pros", []))
        cons.extend(r.get("cons", []))
        
        sent = r.get("sentiment")
        sentiments.append(sent)
        
        if sent == "positive":
            sentiment_score += 1
        elif sent == "negative":
            sentiment_score -= 1

    total = len(results) if results else 1
    score = (sentiment_score / total + 1) / 2  # normalize 0–1

    # Use Counter for better aggregation (case-insensitive)
    cleaned_pros = [p.strip().lower() for p in pros if p.strip()]
    cleaned_cons = [c.strip().lower() for c in cons if c.strip()]
    
    pro_map = {p.strip().lower(): p.strip() for p in reversed(pros) if p.strip()}
    con_map = {c.strip().lower(): c.strip() for c in reversed(cons) if c.strip()}

    top_pros = [pro_map[item] for item, count in Counter(cleaned_pros).most_common(5)]
    top_cons = [con_map[item] for item, count in Counter(cleaned_cons).most_common(5)]

    # Compute a baseline confidence penalty based on sentiment variance
    pos_count = sentiments.count("positive")
    neg_count = sentiments.count("negative")
    # If there are roughly equal highly polarizing sentiments, confidence in a "definitive" verdict drops
    conflict_ratio = 0.0
    if total > 1 and (pos_count > 0 and neg_count > 0):
        conflict_ratio = min(pos_count, neg_count) / max(pos_count, neg_count)

    return top_pros, top_cons, score, conflict_ratio

# ----------- Step 3: Final Verdict -----------
def generate_final(pros, cons, score, num_reviews, conflict_ratio):
    prompt = f"""
    Based on:

    Pros: {pros}
    Cons: {cons}
    Sentiment score: {score}
    Total Reviews Analyzed: {num_reviews}

    Generate:
    - Final verdict summarizing the overall sentiment.
    - Base confidence score (0.0 to 1.0). If there are very few reviews, or contradictory pros/cons, output a lower confidence.

    Return JSON:
    {{
      "verdict": "",
      "confidence": 0.0,
      "en": "",
      "ar": ""
    }}
    """

    response = call_with_retry(prompt)

    try:
        data = extract_json(response.text)
        # Cap confidence if there are very few reviews or high conflict
        base_conf = data.get("confidence", 0.8)
        
        # Penalize confidence for small sample size
        review_penalty = min(1.0, num_reviews / 5.0) # max confidence scaling requires at least 5 reviews
        
        # Penalize confidence for highly conflicting sentiments
        conflict_penalty = 1.0 - (conflict_ratio * 0.4)
        
        # Calculate final confidence
        final_conf = base_conf * review_penalty * conflict_penalty
        data["confidence"] = round(min(1.0, max(0.0, final_conf)), 2)
        
        return data
    except Exception as e:
        print(f"Error parsing generate_final response: {e}")
        print(f"Raw response: {response.text}")
        return {
            "verdict": "Insufficient data",
            "confidence": 0.3,
            "en": "Not enough data",
            "ar": "لا توجد بيانات كافية"
        }

# ----------- Health Check -----------
@app.get("/health")
def health():
    return {"status": "ok", "model": "gemini-2.5-flash"}

# ----------- API Route -----------
@app.post("/analyze")
def analyze(data: ReviewInput):
    try:
        num_reviews = len(data.reviews)
        if num_reviews == 0:
            return {
                "pros": [],
                "cons": [],
                "sentiment_score": 0.5,
                "verdict": "No reviews provided.",
                "confidence": 0.0,
                "language": {
                    "en": "No reviews provided.",
                    "ar": "لم يتم تقديم أي مراجعات."
                }
            }

        chunks = chunk_reviews(data.reviews)
        results = [analyze_chunk(chunk) for chunk in chunks]
        pros, cons, score, conflict_ratio = aggregate_results(results)
        final = generate_final(pros, cons, score, num_reviews, conflict_ratio)

        return {
            "pros": pros,
            "cons": cons,
            "sentiment_score": round(score, 2),
            "verdict": final.get("verdict", ""),
            "confidence": final.get("confidence", 0.0),
            "language": {
                "en": final.get("en", ""),
                "ar": final.get("ar", "")
            }
        }
    except Exception as e:
        print("\n[ERROR] Exception in /analyze:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))