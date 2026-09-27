from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class IOC(Base):
    __tablename__ = "iocs"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(String(100))
    value: Mapped[str] = mapped_column(String(512), index=True)
    threat_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    incident_id: Mapped[int | None] = mapped_column(
        ForeignKey("incidents.id"), nullable=True, index=True
    )

    incident: Mapped["Incident"] = relationship(back_populates="iocs")
