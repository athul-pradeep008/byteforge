import os
from typing import Generator
import sqlalchemy as sa
from sqlalchemy.orm import declarative_base, sessionmaker, Session

create_engine = sa.create_engine
event = sa.event



# Configurable database path via DATABASE_URL, defaulting to SQLite in backend/data/cyberimmune.db
DEFAULT_DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../data/cyberimmune.db")
)
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

is_sqlite = DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enables WAL mode and foreign key constraints for SQLite connections."""
    if is_sqlite:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency / helper to get a database session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def init_db(engine_override=None) -> None:
    """Creates all database tables and ensures target directory exists."""
    if is_sqlite and "memory" not in DATABASE_URL:
        db_dir = os.path.dirname(DEFAULT_DB_PATH)
        os.makedirs(db_dir, exist_ok=True)

    target_engine = engine_override or engine
    Base.metadata.create_all(bind=target_engine)
