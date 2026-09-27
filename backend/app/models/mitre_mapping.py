from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class MitreMapping(Base):
    __tablename__ = "mitre_mappings"
    __table_args__ = (
        UniqueConstraint(
            "incident_id", "technique_id", name="uq_mitre_mapping_incident_technique"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    technique_id: Mapped[str] = mapped_column(String(50))
    technique_name: Mapped[str] = mapped_column(String(255))
    tactic: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    incident_id: Mapped[int] = mapped_column(
        ForeignKey("incidents.id"), index=True
    )

    incident: Mapped["Incident"] = relationship(back_populates="mitre_mappings")
