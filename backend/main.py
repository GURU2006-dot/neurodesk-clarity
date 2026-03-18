from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import os
from google import genai

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI()

# Enable CORS so React frontend can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get API key from env
API_KEY = os.getenv("GEMINI_API_KEY", "") or os.getenv("GROQ_API_KEY", "")
API_KEY = API_KEY.strip()
if API_KEY.startswith("your_"):
    API_KEY = ""

# Configure Gemini client only if API key is configured
client = None
if API_KEY:
    client = genai.Client(api_key=API_KEY)
MODEL = "gemini-1.5-flash"


def fallback_steps(text: str) -> list[str]:
    parts = [p.strip() for p in text.split(".") if p.strip()]
    steps = []
    for i, p in enumerate(parts[:6], start=1):
        steps.append(f"Step {i}: {p}")
    if not steps:
        steps = ["Step 1: Define your task clearly.", "Step 2: Break it into smaller actions."]
    return steps


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "ai_key_configured": bool(API_KEY),
        "message": "Set GEMINI_API_KEY or GROQ_API_KEY in .env for real AI responses",
    }


@app.post("/api/simplify")
def simplify(task: dict):
    try:
        user_task = task.get("task")
        if not user_task:
            raise HTTPException(status_code=400, detail="Task is required")

        prompt = f"""
Break down the following task into simple step-by-step instructions
for neurodiverse users.

Rules:
- Return ONLY steps
- Each step should be short and clear
- Maximum 6 steps

Task:
{user_task}
"""

        if client is None:
            # If key not configured, return deterministic fallback steps.
            return {"steps": fallback_steps(user_task)}

        try:
            response = client.responses.create(
                model=MODEL,
                input=prompt,
                temperature=0.2,
                max_output_tokens=450,
            )
        except Exception as e:
            # If AI call fails, fallback gracefully and return clear message
            print("AI call failed:", e)
            return {"steps": fallback_steps(user_task)}

        # Extract text from response
        text = ""
        if hasattr(response, "output"):
            for item in response.output:
                if hasattr(item, "content"):
                    for block in item.content:
                        if isinstance(block, str):
                            text += block
                        elif hasattr(block, "text"):
                            text += block.text
        else:
            text = getattr(response, "output_text", "")

        text = text.strip()

        if not text:
            return {"steps": fallback_steps(user_task)}

        steps = [
            line.replace("-", "").replace("*", "").strip()
            for line in text.split("\n")
            if line.strip()
        ]

        if not steps:
            steps = fallback_steps(text)

        return {"steps": steps}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))