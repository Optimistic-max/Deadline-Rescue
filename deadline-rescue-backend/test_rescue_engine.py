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


def test_explanation_says_everything_fits_only_when_nothing_unscheduled():
    tasks = [
        make_task("A", date(2026, 9, 3), 2, Priority.medium),
        make_task("B", date(2026, 9, 4), 2, Priority.medium),
    ]

    result = compute_rescue_plan(
        tasks=tasks, daily_available_hours=4, num_days=7,
        allow_overflow=False, today=TODAY,
    )

    assert result["unscheduled"] == []
    assert any("everything fits" in line for line in result["explanation"])


def test_explanation_does_not_claim_fits_when_deadline_window_too_tight():
    # Plenty of capacity in total (5h/day x 10 days = 50h for 13h of work),
    # but "Tight" can't fit 12h into the two days before its own deadline.
    # The explanation must not say "everything fits" here.
    tasks = [
        make_task("Tight", date(2026, 8, 30), 12, Priority.high),
        make_task("Later", date(2026, 9, 8), 1, Priority.low),
    ]

    result = compute_rescue_plan(
        tasks=tasks, daily_available_hours=5,
        allow_overflow=False, today=TODAY,
    )

    assert result["unscheduled"] != []
    assert not any("everything fits" in line for line in result["explanation"])
    assert any(
        "couldn't be fit before their deadlines" in line
        for line in result["explanation"]
    )


def test_explanation_ignores_completed_tasks_when_naming_first_task():
    completed = make_task("Completed", date(2026, 8, 30), 3, Priority.high, hours_completed=3)
    active = make_task("Active", date(2026, 9, 5), 2, Priority.low)

    result = compute_rescue_plan(
        tasks=[completed, active], daily_available_hours=4, num_days=7,
        allow_overflow=False, today=TODAY,
    )

    scheduled_first_lines = [
        line for line in result["explanation"] if "is scheduled first" in line
    ]
    assert len(scheduled_first_lines) == 1
    assert "Active" in scheduled_first_lines[0]
    assert "Completed" not in scheduled_first_lines[0]


def test_explanation_omits_first_task_line_when_all_tasks_complete():
    tasks = [
        make_task("Done", date(2026, 9, 1), 3, Priority.high, hours_completed=3),
    ]

    result = compute_rescue_plan(
        tasks=tasks, daily_available_hours=4, num_days=3,
        allow_overflow=False, today=TODAY,
    )

    assert not any("is scheduled first" in line for line in result["explanation"])


def test_explanation_describes_overdue_task_without_negative_days():
    tasks = [
        make_task("Late", date(2026, 8, 26), 4, Priority.high),  # 3 days before TODAY
    ]

    result = compute_rescue_plan(
        tasks=tasks, daily_available_hours=2,
        allow_overflow=False, today=TODAY,
    )

    first_task_line = next(
        line for line in result["explanation"] if "is scheduled first" in line
    )
    assert "already overdue" in first_task_line
    assert "-3" not in first_task_line


def test_scheduled_hours_are_rounded_for_display():
    tasks = [
        make_task("Fractional", date(2026, 8, 31), 1.0, Priority.medium),
    ]

    result = compute_rescue_plan(
        tasks=tasks, daily_available_hours=0.3, num_days=5,
        allow_overflow=False, today=TODAY,
    )

    assert result["unscheduled"][0]["hours_remaining"] == 0.1
    for day_items in result["schedule"].values():
        for item in day_items:
            assert item["hours"] == round(item["hours"], 2)