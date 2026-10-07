import os
import pytest
import pandas as pd
from backend.simulator.csv_loader import load_cyberimmune_csv

def test_csv_loader():
    test_csv = r"d:\Open Rails Train Simulator - ZZ\cyberimmune_dataset (1).csv"
    if not os.path.exists(test_csv):
        pytest.skip("Dataset file not present on disk")
        
    df = load_cyberimmune_csv(test_csv, limit=20)
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 20
    assert "event_id" in df.columns
    assert "event_type" in df.columns
    assert "source" in df.columns
    assert "details" in df.columns
    assert "is_attack" in df.columns
