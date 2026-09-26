# Notes for judges — shared backend, no accounts

Please read this before testing the app. It explains one deliberate design limitation so that nothing you see looks like a bug.

## The backend is a single shared instance

Deadline Rescue's Expo app talks to one FastAPI backend deployed on Render:

```
https://deadline-rescue-pqo1.onrender.com
```

There is **no account system and no authentication**. Every copy of the app — yours, mine, and every other judge's — reads and writes the same task list.

**What this means in practice:**

- Tasks you add are visible to anyone else testing the app at the same time.
- Tasks added by someone else will appear in your list, including in the Rescue schedule.
- Deleting or completing a task affects everyone.
- The free-tier limit of 5 tasks counts *all* tasks in the shared database, not just yours. If the list already holds 5 tasks, you may hit the limit immediately — delete a few to make room, or use the Premium paywall path.

This is a **known and intentional limitation of this hackathon build, not an oversight.** Adding real multi-user support means user accounts, authentication, and per-user data scoping, which was out of scope for the time available. I chose to keep the shared backend and document it honestly rather than fake per-user isolation.

## Two related things worth knowing

**The backend sleeps.** It runs on Render's free tier, which spins the container down after a period of inactivity. The first request after that takes roughly **30 seconds** to respond, and the app will sit on "Loading tasks..." until it does. This is a cold start, not a hang — please give it a moment. Loading the URL above in a browser first will wake it up before you open the app.

**Task data is not durable.** The SQLite database file lives on Render's ephemeral container filesystem, so it is wiped by both a redeploy and the free tier's idle spin-down. You may well find the task list empty on first open. That is expected; just add a task or two to try the features. A hosted Postgres database would fix this and is the obvious next step, but it wasn't required to demonstrate the app.

## What to actually look at

The core feature is **Rescue** (third tab). Add two or three deadlines with tight due dates and more estimated hours than you have available per day, then tap "Rescue My Plan." The point of the app is that it tells you honestly when your workload does not fit, shows exactly which hours could not be scheduled before their deadlines, and explains its reasoning in plain language — rather than silently dropping the work.

Full setup instructions, architecture notes, and the complete list of known limitations are in [README.md](./README.md).
