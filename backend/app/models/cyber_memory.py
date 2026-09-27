from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class CyberMemory(Base):
    __tablename__ = "cyber_memory"
    __table_args__ = (
        UniqueConstraint("incident_id", name="uq_cyber_memory_incident"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    incident_id: Mapped[int] = mapped_column(
        ForeignKey("incidents.id"), index=True
    )
    attack_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    investigation_findings: Mapped[str | None] = mapped_column(Text, nullable=True)
    final_solution: Mapped[str | None] = mapped_column(Text, nullable=True)
    lessons_learned: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    incident: Mapped["Incident"] = relationship(back_populates="cyber_memory")
