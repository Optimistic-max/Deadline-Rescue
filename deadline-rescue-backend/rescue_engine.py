from datetime import date
from models import Task

PRIORITY_WEIGHT = {"low": 1, "medium": 2, "high": 3}


def urgency_score(task: Task, today: date) -> float:
    days_left = (task.deadline - today).days

    if days_left < 0:
        days_left = 0.1  # overdue — treat as extremely urgent, not average
    elif days_left == 0:
        days_left = 0.5  # due today — avoid divide-by-zero

    hours_remaining = max(task.estimated_hours - task.hours_completed, 0)
    weight = PRIORITY_WEIGHT[task.priority.lower()]

    return (hours_remaining * weight) / days_left

def compute_rescue_plan(
    tasks: list[Task],
    daily_available_hours: float,
    allow_overflow: bool,
    today: date,
    num_days: int | None = None,
) -> dict:
    if num_days is None:
        if tasks:
            furthest_deadline = max((t.deadline - today).days for t in tasks)
            num_days = max(furthest_deadline, 1)
        else:
            num_days = 7

        if allow_overflow:
            num_days += 7  # extra buffer days for overflow to have somewhere to go

    sorted_tasks = sorted(tasks, key=lambda t: urgency_score(t, today), reverse=True)

    schedule = {i: [] for i in range(num_days)}
    hours_left_today = [daily_available_hours] * num_days
    unscheduled = []

    for task in sorted_tasks:
        hours_needed = max(task.estimated_hours - task.hours_completed, 0)
        raw_days_left = (task.deadline - today).days
        if raw_days_left < 0:
            usable_days = 1  # overdue — today is the only chance to catch up
        else:
            usable_days = raw_days_left + 1  # inclusive: day 0 through the deadline day
        days_until_deadline = min(usable_days, num_days)

        for day in range(days_until_deadline):
            if hours_needed <= 0:
                break
            allocate = min(hours_left_today[day], hours_needed)
            if allocate > 0:
                schedule[day].append({"task": task.title, "hours": allocate})
                hours_left_today[day] -= allocate
                hours_needed -= allocate

        if hours_needed > 0 and allow_overflow:
            for day in range(days_until_deadline, num_days):
                if hours_needed <= 0:
                    break
                allocate = min(hours_left_today[day], hours_needed)
                if allocate > 0:
                    schedule[day].append({"task": task.title, "hours": allocate})
                    hours_left_today[day] -= allocate
                    hours_needed -= allocate

        if hours_needed > 0:
            unscheduled.append({"task": task.title, "hours_remaining": hours_needed})
    explanation = build_explanation(
        tasks, schedule, unscheduled, daily_available_hours, num_days, today
    )

    return {"schedule": schedule, "unscheduled": unscheduled, "explanation": explanation}

def build_explanation(
    tasks: list[Task],
    schedule: dict,
    unscheduled: list[dict],
    daily_available_hours: float,
    num_days: int,
    today: date,
) -> list[str]:
    lines = []

    total_hours_needed = sum(
        max(t.estimated_hours - t.hours_completed, 0) for t in tasks
    )
    total_capacity = daily_available_hours * num_days

    if total_hours_needed <= total_capacity:
        lines.append(
            f"You have {total_hours_needed:.1f} hours of work and "
            f"{total_capacity:.1f} hours available — everything fits."
        )
    else:
        shortfall = total_hours_needed - total_capacity
        lines.append(
            f"You have {total_hours_needed:.1f} hours of work but only "
            f"{total_capacity:.1f} hours available over the next {num_days} days — "
            f"you're short by {shortfall:.1f} hours."
        )

    overdue_tasks = [t for t in tasks if (t.deadline - today).days < 0]
    if overdue_tasks:
        names = ", ".join(t.title for t in overdue_tasks)
        lines.append(f"{names} {'is' if len(overdue_tasks) == 1 else 'are'} already overdue and scheduled first.")

    sorted_tasks = sorted(tasks, key=lambda t: urgency_score(t, today), reverse=True)
    if sorted_tasks:
        top_task = sorted_tasks[0]
        days_left = (top_task.deadline - today).days
        day_word = "day" if days_left == 1 else "days"
        lines.append(
            f"\"{top_task.title}\" is scheduled first — it has the highest urgency "
            f"score based on its {top_task.priority.value} priority and {days_left} {day_word} remaining."
        )

    if unscheduled:
        total_unscheduled = sum(item["hours_remaining"] for item in unscheduled)
        lines.append(
            f"{total_unscheduled:.1f} hours of work couldn't be scheduled in time. "
            f"Consider allowing overflow, increasing your available hours, or reducing scope."
        )

    return lines