from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Alert, Incident
from ..schemas.alert import AlertCreate, AlertUpdate


class IncidentNotFoundError(Exception):
    pass


def _ensure_incident_exists(db: Session, incident_id: int | None) -> None:
    if incident_id is not None and db.get(Incident, incident_id) is None:
        raise IncidentNotFoundError(incident_id)


def create_alert(db: Session, payload: AlertCreate) -> Alert:
    _ensure_incident_exists(db, payload.incident_id)
    alert = Alert(**payload.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def list_alerts(db: Session) -> list[Alert]:
    return list(db.scalars(select(Alert).order_by(Alert.id)).all())


def get_alert(db: Session, alert_id: int) -> Alert | None:
    return db.get(Alert, alert_id)


def update_alert(db: Session, alert: Alert, payload: AlertUpdate) -> Alert:
    values = payload.model_dump(exclude_unset=True)
    if "incident_id" in values:
        _ensure_incident_exists(db, values["incident_id"])
    for field, value in values.items():
        setattr(alert, field, value)
    db.commit()
    db.refresh(alert)
    return alert


def delete_alert(db: Session, alert: Alert) -> None:
    db.delete(alert)
    db.commit()
