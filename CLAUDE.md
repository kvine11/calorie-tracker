# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A calorie tracker — the user's summer-long full-stack learning project (see the Notion "Calorie Tracker — Roadmap" page under Summer Prep). It grows one architectural layer at a time; the standing rule is **add a layer only when you understand the one beneath it**. Every version should be explainable in an interview. Depth over speed — the understanding is the deliverable, not the feature count.

### Version arc (from the Notion roadmap — revised 2026-08-06)

- **v1 (done):** React frontend + Spring Boot API with in-memory storage — meals lived in a `List<MealEntry>` in the backend, wiped on every restart by design (to motivate v2).
- **v2 (done):** Swapped the in-memory list for Postgres via Spring Data JPA. Only the storage layer changed — the frontend and request loop stayed identical.
- **v3–v7 (current batch, before deploy):** a feature-fleshing-out phase, inserted ahead of deployment on purpose so there's more to show on a resume. Ordered by difficulty *for this user specifically* (strong in React already, brand-new to JPA relationships/external APIs), each version leaning on what the previous one just built:
  1. **v3 — Dates & history (done, 2026-08-07):** meals belong to a day; filtered/date-range queries. Gentle extension of single-entity JPA, nothing architecturally new. See "Current state" below for details.
  2. **v4 — Charts (next up):** calories over time. Leans on React (already strong); one new backend aggregation query (`GROUP BY`/`SUM`). See "Next steps" below.
  3. **v5 — Reusable/commonly-entered foods (2nd entity)**: a `Food` entity related to `MealEntry` (`@ManyToOne`/`@OneToMany`). The real jump in this batch — first multi-entity schema. Also the intended landing spot for v6's API results.
  4. **v6 — Nutrition API search**: external REST API (e.g. USDA FoodData Central, Nutritionix) to search foods and pull full macros (protein/carbs/fat, not just calories), populating the v5 `Food` entity.
  5. **v7 — Claude vision image recognition (capstone)**: photo of a meal → Claude API (multimodal) → identified food + estimated macros, wired into the same logging flow as v5/v6. Hardest of the batch; open design question for later — trust Claude's estimate directly, or use it to identify the food and look up precise macros via v6.
- **v8 (later, was v3):** Deploy — backend to Render/Railway, frontend to Vercel, hosted Postgres. Deliberately pushed later so deploy ships a fleshed-out app, not a bare CRUD demo.
- **Further down the road (uncommitted):** users/auth — not committed to yet, revisit whenever. Living project — keeps growing after deploy too.

**Do not add layers ahead of the roadmap** (no auth, no deploy config, and within v3–v7 specifically: don't jump ahead to a later version's concept before the current one is done) — pre-building defeats the learning structure. The user is a learner; prefer explaining the why behind code over dumping finished abstractions. Starting with v2, the user writes the actual feature code themselves (entity annotations, repository/service logic, API integration code, etc.) — the assistant's job is environment setup (installing dependencies, API keys/config, verifying connections) and review/explanation, not writing that code for them. This applies to v3–v7 too, including the nutrition API and Claude vision work — no vibecoding, the user wants to do the heavy lifting. (Exception, established 2026-08-07: purely visual/animation polish — not architecture or feature logic — can be delegated and implemented directly when the user asks for it explicitly, as with the frontend redesign; see "Frontend design" below.)

## Current state

**v1 (backend + frontend) is done.** `MealEntryController` at `/api/meals`: `GET`, `POST` (`@RequestBody`), `PUT /{id}` (sets id from the path onto the body before updating — the URL is the source of truth, not the JSON body), `DELETE /{id}`. Frontend is a separate Vite/React app in `frontend/` (not wired into the Maven build — matches the v3 plan to deploy backend/frontend separately). `App.jsx` owns state (`useEffect` load, `reduce` for daily total), with `Header`, `CalorieSummary`, `MealForm`, `MealList`, `FoodItem`. `api.js` wraps GET/POST/DELETE/PUT (`updateMeal` — wired into the UI as of the edit-meal feature below, see "Current state"). `@CrossOrigin` on the controller is required for the frontend to reach the backend (now `originPatterns = "http://localhost:*"` — see gotchas).

**v2 (Postgres/JPA) — core done, environment set up:**

