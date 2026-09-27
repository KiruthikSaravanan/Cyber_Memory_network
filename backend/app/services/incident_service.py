from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Incident
from ..schemas.incident import IncidentCreate, IncidentUpdate


def create_incident(db: Session, payload: IncidentCreate) -> Incident:
    incident = Incident(**payload.model_dump())
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


def list_incidents(db: Session) -> list[Incident]:
    return list(db.scalars(select(Incident).order_by(Incident.id)).all())


def get_incident(db: Session, incident_id: int) -> Incident | None:
    return db.get(Incident, incident_id)


def update_incident(
    db: Session, incident: Incident, payload: IncidentUpdate
) -> Incident:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(incident, field, value)
    db.commit()
    db.refresh(incident)
    return incident


def delete_incident(db: Session, incident: Incident) -> None:
    db.delete(incident)
    db.commit()
