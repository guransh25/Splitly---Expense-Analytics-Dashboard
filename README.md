# Splitly — AI-powered expense splitting

A modern Splitwise alternative with AI categorization and spending insights.

This repository ships **two implementations of the same app**, so you can run the live demo here on Lovable **and** showcase a full Spring Boot + MySQL build on your resume.

## What's in here

| Folder | What it is | Runs in Lovable? |
|--------|------------|------------------|
| `src/` (root) | React + TanStack Start frontend with Postgres backend and Gemini AI via Lovable Cloud | ✅ Yes — this is what you see in the preview |
| `backend-springboot/` | Complete Spring Boot 3 + Spring Security + JWT + MySQL + Gemini backend | ❌ No — copy locally, run with `mvn spring-boot:run` |

Both implementations share the **same features**:
- Email/password auth (JWT in Spring Boot, Supabase Auth in the live demo)
- Groups with members
- Add / delete expenses with **equal split**
- "Who owes whom" balance calculation (greedy settlement)
- AI category suggestion + spending insights via **Google Gemini**
- Dashboard with totals, recent expenses, monthly bar chart, category pie chart
- Profile (name, password, avatar)

## Quick start (live demo)

The preview is already running. Click **Get started**, create an account, and you're in.

## Quick start (Spring Boot version)

See [`backend-springboot/README.md`](./backend-springboot/README.md) for full setup: MySQL, JWT secret, Gemini key, Render deploy.

```bash
cd backend-springboot
cp .env.example .env                              # fill in values
cp src/main/resources/application.properties.example src/main/resources/application.properties
mvn spring-boot:run
```

API will run on `http://localhost:8080`. The React frontend in `src/` is designed for Lovable Cloud — if you want to point it at the Spring Boot backend, swap the Supabase calls in `src/lib/*.functions.ts` for `axios` calls.

## Tech (live demo)

- TanStack Start (React 19, SSR, Vite 7)
- Tailwind CSS v4 + custom design tokens
- Framer Motion, Recharts, Lucide icons
- Lovable Cloud (Postgres + Auth + Storage) with row-level security
- Lovable AI Gateway → Google Gemini (`gemini-3-flash-preview`)

## Tech (Spring Boot version)

- Java 17, Spring Boot 3.3
- Spring Security + JWT (jjwt 0.12)
- Spring Data JPA + MySQL 8
- Google Gemini REST API
- Vercel-ready frontend + Render-ready backend

## Architecture diagrams

**Live demo (Lovable):**
```text
React (TanStack Start)
       │
       ▼
createServerFn (RPC)  ──►  Postgres (RLS)
       │
       └──►  Lovable AI Gateway  ──►  Gemini
```

**Spring Boot version:**
```text
React (Vite, Vercel)
       │  fetch /api/...
       ▼
Spring Boot (Render)
   Controller → Service → Repository → MySQL
                  │
                  └──►  Gemini REST API
```

## License
MIT — go build something cool.
