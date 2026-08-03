# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A calorie tracker — the user's summer-long full-stack learning project (see the Notion "Calorie Tracker — Roadmap" page under Summer Prep). It grows one architectural layer at a time; the standing rule is **add a layer only when you understand the one beneath it**. Every version should be explainable in an interview. Depth over speed — the understanding is the deliverable, not the feature count.

### Version arc (from the Notion roadmap)

- **v1 (current, Week 4 — Aug 2026):** React frontend + Spring Boot API with **in-memory storage only** — meals live in a `List<MealEntry>` in the backend. No database. Data loss on restart is intentional; it sets up the motivation for v2.
- **v2 (later):** Swap the in-memory list for Postgres via Spring Data JPA. Only the storage layer changes — the frontend and request loop stay identical.
- **v3 (later):** Deploy — backend to Render/Railway, frontend to Vercel, hosted Postgres.
- **v4+ (ongoing):** Dates/history, charts, a second entity (reusable foods or daily goals), users/auth, and a capstone: photo-of-meal → Claude API calorie estimation.

### v1 scope (the current work)

- **Part A (backend):** `MealEntry` model (`id` long, `name` String, `calories` int); a `@RestController` holding a `List<MealEntry>` plus an id counter; endpoints `GET /api/meals`, `POST /api/meals`, `DELETE /api/meals/{id}`. Done when the API works via Postman/curl.
- **Part B (frontend):** Separate Vite React app (localhost:5173) — form with controlled inputs, meal list via `useEffect` + `.map()`, delete buttons, daily total via `reduce`. CORS is expected on first connection; fix is `@CrossOrigin(origins = "http://localhost:5173")` on the controller.

**Do not add layers ahead of the roadmap** (no database, no repositories/JPA entities, no auth) — pre-building defeats the learning structure. The user is a learner; prefer explaining the why behind code over dumping finished abstractions.

## Current state

Fresh Spring Initializr skeleton: only `CalTrackerApplication.java` and an empty `application.properties` exist. No controllers, models, or frontend yet.

Note: `pom.xml` includes `spring-boot-starter-data-jpa` even though v1 needs only Spring Web (the roadmap says Spring Web only). With no datasource configured and no embedded DB dependency, JPA auto-configuration will fail at startup — either remove the JPA starter until v2 or expect to deal with datasource config.

## Commands

Maven wrapper, Windows (PowerShell):

```
.\mvnw.cmd spring-boot:run      # run the app (localhost:8080)
.\mvnw.cmd test                 # run all tests
.\mvnw.cmd test -Dtest=CalTrackerApplicationTests            # run a single test class
.\mvnw.cmd test -Dtest=SomeTests#someMethod                  # run a single test method
.\mvnw.cmd clean package        # build the jar
```

Java 26, Spring Boot 4.1.0. The v1 frontend, when created, will be a separate Vite React app (`npm run dev`, port 5173) — likely in its own directory or sibling repo.
