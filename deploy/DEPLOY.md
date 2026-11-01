# Architecture Simplified — Server Deployment

## Server

- Host: `162.35.185.106`
- Path: `/opt/apps/architecture-simplified`
- Repo: https://github.com/ArijitManna/architecturesimplified.git

## Public URLs

- Website: http://162.35.185.106:8085
- API (direct): http://162.35.185.106:8084/api/health
- Admin: http://162.35.185.106:8085/admin/login

Default admin (seed):

- Email: `admin@architecturesimplified.com`
- Password: `Admin@12345`

## Deploy steps

```bash
cd /opt/apps
git clone https://github.com/ArijitManna/architecturesimplified.git architecture-simplified
cd architecture-simplified
cp .env.production.example .env
# edit .env secrets if needed
docker compose up -d --build
```

## Update

```bash
cd /opt/apps/architecture-simplified
git pull
docker compose up -d --build
```
