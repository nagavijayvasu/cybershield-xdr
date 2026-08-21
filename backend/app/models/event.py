from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("hosts.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    event_type = Column(String, index=True, nullable=False)  # process_creation, failed_login, etc.
    source_ip = Column(String, index=True, nullable=True)
    destination_ip = Column(String, index=True, nullable=True)
    source_port = Column(Integer, nullable=True)
    destination_port = Column(Integer, nullable=True)
    username = Column(String, index=True, nullable=True)
    process_name = Column(String, index=True, nullable=True)
    command_line = Column(String, nullable=True)
    event_data = Column(JSON, default=dict, nullable=False)  # Flex JSON block for extra telemetry
    severity = Column(String, default="INFO", nullable=False) # INFO, LOW, MEDIUM, HIGH, CRITICAL
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    host = relationship("Host", back_populates="events")

    def __repr__(self):
        return f"<Event {self.event_type} on Host {self.host_id} (Severity: {self.severity})>"
