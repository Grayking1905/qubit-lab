from datetime import datetime

from pydantic import BaseModel


class BadgeOut(BaseModel):
    id: str
    name: str
    description: str
    icon: str

    model_config = {"from_attributes": True}


class UserBadgeOut(BaseModel):
    badge: BadgeOut
    unlockedAt: datetime
