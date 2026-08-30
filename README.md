# Deadline Rescue

**A student deadline tracker that doesn't just list your assignments — it tells you when you're overloaded and builds a realistic recovery plan.**

Built for [RevenueCat Shipaton 2026](https://www.shipaton.com/) — Next Gen Award track.

---

## The problem

Most task trackers show you a list. If you have more work than time, they let you find that out the hard way — by missing a deadline.

Deadline Rescue's core feature, **Rescue**, actively checks whether your workload fits in your available time. If it doesn't, it tells you honestly, shows exactly which tasks won't fit, and lets you choose how to handle it — instead of quietly dropping work or pretending everything's fine.

## How it works

1. **Add your deadlines** — title, course, due date, estimated hours, and priority (low/medium/high).
2. **Set your available hours per day** and how many days ahead you want to plan.
3. **Tap "Rescue My Plan."** The app calculates an urgency score for every task and builds a day-by-day schedule, most urgent work first.
4. **If you're overloaded**, the app shows exactly what didn't fit and gives you three choices:
   - Allow the leftover work to spill past its deadline
   - Ignore the warning and keep the current plan
   - Increase your available hours or planning window and try again

### The Rescue algorithm

Each task's urgency is calculated as:

```
urgency = (hours_remaining × priority_weight) / days_until_deadline
```

Tasks are sorted by urgency (most urgent first) and greedily assigned to the earliest available days before their own deadline. If a task's hours don't fit before its deadline, they're recorded as `unscheduled` rather than silently dropped — the app always tells you the truth about your workload.

This logic lives in `rescue_engine.py`, separate from the API layer, and is covered by a pytest suite (`test_rescue_engine.py`) testing priority ordering, overload detection, overflow behavior, and edge cases like an empty task list.

## Monetization

Deadline Rescue is free to use for basic task tracking (up to 5 tasks). The **Premium Planning** tier ($9.99/month, via RevenueCat) unlocks:

- The full Rescue engine
- Unlimited tracked tasks
- Adjustable planning windows and overload handling

RevenueCat entitlement: `deadline_rescue_premium` · Product: `monthly` · Offering: `default`

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React Native (Expo, Expo Router) |
| Backend | Python, FastAPI |
| Monetization | RevenueCat |
| Backend hosting | Render (free tier) |
| Testing | pytest |

**Architecture:** The Expo app talks to a FastAPI backend over HTTP for all task storage and the Rescue calculation. RevenueCat's SDK runs client-side in the app to manage the paywall and entitlement status.

## Project structure

```
deadline-rescue-backend/
  main.py              # FastAPI app, routes
  models.py             # Task and Priority data models
  rescue_engine.py       # The Rescue algorithm (testable, no FastAPI dependency)
  test_rescue_engine.py  # pytest suite for the Rescue engine
  requirements.txt

deadline-rescue-frontend/
  src/app/
    index.tsx     # Home screen (task list)
    explore.tsx   # Add Deadline form
    rescue.tsx    # Rescue screen + paywall
  src/hooks/
    use-premium-status.ts  # Checks RevenueCat entitlement status
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

Runs at `http://127.0.0.1:8000`. Interactive API docs at `/docs`.

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

- **No database yet** — tasks are stored in memory on the backend and are cleared on server restart. Fine for a demo session; not yet suitable for long-term persistent use.
- **Manual estimated-hours entry** — no way to log partial progress on a task from the app yet (the backend model supports it; the UI doesn't expose it).
- No account system — all data is shared across anyone using the same backend instance.

## License

MIT — see [LICENSE](./LICENSE).
