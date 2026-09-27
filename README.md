# Cyber Memory Network: AI-Powered Security Knowledge Graph for Enterprise Defense

## 1. Project Overview

Cyber Memory Network is a local Stage 1 cybersecurity incident-management and
incident-memory prototype. Analysts can manage incidents, alerts, indicators of
compromise (IOCs), security logs, MITRE ATT&CK mappings, and response actions.
When an incident is closed, its investigation record can be preserved as a
Cyber Memory and searched later.

Cyber Memory is a database record derived by the backend from a closed
incident. It preserves the incident's attack type, description, investigation
notes, final solution, and lessons learned. This Stage 1 implementation uses
ordinary PostgreSQL keyword and exact attack-type searches. It does not
implement AI, semantic search, embeddings, or a graph database.

## 2. Problem Statement

Investigation details and remediation lessons can become scattered across
individual incident records. This makes it difficult for analysts to find and
reuse knowledge from previously solved incidents. Cyber Memory Network brings
the relevant response records together and provides simple search to help
analysts find that prior knowledge.

## 3. Objectives

- Manage security incidents and alerts.
- Manage IOCs and associate them with incidents.
- Ingest and view the provided sample security logs.
- Detect configured suspicious patterns using rules.
- Generate alerts from detections.
- Map incidents to supported MITRE ATT&CK techniques.
- Record and track response actions.
- Preserve closed incidents as Cyber Memory.
- Search Cyber Memory records by keyword or attack type.
- Summarize current incidents, alerts, and IOCs on a dashboard.

## 4. Stage 1 Scope

Stage 1 is a working local prototype for development and demonstration. It is
not a production SOC platform. The UI uses a client-side login state for
navigation; backend API routes are not protected by an authentication/session
authorization layer. Do not expose this development service to an untrusted
network.

## 5. System Architecture

```text
Sample Security Logs
        ↓
Rule-Based Threat Detection
        ↓
Alerts
        ↓
Incident Management
        ↓
Investigation
        ↓
IOCs + MITRE ATT&CK + Response Actions
        ↓
Close Incident
        ↓
Cyber Memory
        ↓
Cyber Memory Search
        ↓
React Dashboard

React + Vite  →  FastAPI  →  SQLAlchemy  →  PostgreSQL
```

The existing components are organized by application responsibility; the
diagram describes the analyst workflow, not a requirement that every record
must be created automatically by the preceding step.

## 6. Technology Stack

| Area | Technologies |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL |
| Frontend | React, Vite, JavaScript |
| HTTP client | Axios |
| API exploration | FastAPI Swagger UI (`/docs`) |
| Local development | VS Code / Antigravity, Git / GitHub |

## 7. Main Modules

The UI pages are protected by client-side navigation and available after
logging in. The underlying API remains a development API and does not require
an authenticated bearer token.

### Authentication

Registration and login are available at `/register` and `/login`. The backend
hashes passwords using `pwdlib`'s recommended password hashing configuration;
login verifies the submitted password against its stored hash. The frontend
does not persist the password. This prototype has no server-side session/JWT
authorization for the other API routes.

Endpoints: `POST /auth/register`, `POST /auth/login`.

### Incident Management

Create, list, inspect, update, and delete incidents. An incident tracks
severity, status, attack type, source, investigation details, and solution
notes.

Endpoints: `GET/POST /incidents`, `GET/PUT/DELETE /incidents/{incident_id}`.

### Alert Management

View and manage alerts, including optional association to an existing
incident. Alerts can be created manually or by the detection workflow.

Endpoints: `GET/POST /alerts`, `GET/PUT/DELETE /alerts/{alert_id}`.

### IOC Management

Create, list, inspect, update, and delete IP, Domain, Hash, and URL indicators.
An IOC may optionally reference an incident.

Endpoints: `GET/POST /iocs`, `GET/PUT/DELETE /iocs/{ioc_id}`.

The current API response schema does not expose a `created_at` field for IOCs.

### Security Logs

The explicit ingestion action reads `sample_logs/security_logs.json`, stores
its entries, and supports listing and viewing stored logs. Opening or
refreshing the page does not ingest logs.

Endpoints: `POST /logs/ingest`, `GET /logs`, `GET /logs/{log_id}`.

The sample ingestion endpoint inserts the supplied entries each time it is
called; repeated manual ingestion may create duplicate rows.

### Threat Detection

