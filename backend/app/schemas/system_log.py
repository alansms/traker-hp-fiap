from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.system_log import LogLevel, LogCategory

class LogBase(BaseModel):
    level: LogLevel
    category: LogCategory
    action: str
    description: str
    ip_address: Optional[str] = None
    user_id: Optional[int] = None

class LogCreate(LogBase):
    pass

class LogResponse(LogBase):
    id: int
    timestamp: datetime
    user_email: Optional[str] = None

    class Config:
        orm_mode = True

class LogFilter(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    level: Optional[LogLevel] = None
    category: Optional[LogCategory] = None
    user_id: Optional[int] = None
    search_term: Optional[str] = None

class LogsPagination(BaseModel):
    items: List[LogResponse]
    total: int
    page: int
    size: int
    pages: int
