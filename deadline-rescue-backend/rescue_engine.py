from datetime import date
from models import Task

PRIORITY_WEIGHT = {"low": 1, "medium": 2, "high": 3}


def urgency_score(task: Task, today: date) -> float:
    days_left = (task.deadline - today).days
    days_left = max(days_left, 0.5)

    hours_remaining = max(task.estimated_hours - task.hours_completed, 0)
    weight = PRIORITY_WEIGHT[task.priority.lower()]

    return (hours_remaining * weight) / days_left


def compute_rescue_plan(
    tasks: list[Task],
    daily_available_hours: float,
    num_days: int,
    allow_overflow: bool,
    today: date,
) -> dict:
    sorted_tasks = sorted(tasks, key=lambda t: urgency_score(t, today), reverse=True)

    schedule = {i: [] for i in range(num_days)}
    hours_left_today = [daily_available_hours] * num_days
    unscheduled = []

    for task in sorted_tasks:
        hours_needed = max(task.estimated_hours - task.hours_completed, 0)
        days_until_deadline = min((task.deadline - today).days, num_days)

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

    return {"schedule": schedule, "unscheduled": unscheduled}