FROM python:3.13-slim

WORKDIR /app

# Install build dependencies for C extension compilation (e.g. bcrypt, psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python package requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code files
COPY . .

EXPOSE 8000

# Wait for DB connection, run schema migrations, then launch API server
CMD python wait_for_db.py && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
