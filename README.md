# 📖 Lost & Found Campus System (AI-Powered)

This repository contains the full-stack code for the university's centralized, AI-powered Lost & Found web application.

## Project Overview

This system streamlines item recovery on campus by replacing manual processes with a secure, intelligent, and centralized web platform.

* **Solution Core:** A full-stack application leveraging client-side presentation and a secure, cloud-based API.
* **Key Feature:** **AI-Powered Semantic Matching** - Uses advanced text embeddings to compare item descriptions based on meaning rather than just keywords, significantly improving match rates.

---

## Technology Stack

| Component | Technology | Purpose |
| Frontend | React | User Interface for reporting, viewing, and searching items. |
| Backend | Node.js, Express.js | Core REST API framework (Vercel Serverless Functions). |
| Database | Google Cloud Firestore | NoSQL database for item records and user profiles. |
| Authentication | Firebase Authentication | User identity management and token verification. |
| AI/Matching | Google Cloud Vertex AI | Generates text vector embeddings (`text-embedding-004`). |
| Storage | Google Cloud Storage (GCS) | Secure, public hosting for all user-uploaded item images. |
| Deployment | Vercel | Hosting environment for the separate API project. |

---

## Setup and Installation (LocalRun)

### 1. Prerequisites

* Node.js (v18+) and npm
* A configured **Firebase Project** with required services (Firestore, Auth, GCS, Vertex AI).
* A **Service Account Key** with necessary permissions.

### 2. Environment Variables (Local Run)

Create a file named `.env` in the root directory and populate it with your configuration details. **The `FIREBASE_PRIVATE_KEY` must be a single line with escaped newlines (`\n`)**.

# --- FIREBASE / GCP CONFIGURATION ---
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_CONTENT_HERE\\n-----END PRIVATE KEY-----\\n"
FIREBASE_CLIENT_EMAIL="your-client-email@your-project-id.iam.gserviceaccount.com"
FIREBASE_WEB_API_KEY="your-project-web-api-key"

# --- EMAIL CONFIGURATION (Nodemailer) ---
EMAIL_USER="your-alert-email@gmail.com"
EMAIL_PASS="your-gmail-app-password"

### 3. Running Locally
You must run two processes. The frontend must be configured to fetch data from the backend's local port (http://localhost:3000).

1. Start the Backend API
This starts the Express server which handles all data and AI processing.

# Terminal 1: Install dependencies and start the backend
cd backend
npm install
npm start
Backend Status: The API server will be running on http://localhost:3000.

2. Start the Frontend
Open a new terminal window and run the client application.

# Terminal 2: Install dependencies (if not done) and start the frontend
cd frontend
npm install 
npm start
Frontend Status: The client application will start, typically on a separate port (http://localhost:3001), and will direct all API requests to the backend at http://localhost:3000.

---

## Vercel Deployment (Dual Project)
Frontend	User Interface (Client)	        https://lostnfound-phi.vercel.app
Backend	    Core Server Logic (Server)	    https://losthub-backend.vercel.app