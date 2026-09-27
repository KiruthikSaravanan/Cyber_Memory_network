from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(50))
    attack_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    detection_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    assigned_analyst: Mapped[str | None] = mapped_column(String(255), nullable=True)
    investigation_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    final_solution: Mapped[str | None] = mapped_column(Text, nullable=True)
    lessons_learned: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    alerts: Mapped[list["Alert"]] = relationship(back_populates="incident")
    iocs: Mapped[list["IOC"]] = relationship(back_populates="incident")
    mitre_mappings: Mapped[list["MitreMapping"]] = relationship(
        back_populates="incident"
    )
    response_actions: Mapped[list["ResponseAction"]] = relationship(
        back_populates="incident"
    )
    cyber_memory: Mapped["CyberMemory | None"] = relationship(back_populates="incident")
