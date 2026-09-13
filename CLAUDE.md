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
- **Mid-stream deviation from the order above (as of 2026-08-25):** the nutrition-API search work described under v6 was actually built and is being committed under the **v4 PR** instead — ahead of Charts, not after v5's `Food` entity. v5's entity and v6's original "populate it via an API" framing are unaffected as future work (the search feature below is built against ad-hoc DTOs, not a persisted `Food` entity, so that refactor is still open). Charts (the original v4 scope) is still not started — see "Next steps" below.
- **v4.5 — Search UX (resolved 2026-08-27, never built as designed):** the v4 PR's search feature used an inline dropdown under the Food field that visually covered the Cal field, Save/Cancel buttons, and the date strip once results filled it out. A bottom sheet was designed to fix it; the frontend revamp solved the problem another way first, so the sheet was dropped. See "v4.5 — Search UX: resolved, not as planned" below.
- **v8 (later, was v3):** Deploy — backend to Render/Railway, frontend to Vercel, hosted Postgres. Deliberately pushed later so deploy ships a fleshed-out app, not a bare CRUD demo.
- **Further down the road (uncommitted):** users/auth — not committed to yet, revisit whenever. Living project — keeps growing after deploy too.

**Do not add layers ahead of the roadmap** (no auth, no deploy config, and within v3–v7 specifically: don't jump ahead to a later version's concept before the current one is done) — pre-building defeats the learning structure. The user is a learner; prefer explaining the why behind code over dumping finished abstractions. Starting with v2, the user writes the actual feature code themselves (entity annotations, repository/service logic, API integration code, etc.) — the assistant's job is environment setup (installing dependencies, API keys/config, verifying connections, html frontend markup, react components) and review/explanation, not writing that code for them. This applies to v3–v7 too, including the nutrition API and Claude vision work — no vibecoding, the user wants to do the heavy lifting. (Exception, established 2026-08-07: purely visual/animation polish — not architecture or feature logic — can be delegated and implemented directly when the user asks for it explicitly, as with the frontend redesign; see "Frontend design" below.) (One-time exception, 2026-09-12: the user explicitly had the assistant write the backend Java for the MVP hardening pass — request DTOs, validation, error handling, queries, tests — followed by a walkthrough. See "MVP hardening" below. It does not carry forward: from v4 Charts on, the user writes feature code again.)

## Current state

**v1 (backend + frontend) is done.** `MealEntryController` at `/api/meals`: `GET`, `POST` (`@RequestBody`), `PUT /{id}` (sets id from the path onto the body before updating — the URL is the source of truth, not the JSON body), `DELETE /{id}`. Frontend is a separate Vite/React app in `frontend/` (not wired into the Maven build — matches the v3 plan to deploy backend/frontend separately). `App.jsx` owns state (`useEffect` load, `reduce` for daily total). Its original children were `Header`, `CalorieSummary`, `MealForm`, `MealList`, `FoodItem` — `Header` and `CalorieSummary` were **deleted in the frontend revamp** (`1be4438`); see "Current frontend structure" below for what renders today. `api.js` wraps GET/POST/DELETE/PUT (`updateMeal` — wired into the UI as of the edit-meal feature below, see "Current state"). CORS used to be a `@CrossOrigin` annotation on each controller; since 2026-09-12 it's one `config/WebConfig` driven by `app.cors.allowed-origins`, and in development the Vite proxy makes it moot (see gotchas).

**v2 (Postgres/JPA) — core done, environment set up:**

