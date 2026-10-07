import pytest
import importlib

sa = importlib.import_module("sqlalchemy")
sa_orm = importlib.import_module("sqlalchemy.orm")

create_engine = sa.create_engine
inspect = sa.inspect

from backend.db.database import Base, init_db
from backend.db import models


def test_init_db_temp_database(tmp_path):
    """Test that init_db creates all required tables in a temporary database."""
    temp_db_file = tmp_path / "test_cyberimmune.db"
    temp_db_url = f"sqlite:///{temp_db_file}"

    test_engine = create_engine(temp_db_url, connect_args={"check_same_thread": False})
    
    # Initialize DB using override engine
    init_db(engine_override=test_engine)

    inspector = inspect(test_engine)
    tables = inspector.get_table_names()

    expected_tables = {
        "incidents",
        "events",
        "anomalies",
        "attack_steps",
        "predictions",
        "response_options",
        "approvals",
        "audit_log",
        "memory_signatures",
    }

    assert expected_tables.issubset(set(tables)), f"Missing tables: {expected_tables - set(tables)}"


def test_models_schema_and_columns(tmp_path):
    """Test that tables have correct columns."""
    temp_db_url = "sqlite:///:memory:"
    test_engine = create_engine(temp_db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=test_engine)

    inspector = inspect(test_engine)
    
    # Check incidents table columns
    inc_cols = {col["name"] for col in inspector.get_columns("incidents")}
    assert {"id", "status", "scenario_type", "created_at", "resolved_at", "caught_at_stage", "selected_action_id"}.issubset(inc_cols)

    # Check memory_signatures columns
    mem_cols = {col["name"] for col in inspector.get_columns("memory_signatures")}
    assert {"id", "name", "stage_sequence", "technique_ids", "fingerprint", "created_at", "times_matched"}.issubset(mem_cols)

    # Check audit_log columns
    audit_cols = {col["name"] for col in inspector.get_columns("audit_log")}
    assert {"id", "timestamp", "actor", "action", "reason", "incident_id", "approved_by"}.issubset(audit_cols)
