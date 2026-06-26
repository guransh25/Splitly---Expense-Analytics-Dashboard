# Splitly — Spring Boot + MySQL Reference Backend

This is a **complete, runnable Spring Boot backend** mirroring the Splitly web app feature-for-feature. It is **not used by the Lovable preview** — it's intended as a resume artifact and a deployable backend you can run locally or on Render and point a React frontend at.

## Stack
- Java 17 + Spring Boot 3.3
- Spring Security + JWT (jjwt)
- Spring Data JPA + MySQL
- Validation, Global exception handling
- Google Gemini API for AI features

## Architecture (intentionally simple)

```
controller  →  service  →  repository  →  entity
              ↑
             dto      config (security, JWT, CORS)
```

Only **6 layers**. No microservices, no Docker, no Redis, no Kafka, no CQRS.

## Project layout

```
src/main/java/com/splitly/
  SplitlyApplication.java
  config/         SecurityConfig, JwtAuthFilter, CorsConfig
  controller/     AuthController, GroupController, ExpenseController, AiController, UserController
  service/        AuthService, GroupService, ExpenseService, BalanceService, GeminiService, UserService
  repository/     UserRepository, GroupRepository, GroupMemberRepository, ExpenseRepository, ExpenseSplitRepository
  entity/         User, Group, GroupMember, Expense, ExpenseSplit
  dto/            *Request, *Response
  security/       JwtUtil, UserDetailsImpl, UserDetailsServiceImpl
  exception/      GlobalExceptionHandler, ApiError
src/main/resources/
  application.properties.example
  schema.sql
```

## Local setup

1. **Install MySQL 8** locally and create a database:
   ```sql
   CREATE DATABASE splitly;
   ```
2. **Copy env**: `cp .env.example .env`, then fill in:
   - `DB_URL`, `DB_USER`, `DB_PASS`
   - `JWT_SECRET` — any random ≥32-char string
   - `GEMINI_API_KEY` — from https://aistudio.google.com/app/apikey
3. **Copy properties**: `cp src/main/resources/application.properties.example src/main/resources/application.properties`
4. **Run schema** (optional — JPA `ddl-auto=update` also creates tables):
   ```bash
   mysql -u root -p splitly < src/main/resources/schema.sql
   ```
5. **Run the app**:
   ```bash
   mvn spring-boot:run
   ```
   Backend serves on `http://localhost:8080`.

## REST API

| Method | Path                          | Auth | Body / notes |
|--------|-------------------------------|------|--------------|
| POST   | `/api/auth/register`          | no   | `{name,email,password}` → `{token,user}` |
| POST   | `/api/auth/login`             | no   | `{email,password}` → `{token,user}` |
| GET    | `/api/users/me`               | yes  | Current user profile |
| PUT    | `/api/users/me`               | yes  | `{name}` |
| PUT    | `/api/users/me/password`      | yes  | `{password}` |
| GET    | `/api/groups`                 | yes  | My groups |
| POST   | `/api/groups`                 | yes  | `{name}` |
| GET    | `/api/groups/{id}`            | yes  | Group + members |
| POST   | `/api/groups/{id}/members`    | yes  | `{email}` |
| GET    | `/api/groups/{id}/expenses`   | yes  | Expenses list |
| GET    | `/api/groups/{id}/balances`   | yes  | `{net, settlements[]}` |
| POST   | `/api/expenses`               | yes  | `{groupId,title,amount,category,date,description,splitUserIds[]}` |
| DELETE | `/api/expenses/{id}`          | yes  | |
| GET    | `/api/dashboard`              | yes  | totals + recent + chart data |
| POST   | `/api/ai/categorize`          | yes  | `{title,amount}` → `{category}` |
| POST   | `/api/ai/insights`            | yes  | `{expenses[]}` → `{topCategory,summary,tip}` |

JWT goes in `Authorization: Bearer <token>`.

## Render deploy

1. Push this folder to a new GitHub repo.
2. In Render → New Web Service → connect repo.
3. **Build command**: `mvn clean package -DskipTests`
4. **Start command**: `java -jar target/splitly-backend-0.0.1-SNAPSHOT.jar`
5. **Environment**: add all variables from `.env.example` (use Render's free MySQL or an external provider like PlanetScale / Aiven).
6. After deploy, your frontend's `VITE_API_URL` becomes `https://<your-service>.onrender.com`.

## Why two implementations?

The live preview at the top of this Lovable project runs on TanStack Start + Postgres + the Lovable AI Gateway — that's what powers the working demo. This folder is the **same app re-implemented in your preferred Java stack** so you can talk about both on your resume and in interviews.