- Postgres 18 installed natively on Windows (not Docker — deliberate, to keep focus on JPA/relational concepts). Runs as Windows service `postgresql-x64-18`. Dedicated role `caltracker_app` and database `caltracker` (not the `postgres` superuser).
- `pom.xml` has `spring-boot-starter-data-jpa` and `org.postgresql:postgresql` (runtime scope) added.
- `application.properties` has the datasource block (`jdbc:postgresql://localhost:5432/caltracker`, `caltracker_app` credentials) plus `spring.jpa.hibernate.ddl-auto=update` (Hibernate creates/updates tables from `@Entity`, never drops data) and `spring.jpa.show-sql=true` (prints generated SQL — intentional, for learning).
- `model/MealEntry.java` — `@Entity` + `@Table(name = "meal_entries")`, `@Id` + `@GeneratedValue(strategy = GenerationType.IDENTITY)` on `id` (kept as primitive `long`, not `Long`).
- `service/MealEntryRepository.java` — `interface MealEntryRepository extends JpaRepository<MealEntry, Long>`. Note: lives in the `service` package, not a separate `repository` package — works fine via component scan, just an organizational quirk if you go looking for it.
- `service/MealEntryService.java` — delegates to `MealEntryRepository` instead of the old `ArrayList`/`AtomicLong`.

**A real bug was hit and fixed in v2, worth knowing about:** the first version of the rewritten service kept the old `AtomicLong idCounter` and manually called `mealEntry.setId(idCounter.getAndIncrement())` before `save()`. Spring Data JPA's `save()` decides insert-vs-update by checking whether the primitive `id` is `0` (new) or nonzero (existing). Manually assigning a nonzero id made every add look like an update to a row that didn't exist, so Hibernate called `merge()`, did a `SELECT` that found nothing, and threw `StaleObjectStateException` on every POST. Fix: never set `id` manually in `addMealEntry` — leave it at `0` and let `@GeneratedValue(IDENTITY)` + Postgres's identity column assign it. This is a general trap when migrating away from a hand-rolled id counter: two id sources (app code and DB identity column) can't both be in control.

**v3 (Dates & history) — done:**

