# Blog Post Manager

A full-stack blog post manager: a NestJS REST API, a Next.js web app and
PostgreSQL through Prisma.

## Quick start

Requires Docker Desktop.

```bash
docker compose up --build
```

| Service    | URL                              |
| ---------- | -------------------------------- |
| Web app    | http://localhost:3000            |
| API health | http://localhost:4000/api/health |

Stop with `Ctrl+C`, or remove everything including the database volume with
`docker compose down -v`.