- Postgres installed natively (not Docker — deliberate, to keep focus on JPA/relational concepts). **The project now runs on macOS with Homebrew `postgresql@16`**, managed by launchd via `brew services` — see Commands and the `brew services` gotcha below. (Originally set up as Postgres 18 on Windows under the service `postgresql-x64-18`; that's history, not the current machine.) Dedicated role `caltracker_app` and database `caltracker`, not a superuser.
- `pom.xml` has `spring-boot-starter-data-jpa` and `org.postgresql:postgresql` (runtime scope) added.
- `application.properties` has the datasource block. Originally it hardcoded the URL, role and password and used `spring.jpa.hibernate.ddl-auto=update`; **as of 2026-09-12 all of that comes from environment variables (a gitignored `.env`) and Flyway owns the schema with `ddl-auto=validate`** — see "MVP hardening" below. `show-sql` is still available for learning via `SHOW_SQL=true`.
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

**Nutrition-API search (FatSecret) — done, shipped under the v4 PR (2026-08-25):** originally scoped as v6, but built now instead (see the version-arc deviation note above). Lets the user search FatSecret's food database while typing a meal name, in both the add-meal form and the edit-meal form, with a graceful manual-entry fallback when nothing matches — the core requirement the whole feature was built around.

- Backend: `FoodSearchService` calls FatSecret's OAuth2 client-credentials token endpoint (caching the token until `expires_in` elapses), then `GET /rest/foods/search/v1`, parsing calories out of `food_description` via regex. **Macros landed later (PR #8, "macrodisplay") and this limitation is now largely resolved:** FatSecret still returns no structured macro *fields*, but protein/carbs/fat are embedded in the same `food_description` string, and a second regex (`macro + ":\\s*(\\d+(?:\\.\\d+)?)g"`) pulls them out. So v6's original "pull full protein/carbs/fat" goal is met by string-parsing one endpoint rather than by a richer one. `FoodSearchController` exposes this at `GET /api/meals/search?query=...`, grouped under `/api/meals` alongside `MealEntryController`'s endpoints rather than its own top-level path.
- **Real bug hit and fixed:** a genuine zero-result search (FatSecret omits the `food` key entirely when nothing matches) caused a `NullPointerException` → `500` instead of an empty list — `searchFood()` now null-checks `response.foods()` / `response.foods().food()` before iterating and returns `[]`. This mattered more than a typical null-check: a search miss returning cleanly is the exact case ("type anything, get no matches, still add it manually") the feature exists to support.
- Frontend: `MealForm.jsx` and `FoodItem.jsx` (edit view) each debounce (`useDebounce`, ~300ms) the food-name field, call `searchMeals()` (`api.js`), and render up to 10 suggestions in an absolutely-positioned dropdown under the input; picking one pre-fills name + calories but leaves calories editable (deliberate — different portion sizes). `FoodItem`'s search effect is gated on `isEditing` (the debounce hook itself still runs unconditionally every render — hooks can't be called conditionally — but the effect body short-circuits when not actively editing), otherwise every meal row on the page would silently fire a search on mount.
- **Two real frontend bugs hit, worth knowing about:**
  - **z-index tie, broken by DOM order.** `DateSelection.jsx`'s day-label `<span>`s use `relative z-10` (to sit above their own animated selected-day highlight circle) — the suggestions dropdown also used `z-10`. Equal z-index is broken by DOM order, and `DateSelection` renders after the Food field in `FoodItem`'s edit form, so its day labels painted over the dropdown wherever they overlapped — confirmed via live computed-style inspection (every ancestor was `position: static`, ruling out a deeper stacking-context cause), not guessed at. Fixed by bumping the dropdown to `z-50`. General lesson: overlay/dropdown elements need a distinctly higher z-index tier than any in-flow decorative z-index used elsewhere, not just "any positive number."
  - **Stale closure in a `useEffect` with an empty dependency array.** The click-outside-to-close handler read `suggestions.length > 0` inside a listener attached via `useEffect(() => {...}, [])` — since the effect never re-ran, the closure kept referencing `suggestions` from mount (`[]`) forever, so the check was always `false` and the dropdown never actually closed on an outside click. Fixed by adding `suggestions` to the dependency array so the listener is reattached with a fresh closure whenever it changes.
- **Limitation at the time, since resolved:** the inline dropdown covered the Cal field, Save/Cancel, and the date strip once it had enough results — the z-index/close-on-outside-click bugs above were fixed, but the underlying "a tall list squeezed into a narrow card" layout problem wasn't. The frontend revamp fixed it by dropping the overlay in `FoodItem` entirely; see "v4.5 — Search UX: resolved, not as planned" below.
- **Environment setup this required, Mac-specific (2026-08-25 — see gotchas):** a `JAVA_HOME` fix (pointed at Java 21; this project needs 26 — Java 26 was installed via Homebrew but never registered with macOS's `java_home` framework, which `spring-boot-maven-plugin`'s forked run step consults independently of the shell's `JAVA_HOME` env var — fixed by symlinking it into `/Library/Java/JavaVirtualMachines/`), plus `FATSECRET_CLIENT_ID`/`FATSECRET_CLIENT_SECRET` env vars (not committed — referenced via `${...}` placeholders in `application.properties`).

**Known gap in v3 — RESOLVED by the frontend revamp (verified 2026-09-07).** `CalorieSummary` no longer exists; `TodayView` renders `<h1>{longDate(entryDate)}</h1>`, so the heading is always the *selected* day and can never sit a "today" label above another day's number. `Header` is gone too, so its deliberately-not-date-aware display is moot. Original wording kept below for history: `CalorieSummary`'s "Calories Today" label was hardcoded — it doesn't check whether `entryDate` is actually today, so browsing a previous day shows a factually wrong label next to a correct number (confirmed live: browsing to a past day showed "Calories Today: 0" while today's real total was 100). Left as-is — noted for a future PR, not fixed in this session. `Header`'s date display is intentionally *not* date-aware — it should always show the real current date regardless of what's selected in the strip, per explicit user decision.

