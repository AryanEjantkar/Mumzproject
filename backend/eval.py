import requests
import json
import time

BASE_URL = "http://127.0.0.1:8001/analyze"

cases = [
    {
        "name": "1. Unanimously positive reviews",
        "reviews": [
            "This product is amazing! I love it.",
            "Absolutely fantastic quality, highly recommend.",
            "Best purchase I've made all year.",
            "Great value for money and fast shipping.",
            "Will definitely buy again, my baby loves it!"
        ]
    },
    {
        "name": "2. Unanimously negative reviews",
        "reviews": [
            "Terrible quality, broke on the first day.",
            "Do not buy this! Waste of money.",
            "Customer service was unhelpful and the product is defective.",
            "Smells weird and looks nothing like the picture.",
            "Very disappointed, returning it immediately."
        ]
    },
    {
        "name": "3. Highly mixed/polarizing reviews",
        "reviews": [
            "Great material, very soft.",
            "Terrible size, too small.",
            "Love the color, looks great in the nursery.",
            "Zipper broke after two uses, poor construction.",
            "My baby sleeps so well in this.",
            "Too expensive for what you get."
        ]
    },
    {
        "name": "4. Very sparse/short reviews (low confidence check)",
        "reviews": [
            "it's okay",
            "not bad"
        ]
    },
    {
        "name": "5. Reviews in Arabic",
        "reviews": [
            "منتج رائع جداً، جودة عالية.",
            "لم يعجبني، السعر مرتفع.",
            "ممتاز ومريح جداً للطفل.",
            "تأخر التوصيل ولكن المنتج جيد."
        ]
    },
    {
        "name": "6. Gibberish / irrelevant text",
        "reviews": [
            "asdasdasdasd",
            "123123123",
            "hello world this is a test",
            "the quick brown fox jumps over the lazy dog"
        ]
    },
    {
        "name": "7. Sarcastic / Passive-aggressive reviews",
        "reviews": [
            "Oh sure, I love waiting 3 weeks for a package.",
            "Wow, what a masterpiece! It broke in 5 seconds.",
            "Thanks for sending me the completely wrong item.",
            "My baby loves crying because of this toy."
        ]
    },
    {
        "name": "8. Overwhelmingly average/neutral reviews",
        "reviews": [
            "It is okay. Does what it says.",
            "Average product, nothing special.",
            "It works fine.",
            "Not bad but not great either."
        ]
    },
    {
        "name": "9. Mixed language reviews (English & Arabic)",
        "reviews": [
            "Good product.",
            "سيء جدا ولا أنصح به",
            "Very fast delivery, thanks!",
            "الجودة ممتازة لكن السعر غالي"
        ]
    },
    {
        "name": "10. One-word reviews (low confidence check)",
        "reviews": [
            "Good",
            "Bad",
            "Okay",
            "Nice"
        ]
    },
    {
        "name": "11. Only Emojis or Slang",
        "reviews": [
            "🔥🔥🔥",
            "mid tbh",
            "W purchase",
            "L product"
        ]
    }
]

def run_evals():
    print("Running Evals...\n")
    print("[NOTE] Free tier: 5 req/min. Waiting 35s between cases.\n")
    for i, case in enumerate(cases):
        print(f"--- {case['name']} ---")
        try:
            response = requests.post(
                BASE_URL,
                json={"reviews": case["reviews"]},
                timeout=120
            )
            if response.status_code == 200:
                data = response.json()
                print(f"Sentiment Score: {data.get('sentiment_score')}")
                print(f"Confidence:      {data.get('confidence')}")
                print(f"Verdict (EN):    {data.get('language', {}).get('en')}")
                print(f"Pros:            {data.get('pros')}")
                print(f"Cons:            {data.get('cons')}")
            else:
                print(f"Error {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Failed to connect or error: {e}")
        print("\n")
        
        # Respect free-tier rate limits: 5 req/min, each case = 2 calls
        if i < len(cases) - 1:
            wait_secs = 35
            print(f"[Rate limit guard] Waiting {wait_secs}s before next case...")
            time.sleep(wait_secs)

if __name__ == "__main__":
    run_evals()
