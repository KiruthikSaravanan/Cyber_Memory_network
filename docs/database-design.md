# Database Design

This inventory follows the SQLAlchemy models under `backend/app/models/`.
Nullable fields are marked optional. Database-generated creation timestamps
use server defaults where shown by the model. PostgreSQL column types are
summarized for readability.

## Tables

### `users`

| Column | Model type | Notes |
|---|---|---|
| `id` | integer | Primary key |
| `username` | string(100) | Unique, indexed |
| `email` | string(255) | Unique, indexed |
| `password_hash` | string(255) | Hashed password, never plaintext |
| `created_at` | timestamp with time zone | Server-generated |

### `incidents`

| Column | Model type | Notes |
|---|---|---|
| `id` | integer | Primary key |
| `title` | string(255) | Required |
| `description` | text | Optional |
| `severity` | string(50) | Required |
| `status` | string(50) | Required |
| `attack_type` | string(100) | Optional |
| `source` | string(255) | Optional |
| `detection_time` | timestamp with time zone | Optional |
| `assigned_analyst` | string(255) | Optional |
| `investigation_notes` | text | Optional |
| `final_solution` | text | Optional |
| `lessons_learned` | text | Optional |
| `created_at` | timestamp with time zone | Server-generated |

### `alerts`

| Column | Model type | Notes |
|---|---|---|
| `id` | integer | Primary key |
| `alert_type` | string(100) | Required |
| `severity` | string(50) | Required |
| `timestamp` | timestamp with time zone | Server default |
| `source` | string(255) | Optional |
| `description` | text | Optional |
| `status` | string(50) | Required |
| `incident_id` | integer | Optional foreign key to `incidents.id`, indexed |

### `logs`

| Column | Model type | Notes |
|---|---|---|
| `id` | integer | Primary key |
| `timestamp` | timestamp with time zone | Server default |
| `username` | string(100) | Optional |
| `source_ip` | string(45) | Optional |
| `event_type` | string(100) | Optional |
| `raw_data` | JSON | Optional |

### `iocs`

| Column | Model type | Notes |
|---|---|---|
| `id` | integer | Primary key |
| `type` | string(100) | Required |
| `value` | string(512) | Required, indexed |
| `threat_level` | string(50) | Optional in the model |
| `description` | text | Optional |
| `incident_id` | integer | Optional foreign key to `incidents.id`, indexed |

### `mitre_mappings`

| Column | Model type | Notes |
|---|---|---|
| `id` | integer | Primary key |
| `technique_id` | string(50) | Required |
| `technique_name` | string(255) | Required |
| `tactic` | string(100) | Optional |
| `description` | text | Optional |
| `incident_id` | integer | Required foreign key to `incidents.id`, indexed |

Unique constraint: `(incident_id, technique_id)`.

### `response_actions`

| Column | Model type | Notes |
|---|---|---|
| `id` | integer | Primary key |
| `action` | string(255) | Required |
| `description` | text | Optional |
| `status` | string(50) | Required |
| `incident_id` | integer | Required foreign key to `incidents.id`, indexed |
| `created_at` | timestamp with time zone | Server-generated |

### `cyber_memory`

| Column | Model type | Notes |
|---|---|---|
| `id` | integer | Primary key |
| `incident_id` | integer | Required foreign key to `incidents.id`, indexed |
| `attack_type` | string(100) | Optional |
| `summary` | text | Optional |
| `investigation_findings` | text | Optional |
| `final_solution` | text | Optional |
| `lessons_learned` | text | Optional |
| `created_at` | timestamp with time zone | Server-generated |

Unique constraint: `incident_id`, so an incident can have at most one Cyber
Memory record.

## Relationships

```text
incidents 1 ─── * alerts          (incident_id nullable)
incidents 1 ─── * iocs            (incident_id nullable)
incidents 1 ─── * mitre_mappings  (incident_id required)
incidents 1 ─── * response_actions(incident_id required)
incidents 1 ─── 0..1 cyber_memory (incident_id required and unique)

logs are stored independently and have no incident foreign key.
users have no incident relationship in the current model.
```

## Schema lifecycle

`backend/app/main.py` calls `Base.metadata.create_all()` during development
startup, which creates missing tables but is not a versioned migration system.
The project also contains SQL migration files in `database/migrations/` for
specific constraints. Back up the database before applying schema changes.
Never reset or recreate the database to run this prototype.
