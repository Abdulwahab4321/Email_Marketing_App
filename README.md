# Email Marketing App

React + Vite frontend with Node/Express backend. Send campaigns via SendGrid, manage campaigns with CRUD APIs, upload email lists from CSV/Excel.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express
- **Email:** SendGrid API

## Local Development

### 1. Backend (port 3001)

```bash
cd server
cp .env.example .env
# Edit .env: add SENDGRID_API_KEY and SENDER_EMAIL
npm install
npm start
```

### 2. Frontend (port 5173)

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Deploy to GitHub

### 1. Create a new repository on GitHub

- Go to [github.com/new](https://github.com/new)
- Repository name: `email-marketing-app` (or any name)
- Do **not** add README, .gitignore, or license (we already have them)

### 2. Push from your machine

```bash
cd c:\Users\User\email-marketing-app

git init
git add .
git commit -m "Initial commit: Email Marketing App"

git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/email-marketing-app.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username. Use a **Personal Access Token** as password if 2FA is on.

---

## Deploy to Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New** → **Project**.
3. Import your **email-marketing-app** repo.
4. Vercel will detect Vite:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Environment Variables** (optional for frontend-only):
   - `VITE_API_URL` = `https://YOUR-BACKEND-URL/api`  
   (add this after you deploy the backend)
6. Click **Deploy**.

Your frontend will be live at `https://your-project.vercel.app`.

---

## Deploy Backend (Railway / Render)

Vercel hosts the frontend only. The Express API must run on another service.

### Option A: Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. **New Project** → **Deploy from GitHub** → select your repo.
3. **Settings:**
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. **Variables:** Add from your `server/.env`:
   - `SENDGRID_API_KEY`
   - `SENDER_EMAIL`
   - `PORT` (Railway sets this; you can leave it)
5. Deploy. Copy the public URL (e.g. `https://xxx.railway.app`).

### Option B: Render

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. **New** → **Web Service** → connect your repo.
3. **Settings:**
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. **Environment:** Add `SENDGRID_API_KEY` and `SENDER_EMAIL`.
5. Create service. Copy the URL (e.g. `https://your-app.onrender.com`).

### Connect Frontend to Backend

1. In **Vercel** → your project → **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://YOUR-BACKEND-URL/api`  
     (e.g. `https://xxx.railway.app/api` or `https://your-app.onrender.com/api`)
3. **Redeploy** the Vercel project so the new env is applied.

---

## Environment Variables Summary

| Where     | Variable         | Description                    |
|----------|------------------|--------------------------------|
| Vercel   | `VITE_API_URL`   | Backend API base URL + `/api`  |
| Backend  | `SENDGRID_API_KEY` | SendGrid API key             |
| Backend  | `SENDER_EMAIL`   | Verified sender email          |
| Backend  | `PORT`           | Server port (optional)         |

---

## Project Structure

```
email-marketing-app/
├── src/                 # React frontend
├── server/              # Express API + SendGrid
│   ├── .env             # Not in git
│   ├── data/            # campaigns.json (optional in git)
│   └── index.js
├── vercel.json          # Vercel config (frontend)
├── .env.example         # Frontend env example
└── README.md
```
