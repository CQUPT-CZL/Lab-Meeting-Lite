from pydantic import BaseModel
from typing import List, Optional

class Member(BaseModel):
    id: str
    name: str

class MeetingData(BaseModel):
    members: List[Member]
    meetingDate: Optional[str] = None