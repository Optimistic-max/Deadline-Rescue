from fastapi import FastAPI
from pydantic import BaseModel
from datetime import date

from models import Priority, Task
from rescue_engine import compute_rescue_plan

app = FastAPI()

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

@app.patch("/tasks/{task_id}/complete")
def mark_task_complete(task_id: int):
    for task in tasks:
        if task.id == task_id:
            task.hours_completed = task.estimated_hours
            return task
    return {"error": "Task not found"}


class RescueRequest(BaseModel):
    daily_available_hours: float
    num_days: int | None = None
    allow_overflow: bool = False


@app.post("/rescue")
def rescue_plan(request: RescueRequest):
    return compute_rescue_plan(
        tasks=tasks,
        daily_available_hours=request.daily_available_hours,
        num_days=request.num_days,
        allow_overflow=request.allow_overflow,
        today=date.today(),
    )