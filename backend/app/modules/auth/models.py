"""SQLAlchemy models for the auth module."""

from __future__ import annotations

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, Text, func

from app.infra.db.base import Base
from app.modules.users.models import User

__all__ = ["Base", "LoginSession", "Permission", "Role", "RolePermission", "User", "UserRole"]


class Role(Base):
    __tablename__ = "role"
    __table_args__ = ({"schema": "app"},)

    role_id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    role_code = Column(String(50), unique=True, nullable=False)
    role_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)


class Permission(Base):
    __tablename__ = "permission"
    __table_args__ = ({"schema": "app"},)

    permission_id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    permission_code = Column(String(100), unique=True, nullable=False)
    permission_name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)


class UserRole(Base):
    __tablename__ = "user_role"
    __table_args__ = ({"schema": "app"},)

    app_user_id = Column(BigInteger, ForeignKey("app.app_user.app_user_id"), primary_key=True)
    role_id = Column(BigInteger, ForeignKey("app.role.role_id"), primary_key=True)


class RolePermission(Base):
    __tablename__ = "role_permission"
    __table_args__ = ({"schema": "app"},)

    role_id = Column(BigInteger, ForeignKey("app.role.role_id"), primary_key=True)
    permission_id = Column(BigInteger, ForeignKey("app.permission.permission_id"), primary_key=True)


class LoginSession(Base):
    __tablename__ = "login_session"
    __table_args__ = ({"schema": "app"},)

    login_session_id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    app_user_id = Column(BigInteger, ForeignKey("app.app_user.app_user_id"), nullable=False)
    login_at = Column(DateTime, server_default=func.now(), nullable=False)
    logout_at = Column(DateTime, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    refresh_token_hash = Column(Text, nullable=True)
    session_status = Column(String(30), default="ACTIVE", nullable=False)
