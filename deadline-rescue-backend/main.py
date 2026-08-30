from fastapi import FastAPI, Depends
from pydantic import BaseModel
from datetime import date
from sqlalchemy.orm import Session

from models import Priority, Task
from rescue_engine import compute_rescue_plan
from database import TaskDB, init_db, get_db

app = FastAPI()

init_db()  # creates the tasks table if it doesn't already exist


def db_task_to_pydantic(db_task: TaskDB) -> Task:
    return Task(
        id=db_task.id,
        title=db_task.title,
        course=db_task.course,
        deadline=db_task.deadline,
        estimated_hours=db_task.estimated_hours,
        hours_completed=db_task.hours_completed,
        priority=db_task.priority,
    )


@app.get("/")
def read_root():
    return {"status": "ok"}


@app.get("/tasks")
def get_tasks(db: Session = Depends(get_db)):
    db_tasks = db.query(TaskDB).all()
    return [db_task_to_pydantic(t) for t in db_tasks]


@app.post("/tasks")
def add_task(task: Task, db: Session = Depends(get_db)):
    db_task = TaskDB(
        title=task.title,
        course=task.course,
        deadline=task.deadline,
        estimated_hours=task.estimated_hours,
        hours_completed=task.hours_completed,
        priority=task.priority.value,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task_to_pydantic(db_task)


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if db_task:
        db.delete(db_task)
        db.commit()
    return {"deleted": task_id}


@app.patch("/tasks/{task_id}/complete")
def mark_task_complete(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if db_task:
        db_task.hours_completed = db_task.estimated_hours
        db.commit()
        db.refresh(db_task)
        return db_task_to_pydantic(db_task)
    return {"error": "Task not found"}


@app.get("/tasks/status")
def get_task_status(db: Session = Depends(get_db)):
    today = date.today()
    overdue = []
    not_started = []

    db_tasks = db.query(TaskDB).all()
    for task in db_tasks:
        if task.hours_completed >= task.estimated_hours:
            continue

        days_left = (task.deadline - today).days
        if days_left < 0:
            overdue.append(task.title)
        if task.hours_completed == 0 and days_left <= 2:
            not_started.append(task.title)

    return {"overdue": overdue, "not_started": not_started}


class RescueRequest(BaseModel):
    daily_available_hours: float
    num_days: int | None = None
    allow_overflow: bool = False


@app.post("/rescue")
def rescue_plan(request: RescueRequest, db: Session = Depends(get_db)):
    db_tasks = db.query(TaskDB).all()
    tasks = [db_task_to_pydantic(t) for t in db_tasks]

    return compute_rescue_plan(
        tasks=tasks,
        daily_available_hours=request.daily_available_hours,
        num_days=request.num_days,
        allow_overflow=request.allow_overflow,
        today=date.today(),
    )