from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Incident, ResponseAction
from ..schemas.response_action import ResponseActionCreate, ResponseActionUpdate


class IncidentNotFoundError(Exception):
    pass


def _ensure_incident_exists(db: Session, incident_id: int) -> None:
    if db.get(Incident, incident_id) is None:
        raise IncidentNotFoundError(incident_id)


def create_response_action(
    db: Session, payload: ResponseActionCreate
) -> ResponseAction:
    _ensure_incident_exists(db, payload.incident_id)
    response_action = ResponseAction(**payload.model_dump())
    db.add(response_action)
    db.commit()
    db.refresh(response_action)
    return response_action


def list_response_actions(db: Session) -> list[ResponseAction]:
    return list(db.scalars(select(ResponseAction).order_by(ResponseAction.id)).all())


def get_response_action(
    db: Session, response_action_id: int
) -> ResponseAction | None:
    return db.get(ResponseAction, response_action_id)


def list_incident_response_actions(
    db: Session, incident_id: int
) -> list[ResponseAction] | None:
    if db.get(Incident, incident_id) is None:
        return None
    return list(
        db.scalars(
            select(ResponseAction)
            .where(ResponseAction.incident_id == incident_id)
            .order_by(ResponseAction.id)
        ).all()
    )


def update_response_action(
    db: Session,
    response_action: ResponseAction,
    payload: ResponseActionUpdate,
) -> ResponseAction:
    values = payload.model_dump(exclude_unset=True)
    if "incident_id" in values:
        _ensure_incident_exists(db, values["incident_id"])
    for field, value in values.items():
        setattr(response_action, field, value)
    db.commit()
    db.refresh(response_action)
    return response_action


def delete_response_action(
    db: Session, response_action: ResponseAction
) -> None:
    db.delete(response_action)
    db.commit()
