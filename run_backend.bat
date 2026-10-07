@echo off
echo Starting ByteForge FastAPI Backend on http://localhost:8000 ...
cd /d "%~dp0"
.venv\Scripts\python.exe -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload
pause
