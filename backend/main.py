from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os, sqlite3, time, httpx
from groq import Groq
import re

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ────────────────────────────────────────────────────────────────────
GROQ_API_KEY   = os.getenv("GROQ_API_KEY", "").strip()
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip()
ADMIN_EMAILS   = os.getenv("ADMIN_EMAILS", "").split(",")   # comma-separated admin emails

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
print("✅ Groq AI configured" if groq_client else "⚠️  No Groq key")

# ── Database ──────────────────────────────────────────────────────────────────
DB_PATH = "neurodesk.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            email     TEXT UNIQUE NOT NULL,
            name      TEXT,
            picture   TEXT,
            role      TEXT DEFAULT 'employee',
            created_at INTEGER DEFAULT (strftime('%s','now'))
        );
        CREATE TABLE IF NOT EXISTS tasks (
            id         TEXT PRIMARY KEY,
            title      TEXT NOT NULL,
            status     TEXT DEFAULT 'todo',
            priority   TEXT DEFAULT 'medium',
            owner      TEXT,
            user_email TEXT NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s','now'))
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token      TEXT PRIMARY KEY,
            user_email TEXT NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s','now'))
        );
    """)
    conn.commit()
    conn.close()
    print("✅ Database initialised")

init_db()

# ── Auth helpers ──────────────────────────────────────────────────────────────
async def verify_google_token(token: str) -> dict:
    """Verify Google ID token and return user info."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        data = resp.json()
        if "error" in data:
            raise HTTPException(status_code=401, detail=data["error"])
        return data

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM users WHERE email = (SELECT user_email FROM sessions WHERE token = ?)",
        (token,)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=401, detail="Session expired — please log in again")
    return dict(row)

# ── Auth endpoints ────────────────────────────────────────────────────────────
@app.post("/api/auth/google")
async def google_login(body: dict):
    """Exchange Google ID token for a session token."""
    id_token = body.get("id_token")
    if not id_token:
        raise HTTPException(status_code=400, detail="id_token required")

    user_info = await verify_google_token(id_token)
    email   = user_info.get("email")
    name    = user_info.get("name", email)
    picture = user_info.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="No email in token")

    conn = get_db()

    # Upsert user
    conn.execute("""
        INSERT INTO users (email, name, picture, role)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET name=excluded.name, picture=excluded.picture
    """, (email, name, picture, "admin" if email in ADMIN_EMAILS else "employee"))
    conn.commit()

    # Create session token
    import secrets
    token = secrets.token_urlsafe(32)
    conn.execute("INSERT INTO sessions (token, user_email) VALUES (?, ?)", (token, email))
    conn.commit()

    user = dict(conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone())
    conn.close()

    return {"token": token, "user": user}

@app.post("/api/auth/logout")
def logout(authorization: str = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        conn = get_db()
        conn.execute("DELETE FROM sessions WHERE token=?", (token,))
        conn.commit()
        conn.close()
    return {"ok": True}

@app.get("/api/auth/me")
def get_me(user = Depends(get_current_user)):
    return user

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "ai_key_configured": bool(GROQ_API_KEY),
        "auth": "google-oauth",
        "message": "AI is ready!" if GROQ_API_KEY else "Set GROQ_API_KEY in .env",
    }

# ── Task endpoints ────────────────────────────────────────────────────────────
@app.get("/api/tasks")
def get_tasks(user = Depends(get_current_user)):
    conn = get_db()
    if user["role"] == "admin":
        rows = conn.execute("SELECT * FROM tasks ORDER BY created_at DESC").fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM tasks WHERE user_email=? ORDER BY created_at DESC",
            (user["email"],)
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/tasks")
def create_task(body: dict, user = Depends(get_current_user)):
    import uuid
    task_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute("""
        INSERT INTO tasks (id, title, status, priority, owner, user_email)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        task_id,
        body.get("title", "New task"),
        body.get("status", "todo"),
        body.get("priority", "medium"),
        body.get("owner", user["name"]),
        user["email"],
    ))
    conn.commit()
    row = dict(conn.execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone())
    conn.close()
    return row

@app.patch("/api/tasks/{task_id}")
def update_task(task_id: str, body: dict, user = Depends(get_current_user)):
    conn = get_db()
    task = conn.execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task["user_email"] != user["email"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not your task")

    fields = {k: v for k, v in body.items() if k in ("title","status","priority","owner")}
    if fields:
        sets = ", ".join(f"{k}=?" for k in fields)
        conn.execute(f"UPDATE tasks SET {sets} WHERE id=?", (*fields.values(), task_id))
        conn.commit()

    row = dict(conn.execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone())
    conn.close()
    return row

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str, user = Depends(get_current_user)):
    conn = get_db()
    task = conn.execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task["user_email"] != user["email"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not your task")
    conn.execute("DELETE FROM tasks WHERE id=?", (task_id,))
    conn.commit()
    conn.close()
    return {"ok": True}

# ── Admin endpoints ───────────────────────────────────────────────────────────
@app.get("/api/admin/users")
def get_all_users(user = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    conn = get_db()
    users = [dict(r) for r in conn.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()]
    for u in users:
        u["task_count"] = conn.execute(
            "SELECT COUNT(*) FROM tasks WHERE user_email=?", (u["email"],)
        ).fetchone()[0]
        u["done_count"] = conn.execute(
            "SELECT COUNT(*) FROM tasks WHERE user_email=? AND status='done'", (u["email"],)
        ).fetchone()[0]
    conn.close()
    return users

# ── AI simplify ───────────────────────────────────────────────────────────────
def fallback_steps(text: str):
    return [
        "Read the task carefully and understand what is being asked.",
        "Gather everything you need before you start.",
        "Begin with the smallest and easiest part first.",
        "Work through each part one at a time without rushing.",
        "Check your work when you are done.",
    ]

@app.post("/api/simplify")
def simplify(task: dict, user = Depends(get_current_user)):
    user_task = task.get("task", "").strip()
    if not user_task:
        raise HTTPException(status_code=400, detail="Task is required")

    if not groq_client:
        return {"steps": fallback_steps(user_task), "source": "fallback"}

    prompt = f"""You are a helpful assistant for neurodiverse people (ADHD, dyslexia, autism).
Break the following task into 4-6 clear, numbered steps.
Rules:
- Each step starts with a number like "1. "
- Max 15 words per step, simple English
- Explain what to do AND why it helps
- ONLY output the numbered steps, nothing else

Task: {user_task}"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You help neurodiverse people. Output only numbered steps."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=500,
        )
        text = response.choices[0].message.content.strip()
        print(f"✅ Groq response:\n{text}")

        steps = []
        for line in text.split("\n"):
            line = line.strip()
            if not line:
                continue
            match = re.match(r'^(\d+[\.\)]\s*)(.*)', line)
            if match:
                step_text = match.group(2).strip()
                if step_text:
                    steps.append(step_text)
            elif steps:
                steps[-1] += " " + line

        if not steps:
            steps = [l.strip() for l in text.split("\n") if l.strip()]

        return {"steps": steps[:6] or fallback_steps(user_task), "source": "groq"}

    except Exception as e:
        print(f"❌ Groq failed: {e}")
        return {"steps": fallback_steps(user_task), "source": "fallback"}