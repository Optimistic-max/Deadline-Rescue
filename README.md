# Deadline Rescue

**A student deadline tracker that doesn't just list your assignments — it tells you when you're overloaded, explains why, and builds a realistic recovery plan.**

Built for [RevenueCat Shipaton 2026](https://www.shipaton.com/) — Next Gen Award track.

---

## The problem

Most task trackers show you a list. If you have more work than time, they let you find that out the hard way — by missing a deadline.

Deadline Rescue's core feature, **Rescue**, actively checks whether your workload fits in your available time. If it doesn't, it tells you honestly, shows exactly which tasks won't fit, explains its reasoning in plain language, and lets you choose how to handle it — instead of quietly dropping work or pretending everything's fine.

## How it works

1. **Add your deadlines** — title, course, due date (native date picker), estimated hours, and priority (low/medium/high).
2. **Set your available hours per day.** The planning window is calculated automatically from your furthest deadline — or override it with a quick preset (3 days / 1 week / 2 weeks).
3. **Tap "Rescue My Plan."** The app calculates an urgency score for every task and builds a day-by-day schedule, most urgent work first.
4. **See "Why this plan?"** — a plain-language explanation of your total workload, your capacity, and why each task was prioritized the way it was.
5. **If you're overloaded**, the app shows exactly what didn't fit and gives you three choices: allow the leftover work to spill past its deadline, ignore the warning, or increase your hours/window and try again.
6. **Mark tasks complete** as you finish them — completed tasks automatically drop out of future Rescue schedules.

The Home screen also surfaces a quick status summary — how many tasks are overdue or not-started-but-due-soon — with matching labels on each task card.

### The Rescue algorithm

Each task's urgency is calculated as:

```
urgency = (hours_remaining × priority_weight) / days_until_deadline
```

Tasks are sorted by urgency (most urgent first) and greedily assigned to the earliest available days before their own deadline. Overdue tasks are treated as maximally urgent rather than being silently misclassified as "due today." If a task's hours don't fit before its deadline, they're recorded as `unscheduled` rather than silently dropped — the app always tells you the truth about your workload.

This logic lives in `rescue_engine.py`, separate from the API layer, and is covered by a 9-test pytest suite (`test_rescue_engine.py`) testing priority ordering, overload detection, overflow behavior, overdue/due-today edge cases, and empty-task-list handling.

## Monetization

Deadline Rescue is free to use for basic task tracking (up to 5 tasks). The **Premium Planning** tier ($9.99/month, via RevenueCat) unlocks:

- The full Rescue engine and its plain-language explanations
- Unlimited tracked tasks
- Adjustable planning windows and overload handling

RevenueCat entitlement: `deadline_rescue_premium` · Product: `monthly` · Offering: `default`

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React Native (Expo, Expo Router) |
| Backend | Python, FastAPI |
| Database | SQLite via SQLAlchemy |
| Monetization | RevenueCat |
| Backend hosting | Render (free tier) |
| Testing | pytest |

**Architecture:** The Expo app talks to a FastAPI backend over HTTP for all task storage and the Rescue calculation. Tasks are persisted via SQLAlchemy to a local SQLite database. RevenueCat's SDK runs client-side in the app to manage the paywall and entitlement status.

## Features

- Full task CRUD (add, list, delete, mark complete) with a native date picker
- Rescue engine with honest overload detection, overflow handling, and plain-language explanations
- Home screen status summary and per-task overdue/due-soon labels
- Light and dark mode, toggleable from the Home screen
- Free-tier task limit with RevenueCat-gated Premium Planning
- Custom app icon, splash screen, and tab iconography

## Project structure

```
deadline-rescue-backend/
  main.py                 # FastAPI app, routes
  models.py                # Task and Priority data models
  database.py               # SQLAlchemy engine, session, TaskDB model
  rescue_engine.py           # The Rescue algorithm (testable, no FastAPI dependency)
  test_rescue_engine.py       # pytest suite for the Rescue engine
  requirements.txt

deadline-rescue-frontend/
  src/app/
    index.tsx     # Home screen (task list, status summary, theme toggle)
    explore.tsx   # Add Deadline form
    rescue.tsx    # Rescue screen + paywall
  src/hooks/
    use-premium-status.ts  # Checks RevenueCat entitlement status
    use-theme-mode.tsx      # Shared light/dark theme context
  src/constants/
    api.ts         # Backend API URL
```

## Running it locally

### Backend

```bash
cd deadline-rescue-backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Runs at `http://127.0.0.1:8000`. Interactive API docs at `/docs`. A local `deadline_rescue.db` SQLite file is created automatically on first run.

**Run the tests:**
```bash
pytest -v
```

### Frontend

```bash
cd deadline-rescue-frontend
npm install
npx expo start --dev-client
```

Requires an EAS development build (not Expo Go) since RevenueCat purchases don't run inside Expo Go. See [Expo's development build docs](https://docs.expo.dev/develop/development-builds/introduction/) for setup.

By default the app points at the live backend deployed on Render. To point it at your own local backend instead, edit `src/constants/api.ts`.

## Known limitations

- **Persistence on Render specifically doesn't survive redeploys** — SQLite's database file lives inside Render's container filesystem, which is rebuilt from scratch on each deploy. Data survives local development restarts and idle cold-starts, but not a fresh deploy. A hosted database (e.g. Render's Postgres) would resolve this; not implemented here since it isn't required for this build.
- **No way to log partial progress** — a task is either not started or fully complete; there's no in-between hours-logged state exposed in the UI (the backend model supports it via `hours_completed`).
- No account system — all data is shared across anyone using the same backend instance.

## License

MIT — see [LICENSE](./LICENSE).
