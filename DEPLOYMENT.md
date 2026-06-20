# BenchAstra — Deployment Guide

## Local Development (current setup)

```bash
# Backend
cd backend
pip install -r requirements.txt
python init_db.py          # Reset DB + create test users
python seed_data.sql       # Or: psql -U postgres -d benchbridge -f seed_data.sql
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                # Runs on http://localhost:5173
```

**Test credentials** (after running `init_db.py`):
| Role   | Email              | Password          |
|--------|--------------------|-------------------|
| Client | client@test.com    | BenchAstra@2025  |
| Vendor | vendor@test.com    | BenchAstra@2025  |

---

## OTP / Email Testing

**Without SMTP configured** (default):
- OTPs are printed to the **backend terminal** (stdout)
- Look for: `OTP for you@email.com (verification): 123456`

**With SMTP** (Gmail example):
1. Copy `.env.example` → `.env`
2. Fill in:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your@gmail.com
   SMTP_PASSWORD=your_app_password
   ```
3. Generate an App Password at https://myaccount.google.com/apppasswords  
   (requires Google 2FA to be enabled)

---

## Docker Deployment

### Prerequisites
- Docker Desktop installed
- Copy `.env.example` to `.env` and fill in all values

### One-command deploy
```bash
# From project root
cp .env.example .env
# Edit .env with your values

docker compose up --build -d
```

Services:
| Service   | URL                    |
|-----------|------------------------|
| Frontend  | http://localhost       |
| Backend   | http://localhost:8000  |
| DB        | localhost:5432 (internal) |

### Initialize the database (first run only)
```bash
docker compose exec backend python init_db.py
```

### Seed test data
```bash
docker compose exec db psql -U postgres -d benchbridge -f /dev/stdin < backend/seed_data.sql
```

### View logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Stop
```bash
docker compose down
# To also delete the database volume:
docker compose down -v
```

---

## Production Deployment (VPS / Cloud)

### Render / Railway / Fly.io (easy)

**Backend** — Deploy as a Web Service:
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add all `.env` variables in the dashboard
- Set `DATABASE_URL` to your managed Postgres URL

**Frontend** — Deploy as a Static Site:
- Build command: `npm run build`
- Publish directory: `dist`
- Add env var `VITE_API_URL` if needed (already proxied via nginx in Docker)

### Environment variables checklist
```
DATABASE_URL        ✅ Required
SECRET_KEY          ✅ Required (64 random hex chars)
SMTP_HOST           Optional (OTP emails)
SMTP_PORT           Optional
SMTP_USER           Optional
SMTP_PASSWORD       Optional
FRONTEND_URL        Set to your actual domain
```

Generate a strong SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Password Breach Warning

The browser shows "This password was found in a data breach" when a saved
password matches Chrome's leaked-credentials database. This happens with
obvious test passwords like `test123`.

The test users now use `BenchAstra@2025` to avoid this warning.  
For production, all users should choose unique strong passwords.