The detection engine evaluates stored log data using fixed rules. The rules
are deterministic and are not machine learning; their current definitions are
listed in [Threat Detection](#9-threat-detection).

Endpoints: `POST /detection/run`, `POST /detection/run-and-create-alerts`.
The second endpoint creates alerts for detections unless an open alert with the
same alert type and source already exists.

### Automatic Alert Generation

The detection-and-alert endpoint returns detections and any newly created
alerts. Generated alerts are not automatically converted into incidents.

Endpoint: `POST /detection/run-and-create-alerts`.

### MITRE ATT&CK

Mappings associate a supported technique with an incident. The backend seed
catalog currently supports T1110 (Brute Force), T1566 (Phishing), T1059
(Command and Scripting Interpreter), and T1071 (Application Layer Protocol).
`GET /mitre` returns saved mappings, not the technique catalog.

Endpoints: `POST/GET /mitre`, `GET /mitre/{mapping_id}`,
`GET /incidents/{incident_id}/mitre`, `DELETE /mitre/{mapping_id}`.

### Response Actions

Record, inspect, update, and delete analyst-entered response-action records.
These records do not run firewall or endpoint actions.

Endpoints: `GET/POST /response-actions`,
`GET/PUT/DELETE /response-actions/{response_action_id}`,
`GET /incidents/{incident_id}/response-actions`.

### Cyber Memory

Create a memory from a closed incident, view memories, and update or delete a
memory without deleting its incident. The backend copies the source incident
fields; the frontend does not construct the memory.

Endpoints: `POST /cyber-memory/from-incident/{incident_id}`,
`GET /cyber-memory`, `GET /cyber-memory/{memory_id}`,
`GET /incidents/{incident_id}/cyber-memory`,
`PUT /cyber-memory/{memory_id}`, `DELETE /cyber-memory/{memory_id}`.

### Cyber Memory Search

Keyword search looks through attack type, summary, investigation findings,
final solution, and lessons learned. Attack-type search matches the stored
attack type without regard to case. These are database searches, not semantic
or vector searches.

Endpoints: `GET /cyber-memory/search?keyword={keyword}`,
`GET /cyber-memory/search/attack-type/{attack_type}`.

### Dashboard

The dashboard summarizes incidents, open incidents, critical alerts, and
IOCs, and displays recent activity. It fetches its data from the existing
incident, alert, and IOC endpoints.

## 8. Database Design

The SQLAlchemy models create these eight tables:

| Table | Purpose and key relationships |
|---|---|
| `users` | Analyst account fields: `id`, `username`, `email`, `password_hash`, `created_at`. |
| `incidents` | Incident details, severity/status, attack/source fields, detection time, analyst, investigation notes, solution, lessons, and creation time. |
| `alerts` | Alert type, severity, timestamp, source, description, status; optional `incident_id` references `incidents.id`. |
| `logs` | Timestamp, username, source IP, event type, and JSON `raw_data`. |
| `iocs` | Type, value, threat level, description; optional `incident_id` references `incidents.id`. |
| `mitre_mappings` | Technique ID/name, tactic, description, and required `incident_id` reference. An incident-technique pair is unique. |
| `response_actions` | Action, description, status, creation time, and required `incident_id` reference. |
| `cyber_memory` | Required incident reference plus attack type, summary, investigation findings, final solution, lessons learned, and creation time. At most one memory per incident. |

An incident can have multiple alerts, IOCs, MITRE mappings, and response
actions. Alerts and IOCs may also be unassociated. A Cyber Memory belongs to
one incident, and the database enforces at most one memory per incident. Logs
are stored independently. See [docs/database-design.md](docs/database-design.md)
for the full model field inventory.

## 9. Threat Detection

The existing rule-based detection service currently checks:

- **Brute force:** five or more failed login events for the same username and
  source IP within a five-minute window.
- **Suspicious IP:** log activity associated with `192.168.1.100`.
- **Malicious hash:** occurrence of
  `d41d8cd98f00b204e9800998ecf8427e` in stored log JSON data.

These checks are deterministic rules, not machine learning or threat
intelligence. `POST /detection/run` returns detections.
`POST /detection/run-and-create-alerts` also persists alerts for detections
unless an open alert already has the same type and source.

## 10. Cyber Memory Workflow

```text
Incident
  → Investigation
  → IOC / MITRE mapping / response-action records
  → Analyst closes incident
  → Create Cyber Memory from the closed incident
  → Search saved knowledge later
```

The backend copies the source incident's attack type, description,
investigation notes, final solution, and lessons learned into a separate
Cyber Memory record. A source incident must have status `Closed`, and a
unique constraint prevents multiple memories for one incident. Editing or
deleting the memory does not itself edit or delete the incident. Keyword and
attack-type search use database queries and do not infer semantic similarity.

## 11. API Documentation

FastAPI generates interactive documentation from the actual registered routes:

- Swagger UI: `http://127.0.0.1:8007/docs`
- OpenAPI JSON: `http://127.0.0.1:8007/openapi.json`

The route inventory is in [docs/api-documentation.md](docs/api-documentation.md).

## 12. Installation and Running (Windows PowerShell)

### Prerequisites

- Python 3.11 or later (the application uses Python `StrEnum`).
- Node.js and npm.
- PostgreSQL running locally, with the `cyber_memory_db` database created.

### Configure PostgreSQL

From the project root, create a local environment file from the placeholder
template and set the password for your own PostgreSQL installation:

```powershell
Copy-Item .env.example .env
notepad .env
```

Do not commit `.env`. The backend reads `POSTGRES_USER`, `POSTGRES_PASSWORD`,
`POSTGRES_HOST`, `POSTGRES_PORT`, and `POSTGRES_DB` from that file. If the
database has not yet been created, create `cyber_memory_db` using your local
PostgreSQL administration tool before starting the backend.

### Set up and start FastAPI

In a PowerShell terminal from the project root:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Set-Location backend
python -m uvicorn app.main:app --reload --port 8007
```

The application's development startup creates missing tables and loads the
MITRE technique seed. The API connects to the existing database; it does not
create the PostgreSQL database itself.

### Start React + Vite

Open a second PowerShell terminal:

```powershell
Set-Location "D:\Cyberseurity project and portfolio\Cyber memeory network\frontend"
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 5174
```

The shared Axios client defaults to `http://127.0.0.1:8007`. If the backend is
running elsewhere, set `VITE_API_BASE_URL` in `frontend/.env` before starting
Vite. The backend CORS configuration currently allows the local Vite origins
on ports 5173 and 5174.

### Open the application

- Frontend: `http://127.0.0.1:5174`
- Register an analyst account at `/register`, then sign in at `/login`.
- Dashboard: `http://127.0.0.1:5174/dashboard`
- API documentation: `http://127.0.0.1:8007/docs`

The account registration and login APIs do not issue an access token; frontend
authentication currently controls only the client-side page navigation.

## 13. Testing

Manual integration checks were performed during Step 26 on the local
application. The recorded results and limits are listed in
[docs/testing.md](docs/testing.md). There is no configured automated test
script in the frontend package manifest, and no backend test suite was found
in the project test folder at review time.

## 14. Screenshots

No screenshots are included yet. Capture real application screenshots and
place them in a `screenshots/` directory before adding image links here.

- [ ] Login
- [ ] Dashboard
- [ ] Incident Management
- [ ] Alerts
- [ ] IOCs
- [ ] Security Logs
- [ ] MITRE ATT&CK
- [ ] Response Actions
- [ ] Cyber Memory
- [ ] Cyber Memory Search
- [ ] Swagger API documentation

## 15. Limitations

- Local development prototype; not hardened or deployed for production use.
- Frontend login state is client-side only; API endpoints have no authentication
  authorization dependency.
- Detection is based on a small set of fixed, rule-based indicators and sample
  logs.
- MITRE technique mapping is limited to four seeded technique IDs.
- The sample log ingestion flow reads a local JSON file and may insert repeated
  rows on each explicit ingest.
- IOC API responses currently omit a creation timestamp.
- No semantic/vector search, AI reasoning, threat-intelligence feed, SIEM
  integration, or automated SOAR action is implemented.
- No centralized multi-company Cyber Memory service is implemented.

## 16. Future Scope — Stage 2

The following are future work only; they are not part of the Stage 1
implementation:

- AI-assisted incident summaries and recommendations.
- Semantic Cyber Memory search, embeddings, and retrieval-augmented generation.
- A knowledge graph backed by Neo4j.
- Threat-intelligence integration and risk scoring.
- AWS CloudTrail or other cloud log ingestion.
- Advanced analytics and a centralized Cyber Memory server.

## 17. Project Team

- Kiruthik S — 23TD0348
- Kapilan P — 23TD0343
- Sachin K — 23TD0391

- **Department:** B.Tech Computer Science and Engineering
- **College:** Manakula Vinayagar Institute of Technology
- **Guide:** S Kishor
- **Academic Year:** 2026–2027
