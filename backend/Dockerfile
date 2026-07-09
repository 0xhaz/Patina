# Function Compute custom-container runtime for the Patina backend.
FROM python:3.12-slim

# uv for fast, lockfile-reproducible installs.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install deps first for layer caching.
COPY pyproject.toml uv.lock* ./
RUN uv sync --no-dev --frozen || uv sync --no-dev

COPY patina ./patina
COPY app.py ./

# FC custom runtime sends requests to the port in $FC_SERVER_PORT (default 9000).
ENV FC_SERVER_PORT=9000
EXPOSE 9000

CMD ["uv", "run", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "9000"]
