from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    severity = Column(String, default="LOW", nullable=False)  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String, default="Open", nullable=False)  # Open, Investigating, Contained, Resolved, Closed
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    assignee = relationship("User")
    alerts = relationship("Alert", back_populates="incident")

    def __repr__(self):
        return f"<Incident {self.title} (Status: {self.status})>"
