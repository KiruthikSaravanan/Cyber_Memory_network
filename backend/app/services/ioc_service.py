from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Incident, IOC
from ..schemas.ioc import IOCCreate, IOCUpdate


class IncidentNotFoundError(Exception):
    pass


def _ensure_incident_exists(db: Session, incident_id: int | None) -> None:
    if incident_id is not None and db.get(Incident, incident_id) is None:
        raise IncidentNotFoundError(incident_id)


def create_ioc(db: Session, payload: IOCCreate) -> IOC:
    _ensure_incident_exists(db, payload.incident_id)
    ioc = IOC(**payload.model_dump())
    db.add(ioc)
    db.commit()
    db.refresh(ioc)
    return ioc


def list_iocs(db: Session) -> list[IOC]:
    return list(db.scalars(select(IOC).order_by(IOC.id)).all())


def get_ioc(db: Session, ioc_id: int) -> IOC | None:
    return db.get(IOC, ioc_id)


def update_ioc(db: Session, ioc: IOC, payload: IOCUpdate) -> IOC:
    values = payload.model_dump(exclude_unset=True)
    if "incident_id" in values:
        _ensure_incident_exists(db, values["incident_id"])
    for field, value in values.items():
        setattr(ioc, field, value)
    db.commit()
    db.refresh(ioc)
    return ioc


def delete_ioc(db: Session, ioc: IOC) -> None:
    db.delete(ioc)
    db.commit()
