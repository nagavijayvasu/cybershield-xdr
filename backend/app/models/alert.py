from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    rule_id = Column(Integer, ForeignKey("detection_rules.id", ondelete="SET NULL"), nullable=True)
    host_id = Column(Integer, ForeignKey("hosts.id", ondelete="CASCADE"), nullable=False)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    ioc_id = Column(Integer, ForeignKey("iocs.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    severity = Column(String, default="LOW", nullable=False)  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    source_ip = Column(String, index=True, nullable=True)
    status = Column(String, default="NEW", nullable=False)  # NEW, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    confidence = Column(Integer, default=50, nullable=False)  # 0 to 100
    mitre_tactic = Column(String, nullable=True)
    mitre_technique = Column(String, nullable=True)  # Store technique ID e.g., T1110
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    event = relationship("Event")
    rule = relationship("DetectionRule", back_populates="alerts")
    host = relationship("Host")
    incident = relationship("Incident", back_populates="alerts")
    ioc = relationship("Ioc")

    def __repr__(self):
        return f"<Alert {self.title} on Host {self.host_id} (Status: {self.status})>"
