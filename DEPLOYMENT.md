# NeuroDesk Clarity - Deployment Guide

## Quick Deployment (Cloud)

### Step 1: Deploy Backend to Railway

1. Go to https://railway.app
2. Click **"Start a New Project"** → **"Deploy from GitHub"**
3. **Select this repository** (neurodesk-clarity) and authorize
4. Railway will auto-detect the `railway.json` - click deploy
5. In Railway dashboard:
   - Go to the **backend service**
   - Click **"Variables"** tab
   - Add these environment variables:
     - `GROQ_API_KEY` - Get free key at https://console.groq.com
     - `GOOGLE_CLIENT_ID` - From your Google Cloud Project
     - `ADMIN_EMAILS` - Your email addresses (comma-separated)
6. Railway will provide a **public URL** like `https://neurodesk-backend.railway.app`
7. Copy this URL for Step 2

### Step 2: Update Frontend

1. Get your backend URL from Railway (e.g., `https://neurodesk-backend.railway.app`)
2. Go to `frontend/.env.local` or create it:
   ```
   VITE_API_BASE=https://neurodesk-backend.railway.app
   ```
3. Commit and push:
   ```bash
   git add -A
   git commit -m "Update backend URL for production"
   git push
   ```
4. Vercel auto-redeploys - check your site after 2 minutes!

### Step 3: Done! 🎉

Your full-stack app is now live:
- **Frontend:** https://neurodesk-clarity.vercel.app
- **Backend:** https://neurodesk-backend.railway.app

Both work without your laptop running!

---

## Local Development

1. Start backend:
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```

2. Start frontend (in new terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Create `frontend/.env.local`:
   ```
   VITE_API_BASE=http://127.0.0.1:8000
   ```

4. Open http://localhost:5173
