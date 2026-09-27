from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..models import CyberMemory, Incident
from ..schemas.cyber_memory import CyberMemoryUpdate


class IncidentNotFoundError(Exception):
    pass


class IncidentNotClosedError(Exception):
    pass


class CyberMemoryAlreadyExistsError(Exception):
    pass


def create_from_incident(db: Session, incident_id: int) -> CyberMemory:
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise IncidentNotFoundError(incident_id)
    if incident.status != "Closed":
        raise IncidentNotClosedError(incident_id)

    existing = db.scalar(
        select(CyberMemory.id).where(CyberMemory.incident_id == incident_id)
    )
    if existing is not None:
        raise CyberMemoryAlreadyExistsError(incident_id)

    memory = CyberMemory(
        incident_id=incident.id,
        attack_type=incident.attack_type,
        summary=incident.description,
        investigation_findings=incident.investigation_notes,
        final_solution=incident.final_solution,
        lessons_learned=incident.lessons_learned,
    )
    db.add(memory)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise CyberMemoryAlreadyExistsError(incident_id) from exc
    db.refresh(memory)
    return memory


def list_cyber_memories(db: Session) -> list[CyberMemory]:
    return list(db.scalars(select(CyberMemory).order_by(CyberMemory.id)).all())


def search_cyber_memories(db: Session, keyword: str) -> list[CyberMemory]:
    escaped_keyword = keyword.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    pattern = f"%{escaped_keyword}%"
    searchable_fields = (
        CyberMemory.attack_type,
        CyberMemory.summary,
        CyberMemory.investigation_findings,
        CyberMemory.final_solution,
        CyberMemory.lessons_learned,
    )
    return list(
        db.scalars(
            select(CyberMemory)
            .where(
                or_(
                    field.ilike(pattern, escape="\\")
                    for field in searchable_fields
                )
            )
            .order_by(CyberMemory.id)
        ).all()
    )


def search_cyber_memories_by_attack_type(
    db: Session, attack_type: str
) -> list[CyberMemory]:
    return list(
        db.scalars(
            select(CyberMemory)
            .where(func.lower(CyberMemory.attack_type) == attack_type.lower())
            .order_by(CyberMemory.id)
        ).all()
    )


def get_cyber_memory(db: Session, memory_id: int) -> CyberMemory | None:
    return db.get(CyberMemory, memory_id)


def get_incident_cyber_memory(
    db: Session, incident_id: int
) -> tuple[bool, CyberMemory | None]:
    if db.get(Incident, incident_id) is None:
        return False, None
    memory = db.scalar(
        select(CyberMemory).where(CyberMemory.incident_id == incident_id)
    )
    return True, memory


def update_cyber_memory(
    db: Session, memory: CyberMemory, payload: CyberMemoryUpdate
) -> CyberMemory:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(memory, field, value)
    db.commit()
    db.refresh(memory)
    return memory


def delete_cyber_memory(db: Session, memory: CyberMemory) -> None:
    db.delete(memory)
    db.commit()
