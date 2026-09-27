# Stage 1 Manual Testing Record

## Scope and method

Manual UI testing and local API/database checks were performed on 2026-09-27
during Step 26. The browser was connected to the Vite frontend on port 5174;
the full FastAPI application was running on port 8007 and PostgreSQL was
connected to `cyber_memory_db`. `npm.cmd run build` completed successfully.

This is a record of observed checks, not a substitute for an automated
regression suite. No configured frontend test script or backend test suite was
present in the project at the time of review.

## Verified

- PostgreSQL connection opened to `cyber_memory_db`; all eight expected tables
  existed and incident foreign keys were present for alerts, IOCs, MITRE
  mappings, response actions, and Cyber Memory.
- FastAPI root, `/docs`, `/openapi.json`, resource collection routes, and
  representative detail routes responded. The full OpenAPI document exposed
  26 paths.
- React registration and login worked. Invalid credentials displayed an
  error; empty password input was rejected by frontend validation.
- Dashboard, Incidents, Alerts, IOCs, Logs, MITRE, Response Actions, and Cyber
  Memory pages were opened in the authenticated browser; sidebar navigation
  and browser Back/Forward navigation were exercised.
- Created, viewed, edited, and closed test incident #24.
- Ingested sample logs through the explicit UI action; six records were added.
  Refresh left the displayed total unchanged; log detail showed `login_success`
  and `login_failed` sample events.
- Ran detection and observed brute-force and suspicious-IP detections.
  Detection-and-alert generation created two alerts; linked and edited an
  alert through the UI, and created a manual alert.
- Created and associated IP, Domain, Hash, and URL IOCs with incident #24.
  Viewed, edited, and deleted an IOC. Invalid incident association returned a
  clear UI error. The API response does not currently include an IOC creation
  timestamp.
- Created the T1110 mapping, observed the mapping under incident #24, and
  verified duplicate and invalid-incident errors.
- Created response actions, changed status to Completed, checked the
  incident-specific list, viewed details, and deleted a child action while
  retaining the incident.
- Created Cyber Memory from closed incident #24; verified open-incident and
  duplicate rejection; viewed and edited the record; tested keyword search,
  attack-type search, Clear Search, incident lookup, deletion, and recreation.
- Simulated failed browser requests and observed a friendly dashboard API
  connection message. This simulated network failure; the actual backend
  process was not stopped.
- Checked the PostgreSQL record counts and foreign-key associations after the
  workflow. Incident #24 remained closed and retained its related records.

## Not tested or incomplete

- Actual stop/restart of PostgreSQL, FastAPI, and Vite; database persistence
  across an actual backend restart was not tested.
- Actual process shutdown to test every page's offline behavior. Only a
  simulated failed browser request was checked.
- Exhaustive CRUD and invalid-input scenarios for every API resource.
- Automated frontend browser tests or an automated backend integration suite;
  none was configured/found.
- Production deployment, security hardening, authorization enforcement, load
  testing, and multi-user concurrency.

## Test data intentionally retained

No database reset or automatic cleanup was performed. The database currently
contains demonstration records created during manual testing, including
closed incident #24 and its associated alerts, IOCs, MITRE mapping, response
actions, and Cyber Memory; open incident #25 was used for the closed-incident
rejection test. Sample-log ingestion added six rows to the six previously
stored logs. The test user remains in the database. No credentials are
recorded in this document.
