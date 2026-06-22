# BioShield Portal - Animal Health Biosecurity Management Platform

BioShield is a modern, responsive, and mobile-first web portal built to empower pig and poultry farmers with practical biosecurity tools, compliance audits, training modules, real-time alerts, and AI-powered diagnostic guidance.


## 📸 Project Preview

<p align="center">
  <img src="docs/screenshots/Screenshot%202026-06-22%20121200.png" width="45%">
  <img src="docs/screenshots/Screenshot%202026-06-22%20121225.png" width="45%">
</p>

<p align="center">
  <img src="docs/screenshots/Screenshot%202026-06-22%20121247.png" width="45%">
  <img src="docs/screenshots/Screenshot%202026-06-22%20121252.png" width="45%">
</p>
## Architecture & Features

This platform is structured as a full-stack JavaScript application:

1. **Frontend (React + Vite + Lucide)**
   - **Modern Aesthetic Dashboard**: Dark slate glassmorphism design with real-time risk gauges, alerts, and accreditation tracking widgets.
   - **Tailored Risk Assessment**: Custom surveys for poultry (wild bird containment, water purification, quarantine) and swine (African Swine Fever swill prevention, visitor downtime).
   - **National Compliance Tracker**: Guided checklists aligned with FAO/WOAH compartment recognition criteria.
   - **Training Academy**: Segregation, cleaning, and disinfection tutorials with built-in quiz certification.
   - **Community Forums**: Live message board for farmers, veterinarians, and extension officers to report local cases and coordinate responses.
   - **Multilingual Switcher**: Instant localization in English, Swahili, Spanish, and Vietnamese.

2. **Backend (Node.js + Express + Gemini AI)**
   - **Persistent Storage**: Automated local JSON database storage that writes to `database.json` on disk, requiring no external database installs.
   - **AI Specialist Agent**: Intelligent assistant that leverages the Google Gemini API. If the API key is absent, the backend deploys a smart local biosecurity rules engine fallback.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: Ensure you have Node.js installed (v18 or higher recommended).

### 2. Installation
Install all dependencies for the root, frontend, and backend using the custom install script:
```bash
npm run install:all
```

### 3. Adding Your API Key
To enable the full capabilities of the Gemini AI Veterinary Assistant:
1. Open the file `backend/.env`.
2. Locate the line: `GEMINI_API_KEY=`
3. Paste your Gemini API key:
   ```env
   GEMINI_API_KEY=your_key_here
   ```
4. Save the file. The server will automatically reload.

### 4. Running the Application
Launch both the React dev server and the Express backend simultaneously with:
```bash
npm run dev
```

The application will launch on:
- **Frontend URL**: [http://localhost:5173](http://localhost:5173)
- **Backend URL**: [http://localhost:5000](http://localhost:5000)

---

## File Directory Map

```text
biosecurity-portal/
├── backend/
│   ├── .env                 # Environment configurations (Port, Gemini API key)
│   ├── server.js            # Express API server, endpoints & AI fallback logic
│   ├── database.json        # Persistent local data file (generated on start)
│   └── package.json         # Backend node scripts & dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Root React app, state coordinators & UI tabs
│   │   ├── translations.js  # Language definitions (EN, SW, ES, VI)
│   │   ├── index.css        # Premium custom styles (colors, layout, animations)
│   │   └── main.jsx         # Render entrypoint
│   ├── index.html           # Main HTML shell with SEO metadata
│   ├── vite.config.js       # Vite bundler options
│   └── package.json         # Frontend modules & Lucide package
├── package.json             # Root orchestrator with prefix scripts
└── README.md                # Documentation guide
```
