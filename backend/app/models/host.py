from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Host(Base):
    __tablename__ = "hosts"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, unique=True, index=True, nullable=False)
    ip_address = Column(String, index=True, nullable=False)
    operating_system = Column(String, nullable=True)
    agent_version = Column(String, nullable=True)
    status = Column(String, default="online", nullable=False)  # online, offline, isolated
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    events = relationship("Event", back_populates="host", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Host {self.hostname} (Status: {self.status})>"
