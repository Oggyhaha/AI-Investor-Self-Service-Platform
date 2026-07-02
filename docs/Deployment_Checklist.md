# 🌐 Cloud Deployment & Setup Checklist

Follow these steps to deploy the AURA Platform to the cloud. Once completed, we will make a few quick updates to the README to reference your live links.

---

## 🐘 Step 1: Set up Managed PostgreSQL (Neon)
1. Go to [Neon.tech](https://neon.tech/) and create a free account.
2. Create a project named `aura_db`.
3. Select **PostgreSQL 15** or **16** (default).
4. Copy the connection URI. It will look like this:
   `postgresql://postgres_user:Oggy@1236@ep-cool-pool-123.us-east-2.aws.neon.tech/neondb?sslmode=require`
5. **CRITICAL**: Because we connect asynchronously, change the prefix from `postgresql://` to `postgresql+asyncpg://`. 
   * *Example*: `postgresql+asyncpg://postgres_user:Oggy@1236@ep-cool-pool-123.us-east-2.aws.neon.tech/neondb?sslmode=require`

---

## ⚙️ Step 2: Deploy the Backend on Render
1. Go to [Render.com](https://render.com/) and log in (using GitHub is easiest).
2. Click **New +** on the top right and select **Web Service**.
3. Link your GitHub repository.
4. Set the following configurations:
   * **Name**: `aura-backend`
   * **Language**: `Python`
   * **Branch**: `main`
   * **Build Command**: `pip install -r requirements.txt` (or if you are in the subdirectory: `cd backend && pip install -r requirements.txt`)
   * **Start Command**: `uvicorn src.main:app --host 0.0.0.0 --port 8000` (or `cd backend && uvicorn src.main:app --host 0.0.0.0 --port 8000`)
5. Scroll down to **Environment Variables** and add:
   | Key | Value | Description |
   |---|---|---|
   | `APP_DATABASE_URL` | `postgresql+asyncpg://...` (your Neon link from Step 1) | Database connection URL |
   | `APP_SECRET_KEY` | `aura-dev-secret-key-change-in-production-2026` | Security hash salt |
   | `APP_GEMINI_API_KEY` | `AQ.Ab8RN...` (Your Google AI Studio Key) | Gemini API access key |
   | `APP_ENVIRONMENT` | `production` | Enables production mode |
   | `APP_CORS_ORIGINS` | `["https://your-frontend-domain.vercel.app"]` | **Set this to your Vercel URL once deployed** |
6. Click **Deploy Web Service**.
7. **Database Seeding**: Once Render shows "Live", click the **Shell** tab on Render's dashboard and run:
   ```bash
   python seed_data.py
   ```
   *(This executes table creations and inserts your sample mutual fund data into the Neon database!)*

---

## 🎨 Step 3: Deploy the Frontend on Vercel
1. Go to [Vercel.com](https://vercel.com/) and sign in with GitHub.
2. Click **Add New** > **Project** and import your repository.
3. Configure settings:
   * **Framework Preset**: `Next.js`
   * **Root Directory**: `frontend`
4. Under **Environment Variables**, add:
   | Key | Value | Description |
   |---|---|---|
   | `NEXT_PUBLIC_API_URL` | `https://aura-backend.onrender.com/api/v1` | Your Render public web service URL |
5. Click **Deploy**. Vercel will build and host your frontend, giving you a live URL (e.g. `https://aura-investor.vercel.app`).

---

## ✏️ Step 4: Final README Link Updates
Once Vercel and Render are live, open your root [README.md](file:///c:/AI-Investor-Self-Service-Platform/README.md) and add the links right under the title:

```markdown
# 🌟 AURA — AI-Powered Investor Self-Service Platform

🚀 **Live Hosted Demonstration**: [https://your-frontend.vercel.app](https://your-frontend.vercel.app)
⚙️ **Interactive API Documentation**: [https://your-backend.onrender.com/docs](https://your-backend.onrender.com/docs)
```
Also update `APP_CORS_ORIGINS` on Render to allow requests from your new Vercel URL!
