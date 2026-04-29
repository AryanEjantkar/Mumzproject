# ReviewNest-Smart Review Analyzer
![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)

An AI-powered system that transforms large volumes of product reviews into a clear, structured, and trustworthy verdict to help moms make better shopping decisions.

---
## 📘 Table of Contents
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Workflow](#-workflow)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation--usage)
- [Future Enhancements](#-future-enhancements)
- [LLM Prompts Used](#-llm-prompts-used-to-create-this-project)
- [Author](#-author)
---
## Features
- Input 50–200 product reviews  
- AI-powered extraction of pros and cons
- Sentiment scoring (overall product quality)
- Structured output (clean JSON format)
- Confidence score for reliability
- Multilingual support (English + Arabic)
- Handles uncertainty (low confidence cases)
---
## System Architecture
![Architecture Diagram](/arci.png)
![Architecture Diagram](/archi.png)
> The system processes large review data using chunking, aggregation, and LLM-based reasoning to generate a reliable final verdict.
---
## Workflow
1. Paste product reviews (50–200) 
2. Click Generate Verdict 
3. System analyzes reviews in chunks  
4. Aggregates insights
5. Displays:Pros
   -Cons
  -Sentiment score
  -Final verdict
  -Confidence score
---
##  Tech Stack
| Layer | Technology |
|--------|-------------|
| Frontend | React + Tailwind CSS |
| Backend | Python (FastAPI) |
| LLM | Gemini |
| Processing | Custom chunking + aggregation |
| Validation|Pydantic |
| Deployment | Vercel / Streamlit Cloud |

---
##  Installation & Usage
git clone https://github.com/your-username/momsverdict-ai.git
cd momsverdict-ai

# Backend
pip install -r requirements.txt
uvicorn app:app --reload

# Frontend
cd frontend
npm install
npm run dev

---
##  Future Enhancements
- Product comparison engine
- Review authenticity detection (fake reviews)
- Personalized product recommendations
- Advanced analytics dashboard
- Cloud-based review storage

 ---
 ## LLM Prompts Used to Create This Project
 This project was developed using Large Language Models (LLMs) such as Gemini and GPT, assisting in system design, evaluation, and UI generation.

 ---
 ### 1.Project Ideation
 > Suggest an AI system that summarizes large volumes of product reviews into structured insights (pros, cons, sentiment, verdict, confidence) for e-commerce users, especially moms.
---
### 2.Architecture Design
> Design a scalable pipeline for processing 100+ reviews using chunking, aggregation, and LLM-based summarization. Include validation and confidence scoring.

---
### 3.Core Functionality
> Write Python code to process large text inputs in chunks, extract key insights (pros/cons), and aggregate them into a final structured output.
---
### 4.UI/UX Design
> Design a modern SaaS-style interface for a review summarization tool with sections for input, analysis, and structured output display.
---
### 5. Multilingual Output
> Generate output in both English and Arabic with natural phrasing, not literal translation.
---
### 6.Evaluation Design
> Suggest evaluation metrics for a review summarization system, including sentiment accuracy, coverage, hallucination detection, and confidence scoring.

---
---
👨‍💻 Author

Aryan Vimal Ejantkar
🎓 B.Tech (AIML) – VIT Bhopal
💼 Passionate about AI, ML, and automation

 






  
---
 


