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

**Part A (backend) is done and working.** `pom.xml` uses `spring-boot-starter-webmvc` only (no JPA starter, so the old datasource-conflict concern doesn't apply). Built as controller/service/model:

- `model/MealEntry.java` — `id` (long), `name` (String), `calories` (int).
- `service/MealEntryService.java` — `@Service` holding `List<MealEntry> mealEntries`, seeded with 3 sample meals (ids 1–3) at startup. Ids for new meals are server-assigned via an `AtomicLong idCounter` (starts at 4) — the client never sets an id on POST; it's stamped in `addMealEntry`. `updateMealEntry`/`deleteMealEntry` match by id.
- `controller/MealEntryController.java` — `@RestController` at `/api/meals`: `GET`, `POST` (`@RequestBody`), `PUT /{id}` (`@RequestBody`, sets the id from the path onto the body before updating — the URL is the source of truth, not the JSON body), `DELETE /{id}`.

Verified end-to-end via Postman: POST → GET → PUT → DELETE all work as expected.

**Part B (frontend) is also done and working**, at `frontend/` (sibling to `pom.xml`, inside the same repo) — a Vite/React app: `App.jsx` owns state (`useEffect` load, `reduce` for the daily total), with `Header`, `CalorieSummary`, `MealForm`, `MealList`, and a reusable `FoodItem` component (one per meal, via `.map()`). Styled minimalist/CalAI-MyFitnessPal-inspired with Tailwind v4. `api.js` wraps `GET`/`POST`/`DELETE` (plus `updateMeal` for `PUT`, defined but not wired into the UI yet — edit UI is intentionally deferred). `@CrossOrigin(origins = "http://localhost:5173")` is on `MealEntryController` for this to work.

Two bugs hit and fixed while wiring this up, worth knowing about:
- CORS: the `@CrossOrigin` annotation above — expected per the roadmap, not a surprise.
- Jackson: `MealEntry`'s 3-arg constructor was being auto-detected by Jackson as the JSON-deserialization constructor, which broke POST (whose body omits `id` on purpose, since the server assigns it) with `Cannot map 'null' into type 'long'`. Fixed with `@JsonCreator(mode = JsonCreator.Mode.DISABLED)` on that constructor, forcing Jackson back to the no-arg constructor + setters.

Not done yet: no 404 handling when updating/deleting an unknown id (service methods return `void`, so it silently no-ops); no edit/update UI.

**Frontend was originally built in a wrong location** (a sibling directory, `calTracker-frontend`, outside this repo) and then moved into `frontend/` here — that migration is done, the sibling directory no longer exists. Considered nesting it at `src/main/frontend` (the `frontend-maven-plugin` convention for bundling frontend+backend into one deployable jar) but decided against it for now: the roadmap's v3 step deploys backend and frontend separately (Render/Railway + Vercel), so there's no current reason for Maven to know the frontend exists. Revisit if the deploy plan changes — see the note in Commands below.

**Next session:** user is going to read through the frontend component code (`frontend/src/`) after a break and will likely have clarification questions — no code changes expected to be needed going in, just explaining what's there.

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

Java 26, Spring Boot 4.1.0. Run both dev servers at once for the app to work end-to-end (frontend calls the backend at `localhost:8080`). `frontend/` is a plain sibling folder to `pom.xml` inside this same repo — not wired into the Maven build (no `frontend-maven-plugin`), matching the roadmap's v3 plan to deploy backend and frontend separately (Render/Railway + Vercel) rather than bundle into one jar. Revisit this structure if that deploy plan changes.
