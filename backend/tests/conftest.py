import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.database_seeder import seed_detection_rules

# Create an in-memory SQLite engine for tests
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(name="session")
def session_fixture():
    # Setup tables before test
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Seed rules for test stability
    seed_detection_rules(db)
    try:
        yield db
    finally:
        db.close()
        # Clean up tables after test
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(name="client")
def client_fixture(session):
    def override_get_db():
        try:
            yield session
        finally:
            pass

    # Override get_db dependency
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    # Tear down dependency override
    del app.dependency_overrides[get_db]
