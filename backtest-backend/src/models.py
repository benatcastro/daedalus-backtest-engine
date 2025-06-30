# app/models.py
from sqlalchemy import (
    Column,
    DateTime,
)
from sqlalchemy.ext.declarative import declared_attr
from database import Base
from sqlalchemy.sql import func


class TimestampMixin:
    """Mixin to add created_at and updated_at timestamps to models"""

    @declared_attr
    def created_at(cls):
        return Column(DateTime, nullable=False, server_default=func.now())

    @declared_attr
    def updated_at(cls):
        return Column(
            DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
        )


class BaseModel(Base, TimestampMixin):
    """Abstract base model with timestamp functionality"""

    __abstract__ = True
