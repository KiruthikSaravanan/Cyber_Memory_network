# Stage 1 Architecture

## Runtime components

```text
React + Vite
  ├── React Router pages and shared layout
  └── Shared Axios client
          ↓ HTTP / JSON
FastAPI
  ├── API route modules
  ├── Pydantic request/response schemas
  ├── service-layer workflows
  └── SQLAlchemy ORM
          ↓ PostgreSQL driver
PostgreSQL (cyber_memory_db)
```

The FastAPI application is assembled in `backend/app/main.py`. It registers the
authentication, incident, alert, IOC, log, detection, MITRE, response-action,
and Cyber Memory route modules. Development startup creates missing tables
from the SQLAlchemy metadata and loads the supported MITRE seed records.

The React application uses protected routes based on in-memory frontend auth
state. The backend currently does not enforce authentication on the resource
API endpoints, so this is a development prototype and not an authorization
boundary.

## Analyst workflow

```text
Sample JSON security logs
        ↓
Rule-based detection
        ↓
Generated alerts
        ↓
Analyst links alert / creates incident
        ↓
Incident investigation
  ├── IOCs
  ├── MITRE technique mappings
  └── Response-action records
        ↓
Analyst closes incident
        ↓
Create one Cyber Memory record from incident
        ↓
Keyword / attack-type search and incident lookup
```

Log ingestion, detections, alerts, incidents, and memory creation are separate
operations. In particular, the UI does not automatically create an incident
from an alert or close an incident.

## Local services

- FastAPI: `http://127.0.0.1:8007` when launched using the documented command.
- Swagger UI: `http://127.0.0.1:8007/docs`.
- Vite: `http://127.0.0.1:5174` when launched using the documented command.
- PostgreSQL: local connection configured through the root `.env`.
- Shared frontend HTTP client: `frontend/src/services/api.js`; override its
  default backend URL with `VITE_API_BASE_URL`.

See [the root README](../README.md) for setup commands and
[database-design.md](database-design.md) for the persisted entities.
