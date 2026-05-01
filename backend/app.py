import asyncio
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

# Using gemini-2.5-flash as confirmed available in the environment
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
model = genai.GenerativeModel(MODEL_NAME)

app = FastAPI()

# In production, set ALLOWED_ORIGINS to your frontend URL
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

# ----------- Helper: Gemini call with retry (Async) -----------
async def call_with_retry(prompt, max_retries=3):
    start_time = time.time()
    for attempt in range(max_retries):
        # Safety check: if we've already spent > 20s, don't retry again to avoid Render timeout
        if time.time() - start_time > 20:
            break
            
        try:
            # Use the async version of generate_content
            response = await model.generate_content_async(prompt)
            return response
        except Exception as e:
            err_str = str(e).lower()
            # Handle rate limiting (429) or quota issues
            if any(x in err_str for x in ["429", "quota", "resource_exhausted", "limit"]):
                # Short exponential backoff to stay within 30s window
                wait = 2 * (attempt + 1) 
                print(f"[RATE LIMIT] Hit on attempt {attempt+1}. Waiting {wait}s...")
                await asyncio.sleep(wait)
            else:
                # Re-raise other errors immediately
                print(f"[ERROR] API Call failed: {e}")
                raise
                
    raise Exception("Max retries exceeded or request timed out due to rate limiting.")

# ----------- Step 1: Analyze Each Chunk (Async) -----------
async def analyze_chunk(chunk):
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

    try:
        response = await call_with_retry(prompt)
        return extract_json(response.text)
    except Exception as e:
        print(f"Error in analyze_chunk: {e}")
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

    cleaned_pros = [p.strip().lower() for p in pros if p.strip()]
    cleaned_cons = [c.strip().lower() for c in cons if c.strip()]
    
    pro_map = {p.strip().lower(): p.strip() for p in reversed(pros) if p.strip()}
    con_map = {c.strip().lower(): c.strip() for c in reversed(cons) if c.strip()}

    top_pros = [pro_map[item] for item, count in Counter(cleaned_pros).most_common(5)]
    top_cons = [con_map[item] for item, count in Counter(cleaned_cons).most_common(5)]

    pos_count = sentiments.count("positive")
    neg_count = sentiments.count("negative")
    conflict_ratio = 0.0
    if total > 1 and (pos_count > 0 and neg_count > 0):
        conflict_ratio = min(pos_count, neg_count) / max(pos_count, neg_count)

    return top_pros, top_cons, score, conflict_ratio

# ----------- Step 3: Final Verdict (Async) -----------
async def generate_final(pros, cons, score, num_reviews, conflict_ratio):
    prompt = f"""
    Based on these aggregated insights:
    Pros: {pros}
    Cons: {cons}
    Sentiment score: {score}
    Total Reviews: {num_reviews}

    Generate a final summary verdict.
    Return JSON:
    {{
      "verdict": "string summarizing everything",
      "confidence": 0.0 to 1.0,
      "en": "english version of verdict",
      "ar": "arabic version of verdict"
    }}
    """

    try:
        response = await call_with_retry(prompt)
        data = extract_json(response.text)
        
        # Apply confidence penalties
        base_conf = data.get("confidence", 0.8)
        review_penalty = min(1.0, num_reviews / 5.0)
        conflict_penalty = 1.0 - (conflict_ratio * 0.4)
        
        final_conf = base_conf * review_penalty * conflict_penalty
        data["confidence"] = round(min(1.0, max(0.0, final_conf)), 2)
        
        return data
    except Exception as e:
        print(f"Error in generate_final: {e}")
        return {
            "verdict": "Insufficient data",
            "confidence": 0.3,
            "en": "Analysis incomplete due to rate limits",
            "ar": "التحليل غير مكتمل بسبب قيود السرعة"
        }

# ----------- Routes -----------
@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}

@app.post("/analyze")
async def analyze(data: ReviewInput):
    try:
        num_reviews = len(data.reviews)
        if num_reviews == 0:
            return {
                "pros": [], "cons": [], "sentiment_score": 0.5,
                "verdict": "No reviews provided.", "confidence": 0.0,
                "language": {"en": "No reviews provided.", "ar": "لم يتم تقديم أي مراجعات."}
            }

        chunks = chunk_reviews(data.reviews)
        
        # Parallel chunk analysis
        chunk_tasks = [analyze_chunk(chunk) for chunk in chunks]
        results = await asyncio.gather(*chunk_tasks)
        
        pros, cons, score, conflict_ratio = aggregate_results(results)
        final = await generate_final(pros, cons, score, num_reviews, conflict_ratio)

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