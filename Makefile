.PHONY: install run test demo

install:
	pip install -r requirements.txt
	cd frontend && npm install

run:
	@echo "Starting backend and frontend..."
	start /B uvicorn backend.api.main:app --reload --port 8000
	cd frontend && npm run dev

test:
	pytest backend/tests/

demo:
	python backend/scripts/demo.py
