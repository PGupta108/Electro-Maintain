# ⚡ ElectroMaintain

### Smart Electronic Maintenance Reminder System

> A full-stack web application that automatically generates and manages maintenance schedules for all your electronic devices — powered by a custom ML engine with Decision Tree and Random Forest models.

<br>

## 📌 Table of Contents

- [About the Project](#about-the-project)
- [Live Demo](#live-demo)
- [Features](#features)
- [ML Engine](#ml-engine)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [Research Paper](#research-paper)
- [Author](#author)

<br>

---

## 🎯 About the Project

ElectroMaintain solves a real-world problem — people forget to maintain their electronic devices. Laptops overheat from dusty fans, phones lose battery health, cars break down from skipped oil changes, and AC units fail from dirty filters. All of these failures are preventable with timely maintenance.

This project was built as a **Project-Based Learning (PBL)** submission. It works like a smart service centre — you add your device once and the system automatically creates a full, personalised maintenance schedule based on the device type, age, condition, and daily usage. No manual reminder creation needed.

**Key idea:** Just like vehicle manufacturers send service reminders to car owners — ElectroMaintain does the same for every electronic device you own.

<br>

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| Frontend | *(add your Vercel URL after deployment)* |
| Backend API | *(add your Render.com URL after deployment)* |
| API Health Check | `YOUR_RENDER_URL/api/health` |

<br>

---

## ✨ Features

### Core Features
- 🔐 **User Authentication** — Secure register/login with JWT tokens and bcrypt password hashing
- 📱 **Device Management** — Add, edit, and delete devices with full details (brand, model, purchase date, warranty, condition, usage hours)
- 🏷 **Custom Categories** — Choose from 8 preset categories or enter your own custom category
- 🤖 **Smart Auto-Reminder System** — Add a device and get a full maintenance schedule generated automatically
- 📅 **Reminder Tracking** — View, filter, complete, and delete reminders with status tracking
- 📧 **Email Notifications** — Daily email reminders at 8 AM for due and overdue tasks
- 📆 **Repeat Scheduling** — Completed tasks auto-reschedule for the next cycle
- 🌙 **Dark / Light Mode** — Theme toggle saved in localStorage
- 📄 **About Page** — Project information, ML explanation, tech stack

### ML Engine Features
- 🌳 **Decision Tree (CART)** — Classifies reminder priority using Gini Impurity splitting
- 🌲 **Random Forest** — 10-tree ensemble with majority voting for accurate priority classification
- 📈 **Weighted Moving Average** — Predicts next maintenance date from your completion history
- 🏆 **Priority Scoring** — 0–100 score using 7 weighted factors
- 🚨 **Anomaly Detection** — Flags 5 unusual maintenance patterns
- 🔄 **Model Retraining** — Retrain button to update models with latest data

<br>

---

## 🤖 ML Engine

The ML engine is built entirely in **pure JavaScript** — no Python, no TensorFlow, no external ML libraries required.

### Model 1 — Decision Tree (CART Algorithm)
Learns a flowchart of yes/no questions from data using the **CART (Classification and Regression Trees)** algorithm. At each node, it finds the feature and threshold that minimises **Gini Impurity** — a measure of class mixing. Used for both priority classification and maintenance interval regression.

```
Device Age > 36 months?
├── YES → Usage > 8 hrs/day?
│         ├── YES → CRITICAL
│         └── NO  → HIGH
└── NO  → Is it overdue?
          ├── YES → HIGH
          └── NO  → MEDIUM
```

### Model 2 — Random Forest (Ensemble)
Builds **10 Decision Trees**, each trained on a random bootstrap sample with random feature subsets. Final prediction = majority vote across all trees. More accurate than a single tree and resistant to overfitting.

### Model 3 — Weighted Moving Average (Time Series)
Predicts next maintenance date by analysing intervals between past completions. Recent completions carry higher weight. Confidence score improves as more data is collected.

### 8 Features Used by Both Tree Models

| Feature | Description |
|---------|-------------|
| Category Risk | Vehicle=0.90, Computer=0.85, Network=0.80... |
| Task Urgency | Replacement=0.95, Battery=0.90, Backup=0.80... |
| Device Age | Normalised 0–1 (max 60 months) |
| Usage Hours | Normalised 0–1 (max 16 hrs/day) |
| Days Until Due | Negative=future, Positive=overdue |
| Overdue Count | Normalised 0–1 (max 5 overdue tasks) |
| Condition Score | Poor=0, Fair=0.33, Good=0.67, Excellent=1 |
| Warranty Expired | Binary: 0 or 1 |

### Smart Auto-Reminder Knowledge Base
When a device is added, the system reads a built-in knowledge base (like a device manual) with maintenance tasks for 8 categories. Intervals are adjusted per device based on age, usage, condition and warranty status. Optionally enhanced with Google Gemini AI for brand/model-specific reminders.

<br>

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js | Runtime environment |
| Express.js | REST API framework |
| MongoDB + Mongoose | Database and ODM |
| JWT + bcryptjs | Authentication and password hashing |
| Nodemailer | Email notifications |
| node-cron | Scheduled daily email job |
| node-fetch | HTTP requests to AI API |
| nodemon | Development auto-restart |

### Frontend
| Technology | Purpose |
|-----------|---------|
| Vanilla JavaScript | SPA (Single Page Application) |
| Vite | Build tool and dev server |
| CSS3 Custom Properties | Theming and dark/light mode |
| Google Fonts | Syne + Space Mono typography |

### ML Engine
| Component | Implementation |
|-----------|---------------|
| Decision Tree | Pure JS — CART algorithm from scratch |
| Random Forest | Pure JS — 10-tree bootstrap ensemble |
| Weighted Moving Average | Pure JS — time series forecasting |
| Anomaly Detection | Pure JS — rule-based pattern matching |
| Priority Scoring | Pure JS — multi-factor weighted formula |

### Hosting (all free)
| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Cloud database (free 512MB) |
| Render.com | Backend API hosting |
| Vercel | Frontend hosting |
| UptimeRobot | Keep backend awake (ping every 5 min) |

<br>

---

## 📁 Project Structure

```
electromaintain/
│
├── backend/
│   ├── middleware/
│   │   ├── auth.js              # JWT verification middleware
│   │   └── emailCron.js         # Daily 8AM email reminder job
│   │
│   ├── models/
│   │   ├── User.js              # User schema (auth)
│   │   ├── Device.js            # Device schema (brand, model, warranty, custom category)
│   │   └── Reminder.js          # Reminder schema (ML fields included)
│   │
│   ├── routes/
│   │   ├── auth.js              # POST /register, POST /login, GET /me
│   │   ├── devices.js           # CRUD + triggers auto-reminder generation
│   │   ├── reminders.js         # CRUD + complete + stats
│   │   └── ml.js                # All ML endpoints
│   │
│   ├── services/
│   │   ├── mlModels.js          # Decision Tree + Random Forest (from scratch)
│   │   └── smartReminders.js    # Knowledge base + AI-enhanced auto-reminders
│   │
│   ├── server.js                # Express app entry point
│   ├── .env.example             # Environment variable template
│   └── package.json
│
├── frontend/
│   ├── components/
│   │   ├── modal.js             # Reusable modal helper
│   │   └── toast.js             # Toast notification system
│   │
│   ├── pages/
│   │   ├── about.js             # About page
│   │   ├── app.js               # App shell, navbar, theme toggle, router
│   │   ├── auth.js              # Login and Register page
│   │   ├── dashboard.js         # Dashboard with stats and ML summary
│   │   ├── devices.js           # Device management (add, edit, delete)
│   │   ├── mlInsights.js        # Full ML insights with RF + DT visualisations
│   │   └── reminders.js         # Reminder management with filters
│   │
│   ├── styles/
│   │   └── global.css           # All styles + dark/light theme variables
│   │
│   ├── utils/
│   │   └── api.js               # Fetch wrapper with JWT auth header
│   │
│   ├── index.html               # HTML entry point
│   ├── main.js                  # SPA router entry
│   ├── vite.config.js           # Vite configuration + API proxy
│   ├── vercel.json              # Vercel deployment config
│   └── package.json
│
├── render.yaml                  # Render.com deployment config
├── HOSTING_GUIDE.md             # Step-by-step hosting instructions
└── README.md
```

<br>

---

## 🚀 Getting Started

### Prerequisites

Make sure you have these installed:
- [Node.js](https://nodejs.org/) v18 or higher
- [Git](https://git-scm.com/)
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) account

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/electromaintain.git
cd electromaintain
```

### 2. Setup the Backend

```bash
cd backend
npm install
```

Create your environment file:
```bash
cp .env.example .env
```

Open `.env` and fill in your values (see [Environment Variables](#environment-variables) below).

Start the backend server:
```bash
npm run dev
```

You should see:
```
🚀 Server running on port 5000
✅ MongoDB connected
🌲 Training ML models...
✅ ML models trained.
```

### 3. Setup the Frontend

Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:3000**

### 4. Open the App

Go to **http://localhost:3000** in your browser, register an account, and add your first device!

<br>

---

## 🔑 Environment Variables

Create a `.env` file inside the `backend` folder. Use `.env.example` as a template.

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `FRONTEND_URL` | Yes | Your frontend URL for CORS |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Any random secret string for JWT signing |
| `JWT_EXPIRES_IN` | No | Token expiry (default: 7d) |
| `EMAIL_USER` | Yes | Gmail address for sending reminders |
| `EMAIL_PASS` | Yes | Gmail App Password (not your real password) |
| `EMAIL_FROM` | No | Display name for emails |
| `GEMINI_API_KEY` | No | Google Gemini API key for AI-enhanced reminders |

### Getting MongoDB URI
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster → Connect → Drivers → Copy string
3. Replace `<password>` with your database user password
4. Add `/electromaintain` at the end

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/electromaintain
```

### Getting Gmail App Password
1. Enable 2-Step Verification on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Select "Mail" → Generate → Copy the 16-character password

### Getting Gemini API Key (Optional)
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click "Get API Key" → Create API key
3. Copy and paste into `.env`

> **Note:** If `GEMINI_API_KEY` is left blank, the system works perfectly using the built-in knowledge base for auto-reminders.

<br>

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Create new account | No |
| POST | `/api/auth/login` | Login and get token | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PATCH | `/api/auth/me` | Update profile | Yes |

### Devices

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/devices` | Get all my devices | Yes |
| POST | `/api/devices` | Add device + auto-generate reminders | Yes |
| GET | `/api/devices/:id` | Get single device | Yes |
| PATCH | `/api/devices/:id` | Edit device | Yes |
| DELETE | `/api/devices/:id` | Delete device | Yes |
| GET | `/api/devices/:id/reminders` | Get reminders for a device | Yes |

### Reminders

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/reminders` | Get all reminders | Yes |
| POST | `/api/reminders` | Create manual reminder | Yes |
| PATCH | `/api/reminders/:id/complete` | Mark as done | Yes |
| PATCH | `/api/reminders/:id` | Update reminder | Yes |
| DELETE | `/api/reminders/:id` | Delete reminder | Yes |
| GET | `/api/reminders/stats/summary` | Dashboard statistics | Yes |

### ML Engine

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/ml/insights` | Full ML dashboard data | Yes |
| GET | `/api/ml/model-stats` | Training info for DT + RF | Yes |
| GET | `/api/ml/explain/:id` | Decision Tree path explanation | Yes |
| GET | `/api/ml/analyze/:id` | Re-run ML analysis on reminder | Yes |
| POST | `/api/ml/retrain` | Force retrain all models | Yes |
| GET | `/api/ml/anomalies` | Get anomaly flagged reminders | Yes |
| GET | `/api/ml/predict/:deviceId/:taskType` | WMA date prediction | Yes |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server status check |

<br>

---

## ☁ Deployment

This project is designed to be hosted completely free using three services.

### Quick Overview

```
GitHub (code) → Render.com (backend) + Vercel (frontend) + MongoDB Atlas (database)
```

### Full Step-by-Step

See **[HOSTING_GUIDE.md](./HOSTING_GUIDE.md)** for complete deployment instructions including:
- Setting up MongoDB Atlas with correct network access
- Deploying backend to Render.com with all environment variables
- Deploying frontend to Vercel with API URL configuration
- Setting up UptimeRobot to prevent server sleep
- Connecting frontend and backend together
- Custom domain setup (optional)
- Troubleshooting common deployment errors

### One-Click Deploy Buttons

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

<br>

---

## 📸 Screenshots

> *(Add screenshots of your live site here after deployment)*
>
> Recommended screenshots:
> - Dashboard page (dark mode)
> - Dashboard page (light mode)
> - Add Device modal with smart reminder info
> - Reminders page with AUTO badges
> - ML Insights page with RF distribution chart
> - Decision Tree + Random Forest section
> - Email notification screenshot

<br>

---

## 📝 Research Paper

This project is accompanied by a research paper covering:

1. **Problem Statement** — The cost of neglected device maintenance
2. **Literature Review** — Existing maintenance reminder systems
3. **System Architecture** — Full-stack design with REST API
4. **ML Methodology** — CART algorithm, Gini Impurity, Bootstrap sampling
5. **Smart Reminder Engine** — Knowledge base design and interval adjustment
6. **Results** — Model accuracy on synthetic + real data
7. **Future Work** — Neural networks, computer vision, federated learning

### Key Algorithms Covered
- CART (Classification and Regression Trees)
- Gini Impurity calculation
- Bootstrap sampling for Random Forest
- Weighted Moving Average for time series
- Multi-factor scoring model

<br>

---

## 🗺 Roadmap

- [x] User authentication (JWT)
- [x] Device management with full details
- [x] Smart auto-reminder generation
- [x] Decision Tree (CART) implementation
- [x] Random Forest ensemble implementation
- [x] Weighted Moving Average prediction
- [x] Anomaly detection engine
- [x] Email notifications (daily cron job)
- [x] Dark / Light mode toggle
- [x] Google Gemini AI integration
- [x] Public deployment (Vercel + Render)
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] OCR — scan device manual to extract maintenance schedule
- [ ] Computer vision — detect device damage from photo
- [ ] Trained neural network model (when enough real data collected)
- [ ] Offline PWA support

<br>

---

## 🤝 Contributing

Contributions are welcome! If you find a bug or want to add a feature:

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "Add your feature"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

<br>

---

## 📜 License

This project is licensed under the **MIT License** — you are free to use, modify, and distribute it for any purpose including commercial use.

```
MIT License — Copyright (c) 2024
```

<br>

---

## 👨‍💻 Author

**Palak Gupta**

Built as a Project-Based Learning (PBL) submission demonstrating:
- Full-stack web development (Node.js + Vanilla JS)
- REST API design and JWT authentication
- NoSQL database design (MongoDB)
- Machine Learning implementation from scratch (Decision Tree + Random Forest)
- Cloud deployment (Vercel + Render + MongoDB Atlas)

<br>

---

## 🙏 Acknowledgements

- [MongoDB Atlas](https://www.mongodb.com/atlas) — Free cloud database
- [Render.com](https://render.com) — Free backend hosting
- [Vercel](https://vercel.com) — Free frontend hosting
- [Google Gemini](https://aistudio.google.com) — Free AI API for smart reminders
- [Nodemailer](https://nodemailer.com) — Email sending library
- [Google Fonts](https://fonts.google.com) — Syne and Space Mono typefaces

<br>

---

<div align="center">

**⚡ ElectroMaintain — Never Miss a Maintenance Check Again**

*Built with Node.js · MongoDB · Vanilla JS · Custom ML Engine*

</div>