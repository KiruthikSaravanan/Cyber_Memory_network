import json
from functools import lru_cache
from pathlib import Path

from pydantic import TypeAdapter
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..models import Incident, MitreMapping
from ..schemas.mitre import MitreMappingCreate, TechniqueId, TechniqueSeed

_TECHNIQUES_FILE = Path(__file__).resolve().parents[1] / "data" / "mitre_techniques.json"
_TECHNIQUES_ADAPTER = TypeAdapter(list[TechniqueSeed])


@lru_cache(maxsize=1)
def seed_mitre_techniques() -> dict[str, TechniqueSeed]:
    with _TECHNIQUES_FILE.open(encoding="utf-8") as file:
        technique_records = _TECHNIQUES_ADAPTER.validate_python(json.load(file))

    techniques = {item.technique_id.value: item for item in technique_records}
    if len(techniques) != len(technique_records):
        raise ValueError("MITRE technique seed contains duplicate technique IDs")
    return techniques


class IncidentNotFoundError(Exception):
    pass


class DuplicateMitreMappingError(Exception):
    pass


def create_mitre_mapping(
    db: Session, payload: MitreMappingCreate
) -> MitreMapping:
    incident = db.get(Incident, payload.incident_id)
    if incident is None:
        raise IncidentNotFoundError(payload.incident_id)

    technique = seed_mitre_techniques()[payload.technique_id.value]
    existing = db.scalar(
        select(MitreMapping.id).where(
            MitreMapping.incident_id == payload.incident_id,
            MitreMapping.technique_id == technique.technique_id.value,
        )
    )
    if existing is not None:
        raise DuplicateMitreMappingError(payload.incident_id)

    mapping = MitreMapping(
        technique_id=technique.technique_id.value,
        technique_name=technique.technique_name,
        tactic=technique.tactic,
        description=technique.description,
        incident_id=payload.incident_id,
    )
    db.add(mapping)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateMitreMappingError(payload.incident_id) from exc
    db.refresh(mapping)
    return mapping


def list_mitre_mappings(db: Session) -> list[MitreMapping]:
    return list(db.scalars(select(MitreMapping).order_by(MitreMapping.id)).all())


def get_mitre_mapping(db: Session, mapping_id: int) -> MitreMapping | None:
    return db.get(MitreMapping, mapping_id)


def list_incident_mitre_mappings(
    db: Session, incident_id: int
) -> list[MitreMapping] | None:
    if db.get(Incident, incident_id) is None:
        return None
    return list(
        db.scalars(
            select(MitreMapping)
            .where(MitreMapping.incident_id == incident_id)
            .order_by(MitreMapping.id)
        ).all()
    )


def delete_mitre_mapping(db: Session, mapping: MitreMapping) -> None:
    db.delete(mapping)
    db.commit()
