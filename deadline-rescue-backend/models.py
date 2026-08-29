from pydantic import BaseModel
from datetime import date
from enum import Enum


class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Task(BaseModel):
    id: int = 0
    title: str
    course: str
    deadline: date
    estimated_hours: float
    hours_completed: float = 0
    priority: Priority