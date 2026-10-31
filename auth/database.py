"""
Database engine, session factory and declarative Base.

Every model in the project inherits from `Base`. Every router gets its
DB session through the `get_db` dependency.

Money columns elsewhere must be NUMERIC(12,2), never float.
"""
import os
from datetime import datetime, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# SQLite works for the quick demo; switch to PostgreSQL by setting DATABASE_URL, e.g.
# postgresql+psycopg2://user:pass@localhost:5432/brightloop
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./brightloop.db")

# SQLite needs this flag because FastAPI serves requests from several threads.
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=_connect_args, pool_pre_ping=True)

# expire_on_commit=False keeps objects readable after commit(), which saves
# an extra SELECT per request when we return the object we just saved.
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Parent class of every SQLAlchemy model."""


def utcnow() -> datetime:
    """
    Current time in UTC as a *naive* datetime.

    We store naive-UTC everywhere so the same code behaves identically on
    SQLite (which drops tzinfo) and PostgreSQL. Never mix this with
    timezone-aware datetimes in comparisons.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_db():
    """FastAPI dependency: one DB session per request, always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
