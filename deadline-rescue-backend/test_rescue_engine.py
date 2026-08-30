from datetime import date
from models import Task, Priority
from rescue_engine import urgency_score, compute_rescue_plan

TODAY = date(2026, 8, 29)


def make_task(title, deadline, hours, priority, hours_completed=0):
    return Task(
        title=title,
        course="Test Course",
        deadline=deadline,
        estimated_hours=hours,
        hours_completed=hours_completed,
        priority=priority,
    )


def test_urgency_score_higher_priority_scores_higher():
    low_task = make_task("Low", date(2026, 9, 1), 3, Priority.low)
    high_task = make_task("High", date(2026, 9, 1), 3, Priority.high)

    assert urgency_score(high_task, TODAY) > urgency_score(low_task, TODAY)


def test_urgency_score_closer_deadline_scores_higher():
    far_task = make_task("Far", date(2026, 9, 10), 3, Priority.medium)
    near_task = make_task("Near", date(2026, 8, 31), 3, Priority.medium)

    assert urgency_score(near_task, TODAY) > urgency_score(far_task, TODAY)


def test_all_tasks_fit_get_scheduled():
    tasks = [
        make_task("A", date(2026, 9, 3), 2, Priority.medium),
        make_task("B", date(2026, 9, 4), 2, Priority.medium),
    ]

    result = compute_rescue_plan(
        tasks=tasks,
        daily_available_hours=4,
        num_days=7,
        allow_overflow=False,
        today=TODAY,
    )

    assert result["unscheduled"] == []


def test_overloaded_tasks_produce_unscheduled():
    tasks = [
        make_task("Huge", date(2026, 8, 30), 10, Priority.high),
    ]

    result = compute_rescue_plan(
        tasks=tasks,
        daily_available_hours=2,
        num_days=7,
        allow_overflow=False,
        today=TODAY,
    )

    assert len(result["unscheduled"]) == 1
    assert result["unscheduled"][0]["task"] == "Huge"
    assert result["unscheduled"][0]["hours_remaining"] > 0


def test_overflow_allows_scheduling_past_deadline():
    tasks = [
        make_task("Big", date(2026, 8, 30), 10, Priority.high),
    ]

    result_no_overflow = compute_rescue_plan(
        tasks=tasks, daily_available_hours=2, num_days=7,
        allow_overflow=False, today=TODAY,
    )
    result_with_overflow = compute_rescue_plan(
        tasks=tasks, daily_available_hours=2, num_days=7,
        allow_overflow=True, today=TODAY,
    )

    no_overflow_remaining = result_no_overflow["unscheduled"][0]["hours_remaining"]
    with_overflow_remaining = (
        result_with_overflow["unscheduled"][0]["hours_remaining"]
        if result_with_overflow["unscheduled"] else 0
    )

    assert with_overflow_remaining < no_overflow_remaining


def test_high_priority_scheduled_before_low_priority_on_same_day():
    tasks = [
        make_task("LowPriority", date(2026, 9, 5), 2, Priority.low),
        make_task("HighPriority", date(2026, 9, 5), 2, Priority.high),
    ]

    result = compute_rescue_plan(
        tasks=tasks, daily_available_hours=2, num_days=7,
        allow_overflow=False, today=TODAY,
    )

    day_0_tasks = [item["task"] for item in result["schedule"][0]]
    assert "HighPriority" in day_0_tasks
    assert "LowPriority" not in day_0_tasks


def test_empty_task_list_returns_empty_schedule():
    result = compute_rescue_plan(
        tasks=[], daily_available_hours=2, num_days=7,
        allow_overflow=False, today=TODAY,
    )

    assert result["unscheduled"] == []
    assert all(day == [] for day in result["schedule"].values())

def test_overdue_task_scores_more_urgent_than_due_today():
    overdue_task = make_task("Overdue", date(2026, 8, 27), 2, Priority.medium)  # 2 days before TODAY
    due_today_task = make_task("DueToday", date(2026, 8, 29), 2, Priority.medium)  # same day as TODAY

    assert urgency_score(overdue_task, TODAY) > urgency_score(due_today_task, TODAY)

def test_task_due_today_gets_scheduled():
    task_due_today = make_task("DueToday", TODAY, 2, Priority.medium)

    result = compute_rescue_plan(
        tasks=[task_due_today],
        daily_available_hours=4,
        num_days=7,
        allow_overflow=False,
        today=TODAY,
    )

    assert result["unscheduled"] == []
    assert any(
        item["task"] == "DueToday"
        for day_items in result["schedule"].values()
        for item in day_items
    )