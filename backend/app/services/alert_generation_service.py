from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Alert
from ..schemas.alert import AlertCreate, AlertStatus
from ..schemas.alert_generation import GeneratedAlertResponse
from ..schemas.detection import (
    BruteForceDetection,
    Detection,
    MaliciousHashDetection,
    SuspiciousIPDetection,
)
from .alert_service import create_alert as persist_alert
from .detection_service import run_detection


def _detection_source(detection: Detection) -> str:
    if isinstance(detection, (BruteForceDetection, SuspiciousIPDetection)):
        return detection.source_ip
    if isinstance(detection, MaliciousHashDetection):
        return detection.hash
    raise TypeError(f"Unsupported detection type: {type(detection).__name__}")


def run_detection_and_create_alerts(
    db: Session,
) -> tuple[int, list[GeneratedAlertResponse]]:
    detections = run_detection(db)
    if not detections:
        return 0, []

    existing_open_alerts = db.scalars(
        select(Alert).where(Alert.status == "Open")
    ).all()
    existing_keys = {
        (alert.alert_type, alert.source)
        for alert in existing_open_alerts
    }

    generated_alerts: list[GeneratedAlertResponse] = []
    for detection in detections:
        key = (detection.detection_type, _detection_source(detection))
        if key in existing_keys:
            continue
        existing_keys.add(key)
        alert = persist_alert(
            db,
            AlertCreate(
                alert_type=detection.detection_type,
                severity=detection.severity,
                timestamp=datetime.now(timezone.utc),
                source=key[1],
                description=detection.description,
                status=AlertStatus.OPEN,
                incident_id=None,
            ),
        )
        generated_alerts.append(
            GeneratedAlertResponse(
                id=alert.id,
                alert_type=alert.alert_type,
                severity=alert.severity,
                status=alert.status,
            )
        )

    return len(detections), generated_alerts
