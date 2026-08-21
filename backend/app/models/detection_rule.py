from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class DetectionRule(Base):
    __tablename__ = "detection_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=False)
    event_type = Column(String, index=True, nullable=False)
    threshold = Column(Integer, default=1, nullable=False)
    time_window = Column(Integer, default=300, nullable=False)  # Window in seconds
    severity = Column(String, default="LOW", nullable=False)  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    mitre_technique = Column(String, nullable=True)  # MITRE technique ID, e.g., T1110
    enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    alerts = relationship("Alert", back_populates="rule")

    def __repr__(self):
        return f"<DetectionRule {self.name} (Enabled: {self.enabled})>"
