from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class Log(Base):
    __tablename__ = "logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    source_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    event_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    raw_data: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(
        JSON, nullable=True
    )
