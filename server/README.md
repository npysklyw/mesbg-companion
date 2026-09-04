# MESBG Companion API

Minimal FastAPI and PostgreSQL foundation for saved armies. The API is
currently **unauthenticated** and is suitable only for local development.

## Docker setup

From `server/`:

```sh
docker compose up --build
```

This starts PostgreSQL, runs `alembic upgrade head`, and serves the API at
`http://localhost:8000`. API documentation is at `http://localhost:8000/docs`.

To run migrations or tests explicitly:

```sh
docker compose run --rm api alembic upgrade head
docker compose run --rm api pytest
```

## Local Python setup

```sh
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -e ".[test]"
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

On macOS/Linux, activate with `source .venv/bin/activate` and copy the example
with `cp .env.example .env`.

Set `CORS_ORIGINS` to a comma-separated list of allowed Expo origins. Do not
reuse the development database credentials or expose this API publicly without
authentication, authorization, secret management, TLS, and operational controls.
