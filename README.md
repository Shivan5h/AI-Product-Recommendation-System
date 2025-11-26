# SmartShop AI — AI-Powered Product Recommendation System

[![Backend](https://img.shields.io/badge/Backend-FastAPI-blue)](https://fastapi.tiangolo.com/) [![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-green)](https://react.dev/) [![Deployment](https://img.shields.io/badge/Deployed-Render-orange)](https://render.com/)

SmartShop AI is a full-stack application that searches real-time Amazon products and leverages Google's Gemini AI to provide personalized recommendations and explanations based on natural-language queries. Optimized for the Indian market (₹ pricing via Amazon India), it delivers a seamless shopping assistant experience.

## ✨ Features

- *Real-Time Amazon Search*: Fetches live product data from Amazon India using RapidAPI.
- *AI-Driven Recommendations*: Uses Gemini 2.0 Flash to analyze products and suggest top matches with reasoned explanations.
- *User-Friendly Interface*: React + Vite frontend with markdown-rendered AI insights (e.g., bold headers, bullet points).
- *India-Focused*: Defaults to ₹ currency, Indian search results, and relevant pricing examples (e.g., "phone under ₹30,000").
- *Flexible Deployment*: Backend deployed on Render; easy local setup for development.

## 🛠 Tech Stack

| Component | Technologies |
|-----------|--------------|
| *Backend* | FastAPI, Google Generative AI (Gemini), RapidAPI (Real-Time Amazon Data) |
| *Frontend* | React, Vite, Axios (for API calls) |
| *Deployment* | Render (backend), Local (full stack) |
| *Other* | Pydantic (models), python-dotenv (env management), Marked.js (markdown parsing) |

## 🚀 Live Demo

- *Backend API*: [https://ai-product-recommendation-system-5wyl.onrender.com](https://ai-product-recommendation-system-5wyl.onrender.com)
- *Health Check*: GET /health → {"status": "healthy", "service": "product-recommendation-api"}
- *Swagger Docs*: [https://ai-product-recommendation-system-5wyl.onrender.com/docs](https://ai-product-recommendation-system-5wyl.onrender.com/docs)

Note: Render's free tier may sleep after inactivity—wake it by visiting the URL.

## 📋 Prerequisites

- Python 3.11+ (tested up to 3.13)
- Node.js 18+ and npm
- [RapidAPI Key](https://rapidapi.com/apidojo/api/real-time-amazon-data) for "Real-Time Amazon Data"
- [Gemini API Key](https://aistudio.google.com/app/apikey) from Google AI Studio

## 🔧 Local Setup & Running

### 1. Backend (FastAPI)

bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000


- **Create .env** in backend/:
  
  GEMINI_API_KEY=your_gemini_api_key_here
  RAPIDAPI_KEY=your_rapidapi_key_here
  

### 2. Frontend (React + Vite)

bash
cd frontend
npm install
npm run dev


- Opens at http://localhost:5173.
- By default, it calls the deployed Render backend. For local testing, update frontend/src/App.jsx:
  js
  await fetch('http://localhost:8000/recommend', { ... });
  

### 3. Full Stack Testing

- Run backend on port 8000.
- Start frontend—it will proxy requests to the backend.
- Test with queries like: "I want a phone under ₹30,000 with good camera".

## 📡 API Endpoints

| Method | Endpoint | Description | Example Request | Response |
|--------|----------|-------------|-----------------|----------|
| GET | /health | Health check | curl http://localhost:8000/health | {"status": "healthy"} |
| GET | /search?query={term}&page={n} | Search Amazon products | curl "http://localhost:8000/search?query=smartphone&page=1" | {"products": [...], "count": 20} |
| POST | /recommend | AI recommendations | json:disable-run

- **Product Schema**: Includes ASIN, title, price (₹), rating, reviews, image, URL, Prime status, etc.
- **AI Response**: Clean, markdown-formatted analysis (no raw JSON/ASINs visible).

## 🌍 India/₹ Configuration

- Backend defaults to `country=IN` for Amazon India results.
- Prices displayed in ₹; queries handle symbols via URL encoding.
- Example: "headphones under ₹5,000" → Filtered results with Indian relevance.

## 🎨 AI Analysis in UI

- Gemini generates: Brief user intent summary + Top 3-5 recommendations with reasons.
- Frontend parses markdown for rich display (e.g., **bold** headers, • bullet reasons).
- Ensures professional, user-focused output without technical clutter.

## ☁ Deployment on Render (Backend)

1. **Fork/Connect Repo**: Link your GitHub repo (with `backend/` folder) to Render.
2. **New Web Service**:
   - Runtime: **Python**.
   - Build Command: `pip install -r requirements.txt`.
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
3. **Environment Variables** (in Render Dashboard):
   - `GEMINI_API_KEY`
   - `RAPIDAPI_KEY`
   - `PYTHON_VERSION=3.12` (optional).
4. **CORS**: Currently allows all origins (`["*"]`) for testing. Update `main.py` for production:
   python
   allow_origins=["https://your-frontend-domain.com"]
   

- **Docker Support**: See `Dockerfile` in repo for containerized deploys.


## 🤝 THANK YOU
