from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Log
from ..schemas.detection import (
    BruteForceDetection,
    Detection,
    MaliciousHashDetection,
    SuspiciousIPDetection,
)

BRUTE_FORCE_THRESHOLD = 5
BRUTE_FORCE_WINDOW = timedelta(minutes=5)
SUSPICIOUS_IPS = frozenset({"192.168.1.100"})
MALICIOUS_HASHES = frozenset({"d41d8cd98f00b204e9800998ecf8427e"})


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _contains_hash(value: Any, expected_hash: str) -> bool:
    if isinstance(value, str):
        return expected_hash in value.lower()
    if isinstance(value, dict):
        return any(_contains_hash(item, expected_hash) for item in value.values())
    if isinstance(value, list):
        return any(_contains_hash(item, expected_hash) for item in value)
    return False


def _detect_brute_force(logs: list[Log]) -> list[BruteForceDetection]:
    grouped: dict[tuple[str, str], list[Log]] = defaultdict(list)
    for log in logs:
        if (
            log.event_type == "login_failed"
            and log.username is not None
            and log.source_ip is not None
        ):
            grouped[(log.username, log.source_ip)].append(log)

    detections: list[BruteForceDetection] = []
    for (username, source_ip), attempts in grouped.items():
        attempts.sort(key=lambda item: (_as_utc(item.timestamp), item.id))
        start = 0
        while start < len(attempts):
            first_time = _as_utc(attempts[start].timestamp)
            end = start + 1
            while (
                end < len(attempts)
                and _as_utc(attempts[end].timestamp) - first_time
                <= BRUTE_FORCE_WINDOW
            ):
                end += 1

            window = attempts[start:end]
            if len(window) >= BRUTE_FORCE_THRESHOLD:
                last_time = _as_utc(window[-1].timestamp)
                detections.append(
                    BruteForceDetection(
                        username=username,
                        source_ip=source_ip,
                        number_of_failed_attempts=len(window),
                        first_attempt=first_time,
                        last_attempt=last_time,
                        description=(
                            "Multiple failed login attempts detected for user "
                            f"{username} from source IP {source_ip}."
                        ),
                    )
                )
                start = end
            else:
                start += 1
    return detections


def run_detection(db: Session) -> list[Detection]:
    logs = list(db.scalars(select(Log).order_by(Log.timestamp, Log.id)).all())
    detections: list[Detection] = list(_detect_brute_force(logs))

    detected_ips = {
        log.source_ip
        for log in logs
        if log.source_ip is not None and log.source_ip in SUSPICIOUS_IPS
    }
    detections.extend(
        SuspiciousIPDetection(
            source_ip=source_ip,
            description=f"Log activity detected from suspicious source IP {source_ip}.",
        )
        for source_ip in sorted(detected_ips)
    )

    detected_hashes = {
        known_hash
        for known_hash in MALICIOUS_HASHES
        if any(_contains_hash(log.raw_data, known_hash) for log in logs)
    }
    detections.extend(
        MaliciousHashDetection(
            hash=known_hash,
            description=f"Known malicious file hash {known_hash} found in a stored log.",
        )
        for known_hash in sorted(detected_hashes)
    )
    return detections
