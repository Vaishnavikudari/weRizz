# MAVORA — Intelligent Memory & Compassionate Care Companion

<p align="center">
  <img src="frontend/public/vite.svg" width="80" alt="Mavora Logo" />
</p>

<p align="center">
  <em>"Your intelligent second memory."</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-black?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-black?style=flat-square&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Qdrant-Vector_Database-black?style=flat-square&logo=qdrant" alt="Qdrant" />
  <img src="https://img.shields.io/badge/Edge_TTS-Neural_Voices-black?style=flat-square" alt="Edge TTS" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-black?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-black?style=flat-square" alt="License" />
</p>

---

## 📖 Overview

**MAVORA** is an empathetic, multimodal AI companion engineered to act as an external memory bank for individuals living with Alzheimer's disease, dementia, and cognitive impairment. 

By combining real-time computer vision, vector similarity search, neural text-to-speech, and large language models, Mavora provides gentle, context-aware memory assistance to patients while giving family caregivers 24/7 visibility, wandering alerts, and medication synchronizations.

---

## ✨ Key Features

### 🧠 1. Biometric Memory Bank & Multimodal Recognition
* **Facial Recognition**: Identifies loved ones, family members, doctors, and caregivers through real-time camera frames or photos using vector embeddings stored in **Qdrant**.
* **Object Identification**: Helps patients locate everyday essentials like keys, eyeglasses, pillboxes, and walking sticks.
* **Familiar Voice Reassurance**: Caregivers can record personal audio greetings (*"Hello Dad, it's Rahul. You are safe at home."*) that whisper to the patient whenever disorientation or anxiety is detected.

### 🗣️ 2. Native Multilingual Support
* Fluid conversational understanding in **English**, **ಕನ್ನಡ (Kannada)**, and **हिन्दी (Hindi)**.
* High-definition Microsoft Edge neural voices:
  * **Kannada**: `kn-IN-SapnaNeural`
  * **Hindi**: `hi-IN-SwaraNeural`
  * **English**: `en-IN-NeerjaNeural`
* Automatic script detection and phonetically accurate voice responses.

### 🗺️ 3. Safety Geofencing & Live GPS Navigation
* **Caregiver Safe Zone**: Configurable perimeter radius (50m to 1000m) around the home base.
* **Autonomous Wandering Alerts**: Immediate caregiver alerts if the patient wanders beyond the designated safe perimeter.
* **One-Tap "Guide Me Home"**: Turn-by-turn walking navigation and soothing audio directions for disoriented patients.

### 💊 4. Daily Medication & Routine Management
* Live bi-directional synchronization between the Caregiver Portal and Patient Tablet.
* Clean, non-intrusive pill confirmation designed specifically for seniors with memory loss.
* Multi-tier reassurance notifications that prevent double-dosing.

### 🛡️ 5. Hallucination Prevention & Strict Boundary Checks
* Prevents false associations — asking about daily medicines or unknown objects will never hallucinate or return unrelated family memories.
* Grounded fallback handling directs the patient to real-world caregiver verification when information is unknown.

### 🎨 6. Editorial Minimalist Design
* Clean, distraction-free pitch-black aesthetic tailored for visual clarity.
* High-contrast editorial typography powered by **The Seasons** & **Instrument Serif**.

---

## 🛠️ Architecture & Tech Stack

* **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Three.js, Framer Motion.
* **Backend**: FastAPI (Python 3.10+), Uvicorn, WebSockets.
* **Vector Database**: Qdrant (Cloud / Local vector search for facial and object embeddings).
* **LLM & Inference**: LLaMA 3 via Groq high-speed inference engine.
* **Text-to-Speech**: Microsoft Edge Neural TTS (`edge-tts`).
* **Computer Vision**: OpenCV, FaceNet embeddings, YOLO object detection.

---

## 🚀 Quickstart Guide

### 1. Clone the Repository
```bash
git clone https://github.com/Vaishnavikudari/weRizz.git
cd weRizz
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cd ..
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

```ini
# Qdrant Vector Database
QDRANT_MODE=server
QDRANT_URL=https://your-cluster.qdrant.tech
QDRANT_API_KEY=your_qdrant_api_key

# Groq Cloud API
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 5. Run the Application

**Terminal 1 (Backend API):**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*API available at `http://localhost:8000` (Docs at `http://localhost:8000/docs`)*

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
```
*Application available at `http://localhost:5173`*

---

## 👩‍💻 Author & Project Maintainer

* **Vaishnavikudari** — [GitHub Profile](https://github.com/Vaishnavikudari)
* Project Repository: [weRizz](https://github.com/Vaishnavikudari/weRizz)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
