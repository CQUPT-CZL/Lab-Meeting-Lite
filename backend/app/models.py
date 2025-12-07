from pydantic import BaseModel
from typing import List, Optional

class Member(BaseModel):
    id: str
    name: str
    group: str = "A"  # 默认为 A 组

class MeetingData(BaseModel):
    members: List[Member]
    meetingDate: Optional[str] = None