- `MealEntry` gained a `date` field (`LocalDate`, mapped via `@Column`) — meals now belong to a specific day, not just existing in a flat list.
- `MealEntryRepository` gained a derived query method, `findByDate(LocalDate)`, matching Spring Data JPA's method-name-to-JPQL convention — no `@Query` needed. Service (`getMealEntriesByDate`) and controller (`GET /api/meals/date/{date}`) expose it. Date-*range* queries were deliberately deferred to v4, since v3 only ever needed single-day lookups.
- Design decision: **no manual date entry anywhere in the UI.** A new meal is always stamped with whichever day is currently selected in the date strip (defaults to today) — the date comes from application state, not a form field. This is why `MealForm` still has no date input, and why `App.jsx`'s `handleAdd` reads `entryDate` from closure rather than accepting it as a parameter — backfilling a meal onto a previous day works by browsing to that day first, then adding.
- Frontend: `App.jsx` now owns `entryDate` (a plain `"yyyy-MM-dd"` string, not a `Date` object — deliberate, see gotchas below) driving a `useEffect` that re-fetches via `getMealsByDate` whenever it changes. New `DateSelection.jsx` component renders a horizontal Sun–Sat day strip (showing both weekday letter and `month/day`, e.g. `8/7`) with prev/next week paging; selecting a day — or paging a week, which also re-selects — calls an `onDateChange` callback prop up to `App`, mirroring the existing `onAdd`/`onDelete` callback pattern from `MealForm`/`MealList`.
- Postman collection ("Calories API", in the user's Postman workspace) updated to match: `AddMeals`/`UpdateMeals` bodies now include `date`, and a `MealsByDate` request (`GET /api/meals/date/{date}`) was added for testing the filtered endpoint directly.

**Edit-meal UI (done, 2026-08-18):** closes the gap flagged repeatedly since v1 — `PUT /api/meals/{id}` and `updateMeal()` now have a real frontend flow (update calories, and move/backfill a meal to a previous date). No backend changes were needed; this was pure frontend wiring on top of the endpoint that already existed.

- Design: an inline expand-in-place edit form on each `FoodItem` row (not a modal) — the ✎ trigger swaps the row's display view for a form (name/calories inputs + an embedded `DateSelection` day-strip + Save/Cancel), reusing the `layout` animation prop the row already had via framer-motion, wrapped in `AnimatePresence` for a fade between the two views. Editing includes `date`, not just calories — the embedded day-strip is a *second*, independent instance of `DateSelection`, not the same one driving the top-level nav.
- `DateSelection.jsx` gained a `layoutId` prop (default `"day-highlight"`), needed specifically so the embedded edit-form instance's shared-element highlight animation doesn't collide with the top-level date strip's.
- Data flow: `FoodItem` owns local `isEditing` + draft `name`/`calories`/`date` state, reset from props every time edit mode is opened (not just on mount — otherwise a cancel-then-reedit shows stale drafts). Save calls `onUpdate({ name, calories, date })` — an object, no `id` — mirroring the existing `onDelete={() => onDelete(meal.id)}` pattern: `MealList` injects `meal.id` by wrapping the callback, and `App.handleUpdate(id, updates)` follows the same `updateMeal` → `setMeals(await getMealsByDate(entryDate))` shape as `handleAdd`/`handleDelete`. That refetch is what makes moving a meal to a different day "just work" — once its `date` no longer matches `entryDate`, it naturally drops out of the current list without any special-case logic.
- Verified end-to-end (browser + the Postman "Calories API" collection's `UpdateMeals` request, which already matched the request shape used): calorie-only edits recalculate the total correctly; moving a meal's date removes it from the current day's list and it correctly reappears on the target day.

Bugs worth knowing about, hit while building this:
- Chaining `useState` setters with `&&` (`setDraftName(name) && setDraftCalories(calories) && ...`) silently drops every call after the first, since setters return `undefined` and `&&` short-circuits on the first falsy result. Sequential statements are required when multiple setters need to run together, not a chained expression.
- An `onUpdate={...}` prop was attached directly to a `<button>`, expecting it to behave like a click handler. It never fired — `onUpdate` isn't a recognized DOM event, so React never wires it to anything. Only real event props (`onClick`, `onChange`, etc.) get attached to native elements.
- The update callback's argument shape drifted at nearly every layer while being built — briefly `onUpdate(id, name, calories, date)` (positional, with a redundant `id`) before settling on `onUpdate({ name, calories, date })` to match what `updateMeal(id, updates)` in `api.js` actually expects. Once one layer of a callback chain settles on an object shape, every layer above it has to keep passing that same shape through rather than re-splitting it into positional args partway up the chain.
- `draftCalories` comes from a `type="number"` input, so `event.target.value` is always a string — the same reason `MealForm` wraps with `Number(calories)` before calling `onAdd`. Missing that conversion here would have sent `"calories": "550"` (a string) in the PUT body instead of a number.

**Known gap in v3, deferred on purpose:** `CalorieSummary`'s "Calories Today" label is hardcoded — it doesn't check whether `entryDate` is actually today, so browsing a previous day shows a factually wrong label next to a correct number (confirmed live: browsing to a past day showed "Calories Today: 0" while today's real total was 100). Left as-is — noted for a future PR, not fixed in this session. `Header`'s date display is intentionally *not* date-aware — it should always show the real current date regardless of what's selected in the strip, per explicit user decision.

**Not done yet (any version):** no 404 handling when updating/deleting an unknown id (`deleteById` on a missing id throws rather than no-ops now — a real behavior change from v1 — but proper `@ExceptionHandler`/`ResponseStatusException` handling is deliberately deferred, it's API-design work not storage-layer work); no seed data.

### Request flow (how a call actually reaches Postgres)

Worth understanding end to end, since none of this is written by hand — it's wired together by annotations + config:

1. **Frontend → Controller**: `api.js` sends the HTTP request; Jackson deserializes the JSON body into a `MealEntry` via the no-arg constructor + setters (the `@JsonCreator(DISABLED)` all-args constructor stays out of this path on purpose, since POST bodies omit `id`).
2. **Controller → Service → Repository**: the controller calls a service method, which calls a method on `MealEntryRepository`. That interface has no implementation in this codebase — Spring Data JPA generates a real implementation (a dynamic proxy) at startup, partly from pre-written library code (`SimpleJpaRepository`) and partly by parsing derived-query method names like `findByDate` into JPQL at startup (validated against the entity's fields before the app is even ready to serve requests).
3. **Repository proxy → Hibernate**: the generated proxy delegates to Hibernate (the JPA provider), which reads the `@Entity`/`@Table`/`@Id`/`@Column` annotations on `MealEntry` and turns the method call into an actual SQL string (visible in the console via `show-sql=true`).
4. **Hibernate → JDBC → Postgres**: that SQL travels over a real network connection opened by the `org.postgresql:postgresql` driver, using the connection pool (HikariCP) Spring Boot auto-configures from the `spring.datasource.*` properties.
5. Response flows back up the same chain: Postgres → JDBC → Hibernate maps result rows back into `MealEntry` objects (same no-arg-constructor-plus-setters mechanism, just driven by SQL columns instead of JSON fields) → repository → service → controller → Jackson serializes to JSON → frontend.

### Known gotchas

- **Stale dev servers break CORS silently.** If `npm run dev` reports "Port 5173 is in use, trying another one," a leftover Vite process is squatting on 5173. Fix: find and kill the stale process (`netstat -ano | findstr :5173`, then stop that PID) before starting a fresh one. `@CrossOrigin` is now set to `originPatterns = "http://localhost:*"` specifically so a stray port doesn't silently break the frontend's fetch calls again.
- **Never manually assign `id` before `save()`.** See the AtomicLong bug writeup above — let `@GeneratedValue` + Postgres handle it.
- **JS `Date` string parsing is timezone-dependent, and it bit us twice building v3.** `new Date("2026-08-07")` (a date-only string) parses as **UTC midnight**, not local midnight — in any negative-UTC-offset timezone (most of the US), reading local getters (`.getDate()`, etc.) off the result can silently show the *previous* day. The fix used throughout the frontend: split the `"yyyy-MM-dd"` string into numeric year/month/day and use the multi-argument `new Date(year, monthIndex, day)` constructor (always local, no ambiguity) — never hand a date-only string straight to `new Date(...)`. This will come up again in v4's date-range picker.
- **Never mutate a `Date` object you're about to loop `setDate()` over.** `DateSelection.jsx`'s week-generation logic originally called `.setDate()` repeatedly on the *same* mutating `Date` object across a 7-iteration loop; `setDate()` resolves relative to the object's *current* month at call time, so once one iteration rolled into a new month, every later iteration silently computed against the wrong month — a bug that only shows up for weeks spanning a month boundary. Fix: clone fresh from the untouched anchor date on every iteration. A related version of the same mistake: never mutate React state directly (e.g. calling `.setDate()` on a value straight out of `useState`) — always clone first, then call the setter.
- **`&&` is not a safe substitute for sequential statements when chaining `useState` setters (or any side-effecting calls).** Setters return `undefined`, so `a() && b() && c()` silently stops after `a()` — hit while building the edit-meal feature's "reset drafts on open" logic. Write multiple setter calls as separate statements.
- **A callback's argument shape has to stay consistent across the whole prop-drilling chain.** Once a leaf component (e.g. `FoodItem`) settles on calling a callback with an object (`onUpdate({ name, calories, date })`), every intermediate layer up to where the API call actually happens has to keep passing that same object through — re-splitting it into positional args partway up (as briefly happened in `App.handleUpdate` while building the edit-meal feature) breaks the chain. Match the shape of the existing analogous callback (`onDelete`) rather than inventing a new one.

## Next steps: v4 — Charts

Not started. Per the roadmap: calories over time, leaning on React (already strong) plus one new backend aggregation concept.

- **Backend:** `MealEntryRepository` needs a date-*range* query (e.g. `findByDateBetween(LocalDate start, LocalDate end)`) — the range-query capability deliberately deferred during v3. Likely also a `GROUP BY`/`SUM` aggregation query (calories per day across a range) — Spring Data derived-method naming won't express that on its own; expect to reach for `@Query` (JPQL) for the first time in this project, or a projection interface/DTO for the grouped result shape.
- **Frontend:** needs a charting library — none installed yet. Deciding which one (e.g. `recharts` is the common React-idiomatic choice) is worth doing deliberately rather than defaulting. Installing it is environment setup (assistant's job); building the chart component is the user's, per the project's standing rule.
- **Date-range picker:** v4 will need its own "last 7 days" / "last 30 days" / custom-range selection UI. Worth reusing the lessons from `DateSelection.jsx` (string-based dates, safe local `Date` construction, avoiding `new Date(dateString)` for date-only strings) rather than re-learning them.
- **Open design question, not yet decided:** does the chart read from the same day-scoped `entryDate` concept already in `App.jsx`, or introduce a separate "range" state alongside it?

## Frontend design

A visual redesign pass was done on 2026-08-07 (explicitly delegated by the user — unlike feature code, styling/animation isn't covered by the "user writes it" rule for this project; see the exception noted above). Direction: a nutrition-label/kitchen-scale aesthetic, replacing the initial generic-SaaS defaults (soft gray background, emerald accent, pill buttons, Inter).

- **Palette:** warm paper background (`#F5F3ED`), near-black ink, one accent (`#C1401A`, a vermilion/rust) used sparingly — the calorie readout, hover states, the Add button.
- **Type:** `Fraunces` (a warm, soft serif) for the two "hero" moments — today's date in the header, the big calorie number — everything else runs on `Nunito Sans` (soft, rounded humanist sans). Switched from an earlier Archivo + Space Mono pass after explicit feedback that it read as too rigid/technical. `tabular-nums` keeps digits aligned without needing an actual monospace face.
- **Motion:** `framer-motion` (added as a frontend dependency). A staggered fade-up on page load, meals animating in/out of the list on add/delete, a sliding shared-`layoutId` highlight on the selected day in the date strip, and a subtle transition on the calorie total when it changes. `prefers-reduced-motion` is respected globally via `index.css`.

General aesthetic guidance for future frontend work on this project:

<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>

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