**Not done yet (any version):** no seed data. (404 handling for unknown ids — long listed here — landed in the MVP hardening pass.)

### Request flow (how a call actually reaches Postgres)

Worth understanding end to end, since none of this is written by hand — it's wired together by annotations + config:

1. **Frontend → Controller**: `api.js` sends the HTTP request to a relative `/api/...` URL; in development the Vite dev server proxies it to `:8080`. Jackson deserializes the JSON body into a request record (`MealEntryCreateRequest` / `MealEntryUpdateRequest` — never the entity, and neither has an `id` field), and `@Valid` checks its constraints before the controller method runs. A failure anywhere below is turned into a problem+json response by `ApiExceptionHandler`.
2. **Controller → Service → Repository**: the controller calls a service method, which calls a method on `MealEntryRepository`. That interface has no implementation in this codebase — Spring Data JPA generates a real implementation (a dynamic proxy) at startup, partly from pre-written library code (`SimpleJpaRepository`) and partly by parsing derived-query method names like `findByDate` into JPQL at startup (validated against the entity's fields before the app is even ready to serve requests).
3. **Repository proxy → Hibernate**: the generated proxy delegates to Hibernate (the JPA provider), which reads the `@Entity`/`@Table`/`@Id`/`@Column` annotations on `MealEntry` and turns the method call into an actual SQL string (visible in the console via `show-sql=true`).
4. **Hibernate → JDBC → Postgres**: that SQL travels over a real network connection opened by the `org.postgresql:postgresql` driver, using the connection pool (HikariCP) Spring Boot auto-configures from the `spring.datasource.*` properties.
5. Response flows back up the same chain: Postgres → JDBC → Hibernate maps result rows back into `MealEntry` objects (same no-arg-constructor-plus-setters mechanism, just driven by SQL columns instead of JSON fields) → repository → service → controller → Jackson serializes to JSON → frontend.

### Known gotchas

- **`Unable to determine Dialect without JDBC metadata` means Postgres is not running — it is not a config problem.** Hibernate opens a connection at startup to ask the server what it is; no server → no metadata → no dialect. The message points at JPA config and sends you hunting in `application.properties`, but the fix is almost always `brew services start postgresql@16`. **Check `brew services list` (`started` vs `none`) before touching any config.** `pg_isready -h localhost -p 5432` and `lsof -nP -iTCP:5432 -sTCP:LISTEN` confirm it in one line.
- **`brew services stop postgresql@16` does two things, and the second one is easy to miss.** It stops the server *and* deregisters the launchd agent, so Postgres no longer auto-starts on login — a reboot does not bring it back, which makes it look like a mysterious deep setting rather than a service you stopped. `brew services start postgresql@16` restores both (the plist has `RunAtLoad` + `KeepAlive`). Diagnosed 2026-09-10: the server log showed a clean `received smart shutdown request` (not a crash) and `launchctl list | grep postgres` was empty. A clean shutdown in the log means your data is fine.
- **Stale dev servers.** If `npm run dev` reports "Port 5173 is in use, trying another one," a leftover Vite process is squatting on 5173 — find and kill it (`lsof -nP -iTCP:5173 -sTCP:LISTEN`, then `kill <PID>`). This used to break CORS silently; since 2026-09-12 the frontend calls relative `/api` URLs through the Vite proxy, so the browser never makes a cross-origin request in development. `app.cors.allowed-origins` (default `http://localhost:*`) only matters for a separately hosted frontend.
- **Local Postgres doesn't check passwords.** Homebrew's `pg_hba.conf` uses `trust` for every local and `127.0.0.1` connection, so any `DB_PASSWORD` works on this machine — a wrong one will only fail once deployed. (Found 2026-09-12 while rotating the old committed password, which still "worked" after rotation.)
- **Never edit a Flyway migration that has already run.** Flyway checksums applied files and refuses to start if one changed. A schema change is always a new `V{n}__description.sql` in `src/main/resources/db/migration`, plus the matching entity change. If startup fails with `Schema-validation: missing column`/`wrong column type`, the entity and the migrations disagree — `ddl-auto=validate` is doing its job.
- **`.env` is read from the working directory.** Run `./mvnw` from the repo root (tests too), or the app starts without `DB_PASSWORD` and the FatSecret keys and fails with an unresolved-placeholder error.
- **Never manually assign `id` before `save()`.** See the AtomicLong bug writeup above — let `@GeneratedValue` + Postgres handle it.
- **JS `Date` string parsing is timezone-dependent, and it bit us twice building v3.** `new Date("2026-08-07")` (a date-only string) parses as **UTC midnight**, not local midnight — in any negative-UTC-offset timezone (most of the US), reading local getters (`.getDate()`, etc.) off the result can silently show the *previous* day. The fix used throughout the frontend: split the `"yyyy-MM-dd"` string into numeric year/month/day and use the multi-argument `new Date(year, monthIndex, day)` constructor (always local, no ambiguity) — never hand a date-only string straight to `new Date(...)`. This will come up again in v4's date-range picker.
- **Never mutate a `Date` object you're about to loop `setDate()` over.** `DateSelection.jsx`'s week-generation logic originally called `.setDate()` repeatedly on the *same* mutating `Date` object across a 7-iteration loop; `setDate()` resolves relative to the object's *current* month at call time, so once one iteration rolled into a new month, every later iteration silently computed against the wrong month — a bug that only shows up for weeks spanning a month boundary. Fix: clone fresh from the untouched anchor date on every iteration. A related version of the same mistake: never mutate React state directly (e.g. calling `.setDate()` on a value straight out of `useState`) — always clone first, then call the setter.
- **`&&` is not a safe substitute for sequential statements when chaining `useState` setters (or any side-effecting calls).** Setters return `undefined`, so `a() && b() && c()` silently stops after `a()` — hit while building the edit-meal feature's "reset drafts on open" logic. Write multiple setter calls as separate statements.
- **A callback's argument shape has to stay consistent across the whole prop-drilling chain.** Once a leaf component (e.g. `FoodItem`) settles on calling a callback with an object (`onUpdate({ name, calories, date })`), every intermediate layer up to where the API call actually happens has to keep passing that same object through — re-splitting it into positional args partway up (as briefly happened in `App.handleUpdate` while building the edit-meal feature) breaks the chain. Match the shape of the existing analogous callback (`onDelete`) rather than inventing a new one.

## Current frontend structure (compact MVP pass, 2026-09-12)

The v1 component list in "Current state" is historical, and so is the four-pane Oxide shell from 2026-09-07. What actually renders today:

- **`App.jsx`** owns `view` (`"today" | "history"`) — hand-rolled, **not** `react-router-dom`, which is still not a dependency. It also owns `entryDate`, `meals` plus `mealsDate` (the day those meals belong to — the ring and list key off it so they redraw when data lands, not a frame early), the toast, and the palette. **Every write goes through `mutate(write, whatFailed)`**: run it, refetch the day, bump `revision` (History refetches), and turn a failure into an error toast. It resolves to whether it worked, so `MealForm` only clears on success. `handleAdd` takes an object `{ name, calories, protein, carbs, fats, date? }` — every caller passes that shape.
- **Shell:** `TopBar.jsx` (56px sticky: brand, Today/History tabs with a shared-`layoutId` sliding indicator, Quick add ⌘K) over one view. `QuickAddPalette.jsx` (Cmd/Ctrl-K) and `Toast.jsx` (undo *and* error, with a draining hairline) sit above everything.
- **Views:** `TodayView.jsx` (header with date + "Back to today" + day strip; `.today-grid` — ring card left, form + ledger right; inline error banner with Retry), `HistoryView.jsx` (last 7 days from one `getMealsInRange` call, 7-day average).
- **Pieces:** `CalorieRing.jsx` (arcs draw in with CSS transitions via `useAfterFirstPaint`; no per-meal legend — the ledger beside it carries meal identity), `MealList.jsx` (ledger card; crossfades per day, per-row enter/exit within a day), `FoodItem.jsx` (row + expandable edit form — **no food search in edit**, see "MVP hardening"), `MealForm.jsx` (one row; ↑/↓/Enter through suggestions), `DateSelection.jsx`, `MacroLine.jsx`, `Icons.jsx`.
- **Deleted 2026-09-12:** `Sidebar.jsx`, `SearchView.jsx`, `SettingsView.jsx` (its two toggles never persisted), `ConfirmDialog.jsx` (undo toast is the only delete safety net), `UndoToast.jsx` (→ `Toast.jsx`). **Deleted in the revamp (`1be4438`):** `Header.jsx`, `CalorieSummary.jsx`. Do not go looking for any of them.
- **Shared modules:** `api.js` (one `request()` helper that throws `ApiError` with the server's problem+json `detail`; `getMealsByDate`/`getMealsInRange`/`addMeal`/`updateMeal`/`deleteMeal`/`searchMeals`; base URL from `VITE_API_BASE_URL`, empty in dev), `hooks.js` (`useDebounce`, `useFoodSearch` → `{ suggestions, isSearching, unavailable }`, `useClickOutside`, `useCountUp(target, { duration, from })`, `useAfterFirstPaint`), `motion.js` (shared easings + `LAYOUT_SPRING`), `dates.js`, `macros.js`.
- **Styling:** components use classes from `index.css` (not inline style objects, as the Oxide revamp did). Tailwind is imported only for its preflight reset.

`TodayView` renders `<h1>{longDate(entryDate)}</h1>` — the heading is the *selected* day. This is what resolved the v3 "Calories Today" label gap.

## MVP hardening (2026-09-12, branch `mvp`)

A deploy-ready pass — nothing deployed, no hosting provider chosen. Backend Java written by the assistant as a one-time exception (see the rule at the top).

- **Secrets:** `application.properties` has only `${...}` placeholders; values come from a gitignored `.env` (template `.env.example`) loaded by `spring.config.import=optional:file:.env[.properties]`. Real env vars win. The `caltracker_app` password that had been committed since `init` was rotated.
- **Schema:** Flyway. `V1__baseline.sql` is exactly the schema `ddl-auto=update` had built; `V2__meal_constraints.sql` adds `NOT NULL` on `name`/`date`, non-negative `CHECK`s, and an index on `date`. The existing dev DB was adopted with `baseline-on-migrate` (V1 marked applied, V2 run). Hibernate runs `ddl-auto=validate`. `open-in-view=false`.
- **API contract:** `POST` → `201` + saved meal + `Location`; `PUT` → `200` + updated meal; `DELETE` → `204`; unknown id → `404`; `GET /api/meals/{id}` added; unbounded `GET /api/meals` replaced by `GET /api/meals?from=&to=` (inclusive, ≤366 days). Requests bind to `MealEntryCreateRequest`/`MealEntryUpdateRequest` records with Bean Validation — POST binding straight to the entity had let a body carrying `"id"` turn an insert into an overwrite (the v2 AtomicLong trap, reachable from outside). All errors are problem+json via `ApiExceptionHandler extends ResponseEntityExceptionHandler`; validation 400s include an `errors` map of field → message.
- **Ordering:** repository methods are `findByDateOrderByIdAsc` / `findByDateBetweenOrderByDateAscIdAsc`. Without an `ORDER BY`, Postgres may return rows in any order, and ring arc colours are assigned by list position.
- **FatSecret:** connect/read timeouts (`spring.http.clients.*`, 3s/5s); failures → `FoodSearchUnavailableException` → `502`; patterns compiled once; `synchronized` token refresh with a 60s margin; parsing is the static, unit-tested `toFoodSearch`.
- **Removed from the edit form: food search.** Picking a match changed name + calories but kept the old meal's macros (the update rescales what's stored), so a meal renamed to "Apple" carried the steak's protein. Editing is for portion, typo, or day.
- **Ops:** `/actuator/health` (only endpoint exposed), CORS via `config/WebConfig` + `app.cors.allowed-origins`.
- **Tests (29):** `MealEntryControllerTest` + `FoodSearchControllerTest` (`@WebMvcTest`), `MealEntryServiceTest` (Mockito), `MealEntryRepositoryTest` (`@DataJpaTest` against real Postgres `caltracker_test` — proves migrations, constraints, ordering, range), `FoodSearchServiceTest` (parsing), `CalTrackerApplicationTests` (full context under `validate`). Test profile: `src/test/resources/application-test.properties`.
- **CI:** `.github/workflows/ci.yml` — backend job with a `postgres:16` service running `./mvnw -B verify`, frontend job running `npm ci && npm test && npm run build`. Triggers on pushes to `main` and on every PR.
- **Boot 4 module names worth knowing** (all verified against the 4.1.0 jars): `spring-boot-starter-flyway` (plain `flyway-core` won't auto-configure) + `flyway-database-postgresql`; `spring-boot-starter-data-jpa-test`; `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest`; `org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest`; `org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase`.

## Frontend tests (2026-09-13)

Vitest + Testing Library, 54 tests in four files beside the modules they cover
(`src/*.test.js`). Run with `npm test` from `frontend/`; `npm run test:watch` for
a watcher. Config lives in `vite.config.js` under a `test` key — `defineConfig`
is imported from `vitest/config`, a superset of vite's, so one file configures
the dev server and the runner. `src/test/setup.js` adds the DOM matchers and
cleans up between tests.

**Pinned to vitest 2, deliberately.** Vitest 3+ requires vite 6, and this project
is on vite 5. Upgrading the build tool is its own change, not a side effect of
adding tests.

What's covered, chosen as the places bugs have actually happened:

- **`dates.test.js`** — the two documented traps: `new Date("yyyy-MM-dd")` parsing
  as UTC midnight, and the mutating-`Date` loop that broke `weekOf` across a month
  boundary. That second one only fails for a week spanning two months, so the test
  uses one.
- **`macros.test.js`** — `null` (unknown) vs `0` (a real zero) through `hasMacros`
  and `macroTotals`, and `scaleMacro` rounding identically to
  `MealEntryService.scale`. If those two drift, the same meal shows different
  grams depending on which side scaled it.
- **`api.test.js`** — the `request()` helper against a stubbed `fetch`: no `id` in
  a POST body, no macros in a PUT body, query encoding, `204` → `null`, and the
  three failure shapes (problem+json `detail`, non-JSON body, unreachable server).
- **`hooks.test.jsx`** — `useFoodSearch` with fake timers: the 2-character floor,
  one call per typed word rather than per keystroke, `enabled: false`, the
  `limit` slice, the stale-response guard, and `unavailable` as a state distinct
  from "no matches".

**Two gotchas worth knowing if you extend these:**

- **`waitFor` polls on real timers.** With `vi.useFakeTimers()` installed it never
  resolves and the test dies at the 5s timeout. These tests advance the clock
  inside `act()` and then flush microtasks instead of using `waitFor`.
- **`useDebounce` seeds its state with the value it is handed**, so mounting a
  hook with text already in the query fires a search on the first render, before
  any debounce. The test helper mounts empty and rerenders with the query, which
  is what the real input does.

## Macro tracking (PR #8 "macrodisplay", done)

Protein/carbs/fat are now first-class, end to end — this is the part of v6's original scope that actually landed:

- **`MealEntry`** gained `Double carbs`, `Double protein`, `Double fats` alongside `int calories`. Boxed `Double`, not primitive `double`, **on purpose** — a manually-entered meal legitimately has *unknown* macros, and `null` says that where `0.0` would lie. `calories` stays a primitive `int` because a meal always has one.
- **`FoodSearch`** carries the same four values from FatSecret through to the frontend, plus
  `serving` — the portion they describe ("100g", "1 cup"), parsed from the same
  `food_description` string and shown under the calorie count in both dropdowns. It is a
  search-result field only: `meal_entries` has no serving column, so the portion informs the
  pick and is not persisted.
- **`macros.js`** owns the display math: `MACROS` (the canonical trio + colors), `hasMacros`, `macroTotals`, `energySplit` (grams → calories), `formatGrams`, `scaleMacro`.
- **`MacroLine.jsx`** renders the stacked composition bar. Per DESIGN.md the macro trio sits deliberately *off* the ring's arc ramp.

## Tooling: graphify knowledge graph (added 2026-09-07)

`graphify` builds a queryable knowledge graph of this repo. Installed globally at `~/.claude/skills/graphify/`, so `/graphify` works here and in any other project.

- **Scope is pinned by `.graphifyignore`** (committed). It excludes `.claude/`; `.gitignore` is honoured too, so `target/`, `node_modules/` and `graphify-out/` are already out. A bare `/graphify .` scans **39 files** — the real project. Without it, it scanned 134 and the graph filled with vendored docs.
- **`graphify-out/` is gitignored** — the graph is a local tool, not a repo artifact. A fresh clone has no graph until rebuilt.
- **Keeping it current:** `graphify update .` re-runs AST extraction only — free, no LLM, no tokens. Run it after changing Java or JSX. Editing `CLAUDE.md`/`DESIGN.md` instead needs the semantic pass, i.e. ask for `/graphify . --update`.
- **Most useful commands:** `graphify affected "X"` (reverse traversal — what breaks if X changes, with `file:line`; run this before v5 touches `MealEntry`), `graphify explain "X"`, `graphify god-nodes`, `graphify query "..."`.
- **A stale graph is worse than none** — it will be answered from confidently. `graph.json` records `built_at_commit`; check it against `HEAD` if an answer looks wrong.
- **It cannot see the HTTP boundary.** `graphify path "MealForm()" "MealEntryRepository"` returns no path, because none exists statically — the frontend and backend are joined only by a URL string. In the graph the *only* link between the backend and frontend communities is the "Request flow" section of this file. That prose is load-bearing structure; keep it accurate.

**Repo cleanup done at the same time:** the 7 vendored Claude skills under `.claude/skills/` (banner-design, brand, design, design-system, slides, ui-styling, ui-ux-pro-max — 146 files, 2.7M) were deleted. Nothing referenced them, none had been edited since `init`, and they competed with DESIGN.md's locked-down direction. Recover with `git checkout faba5b8 -- .claude` if ever needed.

## v4.5 — Search UX: resolved, not as planned (2026-08-27)

**The bottom sheet was never built, and no longer needs to be.** v4.5 existed to fix one problem — the inline suggestions dropdown covering the Cal field, Save/Cancel, and the embedded date strip inside `FoodItem`'s edit form. The frontend revamp solved that a different way, and reviewing the code on 2026-08-27 confirmed all three of the section's goals had landed by other means:

- **The covering problem was designed out, not overlaid.** `FoodItem`'s edit view no longer uses an absolutely-positioned dropdown at all — matches render as in-flow wrapped chips *below* the fields ("Matches — tap to fill name and calories"). Nothing overlaps, so nothing can be covered. `MealForm` still uses a real absolute dropdown (`zIndex: 40`), which is fine where it sits: top of a wide column, nothing beneath it to obscure.
- **The duplicated search logic consolidated into a hook, not a shared component.** `useFoodSearch` in `hooks.js` owns the debounce, the min-2-character gate, the cancel-stale-response guard, and the `limit` slice; `MealForm`, `FoodItem`, `SearchView`, and `QuickAddPalette` all consume it and render suggestions however suits their layout. This is a better factoring than the planned `FoodSearchSheet.jsx` — the shared part was always the data-fetching, not the markup.
- **The "explicitly deferred" dedicated search page shipped.** The section deferred it pending a whole-app navigation decision; that decision got made in the revamp — a hand-rolled `view` state in `App.jsx` (not `react-router-dom`, which is still not a dependency) driving four panes, one of which is `SearchView.jsx`. `QuickAddPalette.jsx` (Cmd/Ctrl-K) covers the fast-logging case separately.

`useClickOutside` in `hooks.js` also encodes the fix for the stale-closure bug documented under "Current state" — it keeps `handler` in a ref that's reassigned every render, so the listener can't close over stale state even with a `[ref]`-only dependency array.

## Platform target: desktop-first (decided 2026-08-27)

**The app is desktop-first for now; mobile is a deliberate later pass.** This supersedes the earlier "meant to support mobile eventually" framing that motivated the bottom-sheet design — mobile is still the intent, just not the current target.

What the revamp committed to, all desktop-only affordances:

- ~~A 238px sticky `Sidebar` that never collapses~~ — **gone as of 2026-09-12.** The shell is now a 56px `TopBar` that already fits a phone width (brand name, "Quick add" label and ⌘K hint hide at ≤640px), so the biggest mobile break is fixed.
- **Cmd/Ctrl-K** (`QuickAddPalette`) as the fast-add path — unreachable without a keyboard, so touch needs its own equivalent.
- **Hover** coupling `MealList` rows to `CalorieRing` arcs (`hoverId`/`onHover`) — touch has no hover state.

Already responsive and worth keeping: the viewport meta tag is correct, `TodayView`'s two-column `[data-grid]` collapses to one at ≤1040px, and the day strip tightens at ≤620px. The content is closer to responsive than the shell is.

**Direction decided for when mobile happens (one responsive app, not two layouts):** move the `TopBar` tabs to a bottom tab bar under ~700px, promote quick add to the tab bar's center button in place of Cmd/Ctrl-K, and give the ring's hover coupling a tap equivalent. The four nav items map onto a tab bar directly, and the views underneath barely change. A separate mobile shell was considered and rejected — mobile and desktop want the same information here, so it would mean shipping every future feature twice.

## Next steps: v4 — Charts

Still not started — the v4 PR ended up carrying the nutrition-API search feature instead (see the version-arc deviation note above and "Current state"). Per the original roadmap: calories over time, leaning on React (already strong) plus one new backend aggregation concept.

- **Backend:** the date-*range* query now exists (`findByDateBetweenOrderByDateAscIdAsc`, `GET /api/meals?from=&to=`, added in the MVP hardening pass; `HistoryView` uses it). What v4 still needs is a `GROUP BY`/`SUM` aggregation query (calories per day across a range) — Spring Data derived-method naming won't express that on its own; expect to reach for `@Query` (JPQL) for the first time in this project, or a projection interface/DTO for the grouped result shape.
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

Backend — Maven wrapper, macOS (zsh), run from the repo root:

```
./mvnw spring-boot:run          # run the app (localhost:8080)
./mvnw test                     # run all tests
./mvnw test -Dtest=CalTrackerApplicationTests                # run a single test class
./mvnw test -Dtest=SomeTests#someMethod                      # run a single test method
./mvnw clean package            # build the jar
```

Configuration comes from a gitignored `.env` at the repo root (copy `.env.example`): `DB_PASSWORD`, `FATSECRET_CLIENT_ID`, `FATSECRET_CLIENT_SECRET`, optional `SHOW_SQL`. Nothing needs exporting in the shell any more. `./mvnw test` needs the `caltracker_test` database (`createdb -O caltracker_app caltracker_test`); Flyway builds its tables.

Frontend — from `frontend/`:

```
npm install                     # first-time setup / after pulling new deps
npm run dev                     # run the app (localhost:5173)
```

Database — Postgres 16 via Homebrew (`postgresql@16`), run by launchd, not Docker:

```
brew services list                                   # is it running? `started` vs `none` — check this FIRST when the backend won't boot
brew services start postgresql@16                    # start now AND re-register auto-start on login
brew services stop postgresql@16                      # stops it AND deregisters auto-start (see gotcha below)
pg_isready -h localhost -p 5432                      # one-line liveness check
tail -f /opt/homebrew/var/log/postgresql@16.log      # server log
```

```
psql -U caltracker_app -h localhost -d caltracker    # connect as the app role (password in .env)
psql -d caltracker -c 'select version, description, success from flyway_schema_history'   # which migrations have run
psql -d postgres                                     # connect as superuser for admin tasks (creating roles/dbs)
```

**There is no `postgres` superuser role on this machine.** Homebrew initialises the cluster with a superuser named after the macOS user (`raink`), so `psql -U postgres` fails with `role "postgres" does not exist`. Omit `-U` and let it default to your own account. Data dir: `/opt/homebrew/var/postgresql@16`.

Java 26 (Homebrew OpenJDK; `openjdk@21` is also installed — see the `JAVA_HOME` note under v2), Spring Boot 4.1.0. Run backend + frontend + Postgres (started by launchd on login) for the app to work end-to-end. `frontend/` is a plain sibling folder to `pom.xml` inside this same repo — not wired into the Maven build (no `frontend-maven-plugin`), matching the roadmap's v3 plan to deploy backend and frontend separately (Render/Railway + Vercel) rather than bundle into one jar. Revisit this structure if that deploy plan changes.

## Design System

Always read DESIGN.md before making any visual or UI decisions. All font choices,
colors, spacing, aesthetic direction and motion rules are defined there. Do not
deviate without explicit user approval. In QA mode, flag any code that doesn't
match DESIGN.md.

The direction is **Oxide** (dark, jade accent, Familjen Grotesk), adopted
2026-09-07, replacing the "Organic" warm-paper system described under "Frontend
design" below. That section is kept for history; DESIGN.md supersedes it.
