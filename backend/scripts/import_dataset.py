import shutil
import os
import pandas as pd

src = r"d:\Open Rails Train Simulator - ZZ\cyberimmune_dataset (1).csv"
dst = r"d:\Projects\cyberimmune\backend\data\cyberimmune_dataset.csv"

os.makedirs(os.path.dirname(dst), exist_ok=True)
if os.path.exists(src):
    shutil.copy(src, dst)
    print(f"Successfully copied dataset from {src} to {dst}")
    df = pd.read_csv(dst)
    print(f"Dataset contains {len(df)} records across {len(df.columns)} columns.")
else:
    print(f"Source file {src} not found.")
