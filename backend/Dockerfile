FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r /app/requirements.txt

COPY backend /app/backend

ENV PYTHONUNBUFFERED=1
ENV APP_PORT=8000

EXPOSE 8000

CMD ["/bin/sh", "-c", "gunicorn -k uvicorn.workers.UvicornWorker backend.app.main:app --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120"]
