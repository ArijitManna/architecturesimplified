# Architecture Simplified

**Complex Technology Through Simple Mental Models**

A full-stack visual technology learning platform. Content (categories, topics, sections, diagrams, resources, learning paths, and challenges) is stored in PostgreSQL and managed from an Admin Panel — no code changes required to publish new topics.

## Stack

- **Frontend:** React + TypeScript + Vite + React Router
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL
- **Auth:** JWT (ADMIN / USER roles)
- **Files:** Local `uploads/` (S3-ready storage abstraction)

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:5173  
- API: http://localhost:4000/api/health  
- Admin: http://localhost:5173/admin/login  

Default admin (from seed):

- Email: `admin@architecturesimplified.com`
- Password: `Admin@12345`

## Local development

### Prerequisites

- Node.js 20+
- PostgreSQL 16+

### Setup

```bash
cp .env.example .env
npm install

# Start Postgres (example with Docker only for DB)
docker compose up db -d

# Migrate + seed
npm run db:setup

# Run API + Web
npm run dev
```

- Web: http://localhost:5173  
- API: http://localhost:4000  

## Project structure

```text
architecture-simplified/
├── api/                 # Express REST API
├── web/                 # React SPA
├── database/
│   ├── schema/          # SQL schema
│   └── seed/            # (seed executed via api)
├── uploads/             # diagrams, resources, images
├── docker-compose.yml
├── .env.example
└── package.json
```

## Public routes

| Path | Description |
|------|-------------|
| `/` | Home |
| `/topics` | Explore topics (filters from DB) |
| `/:category/:topic` | Topic detail (e.g. `/aws/s3`) |
| `/learning-paths` | Learning paths |
| `/challenges` | Architecture challenges |
| `/search?q=` | Global search |

## Admin routes

| Path | Description |
|------|-------------|
| `/admin/login` | Admin login |
| `/admin` | Dashboard stats |
| `/admin/categories` | Category CRUD |
| `/admin/topics` | Topic list |
| `/admin/topics/:id` | Topic builder (sections, diagrams, resources, tags) |
| `/admin/learning-paths` | Configure paths |
| `/admin/challenges` | Configure challenges |

## Seed content

Five AWS topics are seeded:

1. Amazon VPC  
2. RDS vs Aurora  
3. Compute & Messaging  
4. Amazon S3 (full mental-model example)  
5. CloudFront vs Global Accelerator  

Also seeded: categories, tags, one learning path, and one architecture challenge.

## Content model principle

```text
REAL WORLD ANALOGY → MENTAL MODEL → VISUAL ARCHITECTURE
→ CONCEPTS → SCENARIO → PRACTICE → EXAM SHORTCUT → REMEMBER
```

Admins can create entirely new categories and topics from the Admin Panel without modifying React or Node source code.
