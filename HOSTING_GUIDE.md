# 🌐 Complete Hosting Guide — ElectroMaintain v3.0
## Deploy Publicly for FREE in under 30 minutes

---

## Architecture Overview

```
[User's Browser]
      │
      ▼
[Vercel — Frontend]          ← free, global CDN, auto-deploy from GitHub
      │  (HTTPS API calls)
      ▼
[Render.com — Backend API]   ← free tier, Node.js server
      │  (DB queries)
      ▼
[MongoDB Atlas — Database]   ← free 512MB cloud database
```

---

## STEP 1 — Prepare Your Code on GitHub

### 1a. Install Git (if not installed)
Download from: https://git-scm.com/downloads

### 1b. Create a GitHub account
Go to: https://github.com and sign up (free)

### 1c. Create a new repository
1. Click **"New"** (green button on GitHub)
2. Name it: `electromaintain`
3. Set to **Public**
4. Click **"Create repository"**

### 1d. Push your code
Open terminal in your `electromaintain` folder:
```bash
git init
git add .
git commit -m "ElectroMaintain v3.0 - Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/electromaintain.git
git push -u origin main
```

---

## STEP 2 — Setup MongoDB Atlas (Free Database)

1. Go to → **https://www.mongodb.com/atlas**
2. Sign up with Google or Email (free)
3. Choose **"Free"** tier (M0 — 512MB, always free)
4. Select region closest to India: **AWS ap-south-1 (Mumbai)**
5. Click **"Create Cluster"**

### Get your connection string:
1. Click **"Connect"** on your cluster
2. Choose **"Drivers"**
3. Select: Node.js, version 5.5+
4. Copy the connection string:
   ```
   mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/
   ```
5. Replace `<password>` with your actual password
6. Add database name at the end:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/electromaintain
   ```

### Allow all connections:
1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** → `0.0.0.0/0`
4. Click **"Confirm"**

---

## STEP 3 — Deploy Backend to Render.com

1. Go to → **https://render.com**
2. Sign up with GitHub account (free)
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub account → Select your `electromaintain` repo
5. Configure:

   | Setting | Value |
   |---------|-------|
   | Name | `electromaintain-api` |
   | Root Directory | `backend` |
   | Runtime | `Node` |
   | Build Command | `npm install` |
   | Start Command | `node server.js` |
   | Instance Type | **Free** |

6. Scroll down to **"Environment Variables"** → Click **"Add Environment Variable"** for each:

   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | your MongoDB Atlas connection string |
   | `JWT_SECRET` | any random string e.g. `electromaintain_jwt_secret_2024_pbl` |
   | `JWT_EXPIRES_IN` | `7d` |
   | `EMAIL_USER` | your Gmail address |
   | `EMAIL_PASS` | your Gmail App Password |
   | `EMAIL_FROM` | `ElectroMaintain <youremail@gmail.com>` |
   | `ANTHROPIC_API_KEY` | leave blank or add key |
   | `NODE_ENV` | `production` |

7. Click **"Create Web Service"**
8. Wait 3-5 minutes for deployment
9. Note your URL: `https://electromaintain-api.onrender.com`

### ⚠ Important: Free tier spins down after 15 min inactivity
To prevent cold starts, use a free uptime monitor:
- Go to **https://uptimerobot.com** → Sign up free
- Add monitor: type = HTTP, URL = `https://electromaintain-api.onrender.com/api/health`
- Interval: every 5 minutes
- This keeps your server always awake!

---

## STEP 4 — Deploy Frontend to Vercel

1. Go to → **https://vercel.com**
2. Sign up with GitHub (free)
3. Click **"Add New..."** → **"Project"**
4. Import your `electromaintain` GitHub repository
5. Configure:

   | Setting | Value |
   |---------|-------|
   | Root Directory | `frontend` |
   | Framework Preset | `Vite` |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |

6. Click **"Environment Variables"** → Add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://electromaintain-api.onrender.com/api` |

7. Click **"Deploy"**
8. Wait ~2 minutes
9. Your site is live at: `https://electromaintain-YOUR_USERNAME.vercel.app`

---

## STEP 5 — Connect Frontend ↔ Backend

1. Go back to **Render.com** → your backend service
2. Click **"Environment"** → Add one more variable:

   | Key | Value |
   |-----|-------|
   | `FRONTEND_URL` | `https://electromaintain-YOUR_USERNAME.vercel.app` |

3. Click **"Save Changes"** — backend will restart automatically

---

## STEP 6 — Test Your Live Site

1. Open your Vercel URL in browser
2. Register a new account
3. Add a device — you should see auto-reminders created
4. Check the ML Insights tab

### Test the API directly:
```
https://electromaintain-api.onrender.com/api/health
```
Should return: `{"status":"ok","timestamp":"..."}`

---

## Troubleshooting Common Issues

### ❌ "Cannot connect to server" on frontend
- Check Render.com logs (Dashboard → your service → Logs)
- Make sure `VITE_API_URL` on Vercel points to your exact Render URL
- Make sure `FRONTEND_URL` on Render points to your exact Vercel URL

### ❌ "MongoDB connection error" in Render logs
- Check your `MONGODB_URI` — the password must not have special characters, or URL-encode them
- Check Network Access in Atlas — must have `0.0.0.0/0` allowed

### ❌ "JWT must have a secret"
- Make sure `JWT_SECRET` environment variable is set on Render (not empty)

### ❌ Render site loads but is very slow first time
- Free tier sleeps after 15 min. Use UptimeRobot (Step 3) to fix this.

### ❌ Vercel build fails
- Make sure Root Directory is set to `frontend` (not the root of the repo)
- Check that `vite.config.js` exists in the `frontend` folder

---

## Custom Domain (Optional — Free on Vercel)

1. Buy a domain (e.g. from GoDaddy, Namecheap — from ₹500/year)
2. In Vercel → your project → **"Domains"**
3. Add your domain and follow DNS setup instructions
4. Your site gets a free HTTPS certificate automatically

---

## After Deployment — Updating Your Code

Whenever you make changes:
```bash
git add .
git commit -m "Update: description of change"
git push
```
Both Vercel and Render auto-detect the push and redeploy automatically. Zero manual work!

---

## Summary: What's Free Forever

| Service | Free Tier Limits | Enough For? |
|---------|-----------------|-------------|
| MongoDB Atlas | 512MB storage | ✅ Yes — thousands of devices/reminders |
| Render.com | 750 hrs/month, sleeps after 15min | ✅ Yes with UptimeRobot |
| Vercel | 100GB bandwidth/month | ✅ Yes — unlimited |
| UptimeRobot | 50 monitors, 5min intervals | ✅ Yes |

**Total cost: ₹0** to host this project publicly forever.

