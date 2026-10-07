# Start ByteForge FastAPI Backend
Write-Host "Starting ByteForge FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot
& .\.venv\Scripts\python.exe -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload
