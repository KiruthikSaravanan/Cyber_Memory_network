# API Endpoint Inventory

This list was checked against the FastAPI route registrations and generated
OpenAPI specification. Swagger UI is available at
`http://127.0.0.1:8007/docs` when the documented local backend command is
running.

## Health

| Method | Path |
|---|---|
| `GET` | `/` |

## Authentication

| Method | Path |
|---|---|
| `POST` | `/auth/register` |
| `POST` | `/auth/login` |

## Incidents

| Method | Path |
|---|---|
| `GET` | `/incidents` |
| `POST` | `/incidents` |
| `GET` | `/incidents/{incident_id}` |
| `PUT` | `/incidents/{incident_id}` |
| `DELETE` | `/incidents/{incident_id}` |

## Alerts

| Method | Path |
|---|---|
| `GET` | `/alerts` |
| `POST` | `/alerts` |
| `GET` | `/alerts/{alert_id}` |
| `PUT` | `/alerts/{alert_id}` |
| `DELETE` | `/alerts/{alert_id}` |

## Indicators of Compromise

| Method | Path |
|---|---|
| `GET` | `/iocs` |
| `POST` | `/iocs` |
| `GET` | `/iocs/{ioc_id}` |
| `PUT` | `/iocs/{ioc_id}` |
| `DELETE` | `/iocs/{ioc_id}` |

## Security Logs

| Method | Path |
|---|---|
| `POST` | `/logs/ingest` |
| `GET` | `/logs` |
| `GET` | `/logs/{log_id}` |

## Detection

| Method | Path |
|---|---|
| `POST` | `/detection/run` |
| `POST` | `/detection/run-and-create-alerts` |

## MITRE ATT&CK mappings

| Method | Path |
|---|---|
| `GET` | `/mitre` |
| `POST` | `/mitre` |
| `GET` | `/mitre/{mapping_id}` |
| `DELETE` | `/mitre/{mapping_id}` |
| `GET` | `/incidents/{incident_id}/mitre` |

## Response actions

| Method | Path |
|---|---|
| `GET` | `/response-actions` |
| `POST` | `/response-actions` |
| `GET` | `/response-actions/{response_action_id}` |
| `PUT` | `/response-actions/{response_action_id}` |
| `DELETE` | `/response-actions/{response_action_id}` |
| `GET` | `/incidents/{incident_id}/response-actions` |

## Cyber Memory

| Method | Path |
|---|---|
| `POST` | `/cyber-memory/from-incident/{incident_id}` |
| `GET` | `/cyber-memory` |
| `GET` | `/cyber-memory/{memory_id}` |
| `PUT` | `/cyber-memory/{memory_id}` |
| `DELETE` | `/cyber-memory/{memory_id}` |
| `GET` | `/incidents/{incident_id}/cyber-memory` |
| `GET` | `/cyber-memory/search?keyword={keyword}` |
| `GET` | `/cyber-memory/search/attack-type/{attack_type}` |

Cyber Memory creation requires a closed incident and rejects a second memory
for the same incident. Error status and response details are documented by the
live OpenAPI schema and should be treated as the source of truth.
