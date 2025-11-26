from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import http.client
from urllib.parse import quote
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = FastAPI(title="AI Product Recommendation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash")

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "00c4aad806msh8e00931585a4552p1cba4fjsn25893b3ff1c5")
RAPIDAPI_HOST = "real-time-amazon-data.p.rapidapi.com"


class RecommendationRequest(BaseModel):
    query: str
    preferences: Optional[str] = None


class Product(BaseModel):
    asin: str
    title: str
    price: Optional[str] = None
    original_price: Optional[str] = None
    rating: Optional[float] = None
    reviews_count: Optional[int] = None
    image: Optional[str] = None
    url: Optional[str] = None
    is_prime: Optional[bool] = None
    is_best_seller: Optional[bool] = None


class RecommendationResponse(BaseModel):
    products: List[dict]
    ai_analysis: str
    recommended_products: List[dict]


def fetch_amazon_products(query: str, page: int = 1) -> List[dict]:
    """Fetch products from Amazon via RapidAPI"""
    conn = http.client.HTTPSConnection(RAPIDAPI_HOST)
    headers = {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
    }
    
    encoded_query = quote(query, safe='')
    endpoint = f"/search?query={encoded_query}&page={page}&country=IN&sort_by=RELEVANCE&product_condition=ALL&is_prime=false&deals_and_discounts=NONE"
    
    try:
        conn.request("GET", endpoint, headers=headers)
        res = conn.getresponse()
        data = res.read()
        result = json.loads(data.decode("utf-8"))
        
        if result.get("status") == "OK" and result.get("data", {}).get("products"):
            products = []
            for p in result["data"]["products"][:20]:
                products.append({
                    "asin": p.get("asin", ""),
                    "title": p.get("product_title", ""),
                    "price": p.get("product_price", "N/A"),
                    "original_price": p.get("product_original_price"),
                    "rating": p.get("product_star_rating"),
                    "reviews_count": p.get("product_num_ratings"),
                    "image": p.get("product_photo", ""),
                    "url": p.get("product_url", ""),
                    "is_prime": p.get("is_prime", False),
                    "is_best_seller": p.get("is_best_seller", False),
                    "delivery": p.get("delivery", "")
                })
            return products
        return []
    except Exception as e:
        print(f"Error fetching Amazon products: {e}")
        return []
    finally:
        conn.close()


def get_ai_recommendations(products: List[dict], user_preferences: str) -> tuple[str, List[str]]:
    """Use Gemini AI to analyze products and recommend based on user preferences"""
    
    products_for_ai = []
    for i, p in enumerate(products[:15], 1):
        products_for_ai.append(f"Product {i}: {p['title'][:100]} | Price: {p['price']} | Rating: {p['rating']} stars | Reviews: {p['reviews_count']}")
    products_summary = "\n".join(products_for_ai)
    
    asin_map = {i: p['asin'] for i, p in enumerate(products[:15], 1)}
    
    prompt = f"""You are a product recommendation expert. Based on the user's preferences, analyze these Amazon products and recommend the best ones.

USER PREFERENCES: {user_preferences}

AVAILABLE PRODUCTS:
{products_summary}

Please provide:
1. A brief analysis of what the user is looking for (2-3 sentences)
2. Your top 3-5 recommended products with brief reasons why each is a good match. Reference products by their name, NOT by product numbers.
3. At the very end, return ONLY the product numbers of your recommendations in a JSON array format like this: [1, 2, 3]

IMPORTANT: In your analysis, describe products by their NAME and FEATURES only. Do not mention product numbers or technical IDs in your explanations."""

    try:
        response = model.generate_content(prompt)
        response_text = response.text
        
        recommended_asins = []
        if "[" in response_text and "]" in response_text:
            start = response_text.rfind("[")
            end = response_text.rfind("]") + 1
            try:
                product_numbers = json.loads(response_text[start:end])
                recommended_asins = [asin_map.get(num) for num in product_numbers if asin_map.get(num)]
            except:
                recommended_asins = [p["asin"] for p in products[:3]]
        
        clean_response = response_text[:response_text.rfind("[")] if "[" in response_text else response_text
        clean_response = clean_response.strip()
        
        return clean_response, recommended_asins
    except Exception as e:
        return f"AI analysis unavailable: {str(e)}", [p["asin"] for p in products[:3]]


@app.get("/")
async def root():
    return {"message": "AI Product Recommendation API", "status": "healthy"}


@app.get("/search")
async def search_products(query: str, page: int = 1):
    """Search for products on Amazon"""
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    products = fetch_amazon_products(query, page)
    return {"products": products, "count": len(products)}


@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get AI-powered product recommendations based on user preferences"""
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    search_query = request.query.split()[0] if " " in request.query else request.query
    for keyword in ["phone", "laptop", "headphones", "camera", "watch", "tablet", "tv", "speaker"]:
        if keyword in request.query.lower():
            search_query = keyword
            break
    
    products = fetch_amazon_products(request.query)
    
    if not products:
        raise HTTPException(status_code=404, detail="No products found for this query")
    
    user_prefs = request.preferences if request.preferences else request.query
    ai_analysis, recommended_asins = get_ai_recommendations(products, user_prefs)
    
    recommended_products = [p for p in products if p["asin"] in recommended_asins]
    
    if not recommended_products:
        recommended_products = products[:3]
    
    return RecommendationResponse(
        products=products,
        ai_analysis=ai_analysis,
        recommended_products=recommended_products
    )


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "product-recommendation-api"}
