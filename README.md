# CyberShield XDR — Cybersecurity Incident Response Portal

**CyberShield XDR** is a functional, production-style Extended Detection and Response (XDR) and Security Operations Center (SOC) command-center monitoring platform. It collects real-time endpoint security telemetry, correlates events against detection rules, matches IOCs against threat intelligence feeds, and alerts SOC analysts of active compromise sequences.

Built as a portfolio demonstration for security engineering and SOC analyst interviews, this project connects a React UI client to a FastAPI backend engine using a local SQLite/PostgreSQL relational database.

---

## Key Core Features
* **Interactive Command Center**: Real-time SOC dashboard calculating host states, alert distributions, and incident queues dynamically from database logs (no mock hardcoded numbers).
* **SOC Telemetry Ingestion API**: Structured ingestion endpoint accepting system processes, network connection sockets, and authentication attempts.
* **Correlation Detection Engine**: Dynamic EDR/SIEM rules evaluating events against triggers (e.g. Brute Force, Port Scans, Suspicious PowerShell, Threat Intel IOC matches, and Multi-Event Intrusion Sequences).
* **Identity & Access Management Directory**: Dynamic admin dashboard to promote/demote analyst roles, activate/deactivate SOC portal users, and track platform action audits.
* **MITRE ATT&CK Mapping**: Automatic tactics/techniques tagging on security alerts for streamlined investigations.
* **Controlled Endpoint Agent Simulator**: Python sensor script simulating heartbeats, process spawner simulations, and C2 callbacks.

---

## System Architecture

```text
                ┌──────────────────────┐
                │ Windows/Linux Agents │
                └──────────┬───────────┘
                           │ (Telemetry Stream)
                           ▼
                ┌──────────────────────┐
                │ Event Collection API │
                │      FastAPI         │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ Event Processing     │
                │ Detection Engine     │
                └──────────┬───────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
      ┌──────────────┐           ┌──────────────┐
      │  SQLite/Postgres  │      │ Threat Intel │
      └──────────────┘           └──────────────┘
             │
             ▼
      ┌──────────────┐
      │ Alert Engine │
      └──────┬───────┘
             ▼
      ┌──────────────┐
      │   Incidents  │
      └──────┬───────┘
             ▼
      ┌──────────────┐
      │ React SOC UI │
      └──────────────┘
```

---

## Local Setup & Installation Instructions

Follow these instructions to run the application locally on a Windows machine.

### Prerequisites
* Python 3.11 or higher
* Node.js (v18 or higher) & npm

### Setup Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/<YOUR_GITHUB_USERNAME>/cybershield-xdr.git
cd cybershield-xdr
```

#### 2. Configure Environment Secrets
Create a `.env` file inside the `backend` directory matching the following configuration:
```env
# Database Settings (Uses SQLite locally)
DATABASE_URL=sqlite:///./cybershield.db

# JWT Security Configurations
JWT_SECRET_KEY=45e59b2d8614fb38e6583907c08a9c2d15fb38e6583907c08a9c2d15fb38e658
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Initial Platform Seeding Credentials
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@cybershield.com
ADMIN_PASSWORD=adminpassword123
```

#### 3. Run the Automator Startup Orchestrator
Execute the startup script in your PowerShell console. This script automatically starts the backend server on port `8000` and the Vite client on port `5173`:
```powershell
.\start.ps1
```

#### 4. Access and Navigate the SOC Portal
* Open your browser and navigate to: `http://localhost:5173`
* Log in using your configured administrator credentials:
  * **Username**: `admin` (or your custom `ADMIN_USERNAME`)
  * **Password**: `adminpassword123` (or your custom `ADMIN_PASSWORD`)

---

## Simulating Security Alerts (Real-Time Ingestion)

To simulate active attacks and see them pop up on the dashboard in real-time, run the Python telemetry simulator script in a separate terminal:

```powershell
# Run the batch telemetry ingestion script
.\backend\venv\Scripts\python.exe generate_alerts.py
```
This script will send payloads to trigger:
* Brute Force Attack Alerts
* Network Service Scanning (Port Scans)
* Suspicious PowerShell Activity
* Threat Intelligence C2 IP Matches

---

## Tech Stack
* **Backend**: FastAPI (Python), SQLAlchemy, Uvicorn, SQLite/PostgreSQL
* **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios
* **Testing**: Pytest
