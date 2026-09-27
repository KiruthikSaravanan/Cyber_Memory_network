# Seven-Minute Stage 1 Demo Script

Use the running local application, not mockups or fabricated screenshots.
Start PostgreSQL, FastAPI, and Vite using the commands in the root README
before the presentation. Swagger is available at
`http://127.0.0.1:8007/docs`.

| Time | Demo action and talking point |
|---|---|
| 0:00–0:30 | **Problem.** Explain how investigation findings are scattered across cases and why teams need to reuse prior response knowledge. Introduce Cyber Memory as a record derived from a closed incident, not an AI feature. |
| 0:30–0:50 | **Login.** Sign in using the presenter's own local analyst account. Do not show or read the password aloud. |
| 0:50–1:20 | **Dashboard.** Point out the incident, open-incident, critical-alert, and IOC summaries and recent activity. |
| 1:20–1:55 | **Logs.** Open Security Logs; show the real sample `login_failed` events and explain that ingestion is an explicit button action. Do not click ingestion repeatedly just to refresh the display. |
| 1:55–2:40 | **Detection and alerts.** Run the existing detection workflow and show the brute-force / suspicious-IP detection and generated alerts. Explain that the rules are simple and deterministic, not machine learning. |
| 2:40–3:25 | **Incident.** Open the retained closed demonstration incident. Show its investigation, severity, and status without creating duplicate demonstration records. |
| 3:25–3:55 | **IOC.** Show the IP indicator associated with the demonstration incident. Mention the supported IP, Domain, Hash, and URL types. |
| 3:55–4:25 | **MITRE ATT&CK.** Show the T1110 (Brute Force) mapping. Explain that the local prototype supports a limited seeded technique set. |
| 4:25–4:55 | **Response action.** Show the recorded response action and its Completed status. Clarify that the record documents an action; it does not execute a firewall or endpoint operation. |
| 4:55–5:15 | **Incident closure.** Show that the source incident is Closed. Cyber Memory creation is only allowed after closure. |
| 5:15–5:45 | **Cyber Memory.** Open the memory associated with the incident and show Summary, Investigation Findings, Final Solution, and Lessons Learned. |
| 5:45–6:30 | **Search.** Search `Brute Force`, search by attack type, clear the search, and look up the memory by incident ID. |
| 6:30–7:00 | **Stage 2.** Explain that AI summaries, semantic search, Neo4j, threat-intelligence integrations, and cloud ingestion are future work, not implemented features. |

## Demo data guidance

The local database has retained sample and demonstration data. The Step 26
verification incident was #24 when recorded, but IDs can differ after
database changes. Confirm the target incident ID and status in the live UI
before the presentation. It is currently closed and has a Cyber Memory, so
the demo can use the existing record without creating duplicates.

The current development login has no production session authorization; use
only a local demonstration environment. Never put a real password, `.env`
file, or access secret in slides, screenshots, or a recording.
