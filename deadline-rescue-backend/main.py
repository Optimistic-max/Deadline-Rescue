from fastapi import FastAPI
from pydantic import BaseModel
from datetime import date
from enum import Enum

app = FastAPI()

class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

# This defines what a "Task" looks like - its shape/fields
class Task(BaseModel):
    id: int = 0 # default value makes it optional; backend will overwrite it anyway
    title: str
    course: str
    deadline: date
    estimated_hours: float
    hours_completed: float = 0
    priority: Priority  # was: str 

# In-memory storage - just a Python list living in memory.
# Resets every time you restart the server. Fine for now.
tasks: list[Task] = []
next_id = 1

@app.get("/")
def read_root():
    return {"status": "ok"}

@app.get("/tasks")
def get_tasks():
    return tasks

@app.post("/tasks")
def add_task(task: Task):
    global next_id
    task.id = next_id
    next_id += 1
    tasks.append(task)
    return task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    global tasks
    tasks = [t for t in tasks if t.id != task_id]
    return {"deleted": task_id}

PRIORITY_WEIGHT = {"low": 1, "medium": 2, "high": 3}

def urgency_score(task: Task) -> float:
    days_left = (task.deadline - date.today()).days
    days_left = max(days_left, 0.5)  # avoid divide-by-zero if due today

    hours_remaining = max(task.estimated_hours - task.hours_completed, 0)
    weight = PRIORITY_WEIGHT[task.priority.lower()]  # added .lower()

    return (hours_remaining * weight) / days_left


class RescueRequest(BaseModel):
    daily_available_hours: float
    num_days: int = 7
    allow_overflow: bool = False


@app.post("/rescue")
def rescue_plan(request: RescueRequest):
    sorted_tasks = sorted(tasks, key=urgency_score, reverse=True)

    schedule = {i: [] for i in range(request.num_days)}
    hours_left_today = [request.daily_available_hours] * request.num_days
    unscheduled = []

    for task in sorted_tasks:
        hours_needed = max(task.estimated_hours - task.hours_completed, 0)
        days_until_deadline = min((task.deadline - date.today()).days, request.num_days)

        # Phase 1: try to fit within the task's own deadline
        for day in range(days_until_deadline):
            if hours_needed <= 0:
                break
            allocate = min(hours_left_today[day], hours_needed)
            if allocate > 0:
                schedule[day].append({"task": task.title, "hours": allocate})
                hours_left_today[day] -= allocate
                hours_needed -= allocate

        # Phase 2: if overflow is allowed, keep placing leftover hours in later days
        if hours_needed > 0 and request.allow_overflow:
            for day in range(days_until_deadline, request.num_days):
                if hours_needed <= 0:
                    break
                allocate = min(hours_left_today[day], hours_needed)
                if allocate > 0:
                    schedule[day].append({"task": task.title, "hours": allocate})
                    hours_left_today[day] -= allocate
                    hours_needed -= allocate

        # Anything still left over is genuinely unscheduled
        if hours_needed > 0:
            unscheduled.append({"task": task.title, "hours_remaining": hours_needed})

    return {"schedule": schedule, "unscheduled": unscheduled}