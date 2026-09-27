import json
from pathlib import Path
from typing import Any

from pydantic import TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Log
from ..schemas.log import LogIngestEntry

LOG_FILE = Path(__file__).resolve().parents[3] / "sample_logs" / "security_logs.json"
LOG_ENTRIES_ADAPTER = TypeAdapter(list[LogIngestEntry])


class LogFileError(Exception):
    pass


class LogValidationError(Exception):
    def __init__(self, errors: list[dict[str, Any]]) -> None:
        self.errors = errors
        super().__init__("Security log file contains invalid entries")


def ingest_logs(db: Session) -> int:
    try:
        with LOG_FILE.open(encoding="utf-8") as file:
            raw_entries = json.load(file)
    except (OSError, json.JSONDecodeError) as exc:
        raise LogFileError(f"Unable to read security log file: {exc}") from exc

    try:
        entries = LOG_ENTRIES_ADAPTER.validate_python(raw_entries)
    except ValidationError as exc:
        raise LogValidationError(exc.errors()) from exc

    logs = [
        Log(
            timestamp=entry.timestamp,
            username=entry.username,
            source_ip=entry.source_ip,
            event_type=entry.event_type,
            raw_data=raw_entry,
        )
        for entry, raw_entry in zip(entries, raw_entries, strict=True)
    ]
    db.add_all(logs)
    db.commit()
    return len(logs)


def list_logs(db: Session) -> list[Log]:
    return list(db.scalars(select(Log).order_by(Log.id)).all())


def get_log(db: Session, log_id: int) -> Log | None:
    return db.get(Log, log_id)
