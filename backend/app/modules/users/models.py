"""SQLAlchemy models for the users module."""

from __future__ import annotations

from sqlalchemy import BigInteger, Boolean, Column, DateTime, ForeignKey, String, func

from app.infra.db.base import Base

__all__ = ["User"]


class User(Base):
    """User entity mapping to app.app_user table."""

    __tablename__ = "app_user"
    __table_args__ = {"schema": "app"}

    app_user_id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    employee_id = Column(
        BigInteger, ForeignKey("app.employee.employee_id"), unique=True, nullable=True
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
