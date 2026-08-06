# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A calorie tracker — the user's summer-long full-stack learning project (see the Notion "Calorie Tracker — Roadmap" page under Summer Prep). It grows one architectural layer at a time; the standing rule is **add a layer only when you understand the one beneath it**. Every version should be explainable in an interview. Depth over speed — the understanding is the deliverable, not the feature count.

### Version arc (from the Notion roadmap — revised 2026-08-06)

- **v1 (done):** React frontend + Spring Boot API with in-memory storage — meals lived in a `List<MealEntry>` in the backend, wiped on every restart by design (to motivate v2).
- **v2 (done):** Swapped the in-memory list for Postgres via Spring Data JPA. Only the storage layer changed — the frontend and request loop stayed identical.
- **v3–v7 (current batch, before deploy):** a feature-fleshing-out phase, inserted ahead of deployment on purpose so there's more to show on a resume. Ordered by difficulty *for this user specifically* (strong in React already, brand-new to JPA relationships/external APIs), each version leaning on what the previous one just built:
  1. **v3 — Dates & history**: meals belong to a day; filtered/date-range queries. Gentle extension of single-entity JPA, nothing architecturally new.
  2. **v4 — Charts**: calories over time. Leans on React (already strong); one new backend aggregation query (`GROUP BY`/`SUM`).
  3. **v5 — Reusable/commonly-entered foods (2nd entity)**: a `Food` entity related to `MealEntry` (`@ManyToOne`/`@OneToMany`). The real jump in this batch — first multi-entity schema. Also the intended landing spot for v6's API results.
  4. **v6 — Nutrition API search**: external REST API (e.g. USDA FoodData Central, Nutritionix) to search foods and pull full macros (protein/carbs/fat, not just calories), populating the v5 `Food` entity.
  5. **v7 — Claude vision image recognition (capstone)**: photo of a meal → Claude API (multimodal) → identified food + estimated macros, wired into the same logging flow as v5/v6. Hardest of the batch; open design question for later — trust Claude's estimate directly, or use it to identify the food and look up precise macros via v6.
- **v8 (later, was v3):** Deploy — backend to Render/Railway, frontend to Vercel, hosted Postgres. Deliberately pushed later so deploy ships a fleshed-out app, not a bare CRUD demo.
- **Further down the road (uncommitted):** users/auth — not committed to yet, revisit whenever. Living project — keeps growing after deploy too.

**Do not add layers ahead of the roadmap** (no auth, no deploy config, and within v3–v7 specifically: don't jump ahead to a later version's concept before the current one is done) — pre-building defeats the learning structure. The user is a learner; prefer explaining the why behind code over dumping finished abstractions. Starting with v2, the user writes the actual feature code themselves (entity annotations, repository/service logic, API integration code, etc.) — the assistant's job is environment setup (installing dependencies, API keys/config, verifying connections) and review/explanation, not writing that code for them. This applies to v3–v7 too, including the nutrition API and Claude vision work — no vibecoding, the user wants to do the heavy lifting.

## Current state

