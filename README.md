# 🏭 Industrial Safety Intelligence System

> Explainable, Context-Aware AI for Real-Time Industrial Safety Decision Support

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Status](https://img.shields.io/badge/Project-Hackathon-orange)

---

## 📖 Overview

Industrial accidents rarely occur because a single sensor exceeds a threshold. They develop when multiple weak warning signals combine over time—for example:

- Rising gas concentration
- Increasing equipment vibration
- Pressure fluctuations
- Worker proximity
- Active hot-work permits
- Equipment degradation

Traditional industrial safety systems monitor these signals independently, generating numerous isolated alarms that contribute to alarm fatigue and delayed operator response.

The **Industrial Safety Intelligence System** transforms raw industrial data into **prioritized, explainable, and actionable safety intelligence** by combining sensor data, computer vision, and operational context into a unified decision-support platform.

> **Decision Support Only — Final control actions always remain with the human operator.**

---

# 🚀 Key Features

- 📡 Multi-modal Data Fusion
- 📷 CCTV & Thermal Camera Integration
- 📈 Real-Time Hazard Monitoring
- 🧠 AI-based Hazard Scenario Detection
- ⚠️ Context-Aware Risk Prioritization
- 🔍 Explainable AI (XAI)
- 💡 Decision Support Recommendations
- 📜 Safety Timeline & Digital Safety Log

---

# 🏗 System Architecture

```
Industrial IoT Sensors
CCTV Cameras
Thermal Cameras
PLC / SCADA
Work Permits
Asset Information
        │
        ▼
Multi-Modal Data Fusion
        │
        ▼
Real-Time Monitoring
        │
        ▼
Scenario & Contributing Factor Detection
        │
        ▼
Risk Assessment
(Severity + Confidence)
        │
        ▼
Alert Prioritization
        │
        ▼
Explainable AI Layer
        │
        ▼
Decision Support
        │
        ▼
Dashboard + Safety Timeline + Digital Safety Log
```

---

# 🧠 AI Components

### Hazard Detection

- Rule-based threshold detection
- Statistical trend analysis
- Multi-modal event fusion

### Computer Vision

- YOLOv8
- Worker Detection
- PPE Detection
- Zone Occupancy

### Risk Assessment

- Random Forest / XGBoost
- Severity Classification
- Confidence Score

### Explainable AI

- SHAP Feature Importance
- Rule-based reasoning
- Visual evidence from CCTV

---

# 📊 Dashboard Modules

- Plant Overview
- Live Sensor Monitoring
- CCTV View
- Thermal View
- Top Priority Alerts
- Risk Prioritization
- Explainable AI Panel
- Decision Support
- Safety Timeline
- Digital Safety Log

---

# 🛠 Tech Stack

## Backend

- Python
- FastAPI / Flask
- SQLite

## Machine Learning

- Scikit-learn
- XGBoost
- SHAP

## Computer Vision

- YOLOv8
- OpenCV

## Data Processing

- Pandas
- NumPy

## Dashboard

- Streamlit

---

# ⚙ Installation

Clone the repository

```bash
git clone https://github.com/anjali18102005/Industrial-Safety-Intelligence.git
```

Go into the project

```bash
cd Industrial-Safety-Intelligence
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run the application

```bash
streamlit run app.py
```

---

# 📈 Workflow

```
Industrial Data
      │
      ▼
Data Fusion
      │
      ▼
Hazard Detection
      │
      ▼
Scenario Detection
      │
      ▼
Risk Assessment
      │
      ▼
Explainable AI
      │
      ▼
Decision Support
      │
      ▼
Dashboard
```

---

# 🎯 Example Use Case

A gas concentration begins increasing in **Zone A-12**.

The system also detects:

- Pressure drop
- Valve degradation
- Active hot-work permit
- Three workers inside the hazard zone

Instead of generating four separate alarms, the AI combines all evidence and identifies:

**Scenario**

> Gas Leak

**Risk**

> Critical (94% Confidence)

**Recommendation**

- Evacuate Zone A-12
- Suspend Hot Work
- Notify Safety Team
- Inspect Valve V-12

---

# 📌 Current Scope

✅ Multi-modal monitoring

✅ Explainable AI

✅ Decision Support

✅ Risk Prioritization

✅ Safety Timeline

---

# 🔮 Future Work

- Digital Twin Integration
- Incident Learning
- Predictive Hazard Evolution
- Edge AI Deployment
- Federated Learning
- Mobile Operator Application

---



---

⭐ If you found this project useful, consider giving it a star!
