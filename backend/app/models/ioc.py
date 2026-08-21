from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Ioc(Base):
    __tablename__ = "iocs"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, index=True, nullable=False)  # IP, DOMAIN, URL, HASH, EMAIL
    value = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    severity = Column(String, default="HIGH", nullable=False)  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<IOC type={self.type} value={self.value}>"