**v1 (backend + frontend) is done.** `MealEntryController` at `/api/meals`: `GET`, `POST` (`@RequestBody`), `PUT /{id}` (sets id from the path onto the body before updating — the URL is the source of truth, not the JSON body), `DELETE /{id}`. Frontend is a separate Vite/React app in `frontend/` (not wired into the Maven build — matches the v3 plan to deploy backend/frontend separately). `App.jsx` owns state (`useEffect` load, `reduce` for daily total), with `Header`, `CalorieSummary`, `MealForm`, `MealList`, `FoodItem`. `api.js` wraps GET/POST/DELETE (PUT/`updateMeal` exists but isn't wired into any UI yet). `@CrossOrigin(origins = "http://localhost:5173")` on the controller is required for the frontend to reach the backend.

**v2 (Postgres/JPA) — core done, environment set up:**

- Postgres 18 installed natively on Windows (not Docker — deliberate, to keep focus on JPA/relational concepts). Runs as Windows service `postgresql-x64-18`. Dedicated role `caltracker_app` and database `caltracker` (not the `postgres` superuser).
- `pom.xml` has `spring-boot-starter-data-jpa` and `org.postgresql:postgresql` (runtime scope) added.
- `application.properties` has the datasource block (`jdbc:postgresql://localhost:5432/caltracker`, `caltracker_app` credentials) plus `spring.jpa.hibernate.ddl-auto=update` (Hibernate creates/updates tables from `@Entity`, never drops data) and `spring.jpa.show-sql=true` (prints generated SQL — intentional, for learning).
- `model/MealEntry.java` — now `@Entity` + `@Table(name = "meal_entries")`, `@Id` + `@GeneratedValue(strategy = GenerationType.IDENTITY)` on `id` (kept as primitive `long`, not `Long`).
- `service/MealEntryRepository.java` — `interface MealEntryRepository extends JpaRepository<MealEntry, Long>`. Note: lives in the `service` package, not a separate `repository` package — works fine via component scan, just an organizational quirk if you go looking for it.
- `service/MealEntryService.java` — rewritten to delegate to `MealEntryRepository` instead of the old `ArrayList`/`AtomicLong`.
- No seed data currently — the table starts empty (the old 3 sample meals from v1's in-memory seed are gone; adding them back via a guarded `CommandLineRunner` is an open option, not done).

**A real bug was hit and fixed today, worth knowing about:** the first version of the rewritten service kept the old `AtomicLong idCounter` and manually called `mealEntry.setId(idCounter.getAndIncrement())` before `save()`. Spring Data JPA's `save()` decides insert-vs-update by checking whether the primitive `id` is `0` (new) or nonzero (existing). Manually assigning a nonzero id made every add look like an update to a row that didn't exist, so Hibernate called `merge()`, did a `SELECT` that found nothing, and threw `StaleObjectStateException` on every POST. Fix: never set `id` manually in `addMealEntry` — leave it at `0` and let `@GeneratedValue(IDENTITY)` + Postgres's identity column assign it. This is a general trap when migrating away from a hand-rolled id counter: two id sources (app code and DB identity column) can't both be in control.

**Not done yet:** no 404 handling when updating/deleting an unknown id (`deleteById` on a missing id throws rather than no-ops now — a real behavior change from v1 — but proper `@ExceptionHandler`/`ResponseStatusException` handling is deliberately deferred, it's API-design work not storage-layer work); no edit/update UI on the frontend; no seed data.

### Request flow (how a call actually reaches Postgres)

Worth understanding end to end, since none of this is written by hand — it's wired together by annotations + config:

1. **Frontend → Controller**: `api.js` sends the HTTP request; Jackson deserializes the JSON body into a `MealEntry` via the no-arg constructor + setters (the `@JsonCreator(DISABLED)` 3-arg constructor stays out of this path on purpose, since POST bodies omit `id`).
2. **Controller → Service → Repository**: the controller calls a service method, which calls a method on `MealEntryRepository`. That interface has no implementation in this codebase — Spring Data JPA generates a real implementation (a dynamic proxy) at startup.
3. **Repository proxy → Hibernate**: the generated proxy delegates to Hibernate (the JPA provider), which reads the `@Entity`/`@Table`/`@Id` annotations on `MealEntry` and turns the method call into an actual SQL string (visible in the console via `show-sql=true`).
4. **Hibernate → JDBC → Postgres**: that SQL travels over a real network connection opened by the `org.postgresql:postgresql` driver, using the connection pool (HikariCP) Spring Boot auto-configures from the `spring.datasource.*` properties. This is the literal address — without it, there'd be a driver and generated SQL but nowhere to send it.
5. Response flows back up the same chain: Postgres → JDBC → Hibernate maps result rows back into `MealEntry` objects (same no-arg-constructor-plus-setters mechanism, just driven by SQL columns instead of JSON fields) → repository → service → controller → Jackson serializes to JSON → frontend.

### Known gotchas

- **Stale dev servers break CORS silently.** If `npm run dev` reports "Port 5173 is in use, trying another one," a leftover Vite process is squatting on 5173 and the new one lands on 5174+. `@CrossOrigin(origins = "http://localhost:5173")` only allows exactly 5173, so the frontend's fetch calls get silently blocked by the browser — no error shown in the UI, just nothing happening. Fix: find and kill the stale process (`netstat -ano | findstr :5173`, then stop that PID) before starting a fresh one.
- **Never manually assign `id` before `save()`.** See the bug writeup above — let `@GeneratedValue` + Postgres handle it.

## Commands

Backend — Maven wrapper, Windows (PowerShell), run from the repo root:

```
.\mvnw.cmd spring-boot:run      # run the app (localhost:8080)
.\mvnw.cmd test                 # run all tests
.\mvnw.cmd test -Dtest=CalTrackerApplicationTests            # run a single test class
.\mvnw.cmd test -Dtest=SomeTests#someMethod                  # run a single test method
.\mvnw.cmd clean package        # build the jar
```

Frontend — from `frontend/`:

```
npm install                     # first-time setup / after pulling new deps
npm run dev                     # run the app (localhost:5173)
```

Database — Postgres 18, native Windows service `postgresql-x64-18` (not Docker):

```
psql -U caltracker_app -h localhost -d caltracker    # connect as the app role (password in application.properties)
psql -U postgres -h localhost                          # connect as superuser (for admin tasks, e.g. creating roles/dbs)
```

Java 26, Spring Boot 4.1.0. Run backend + frontend + Postgres (as a Windows service, starts automatically) for the app to work end-to-end. `frontend/` is a plain sibling folder to `pom.xml` inside this same repo — not wired into the Maven build (no `frontend-maven-plugin`), matching the roadmap's v3 plan to deploy backend and frontend separately (Render/Railway + Vercel) rather than bundle into one jar. Revisit this structure if that deploy plan changes.
