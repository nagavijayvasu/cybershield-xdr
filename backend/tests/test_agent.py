import sys
import os
import json
from unittest.mock import patch, MagicMock

# Import the agent module by adding its path to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../agent')))
import agent

def test_agent_get_host_details():
    details = agent.get_host_details()
    assert "hostname" in details
    assert "ip_address" in details
    assert "operating_system" in details
    assert details["agent_version"] == "1.0.0"

@patch("urllib.request.urlopen")
def test_agent_send_event_success(mock_urlopen):
    # Set up mock response
    mock_resp = MagicMock()
    mock_resp.status = 201
    mock_resp.read.return_value = b'{"status": "healthy", "id": 42}'
    mock_urlopen.return_value.__enter__.return_value = mock_resp

    success, res = agent.send_event("http://localhost:8000", {"test": "data"})
    assert success is True
    assert res["id"] == 42
    
    # Check that urllib was called with JSON header
    args, kwargs = mock_urlopen.call_args
    req = args[0]
    assert req.full_url == "http://localhost:8000/api/events/"
    assert req.headers["Content-type"] == "application/json"

@patch("urllib.request.urlopen")
def test_agent_send_event_failure(mock_urlopen):
    mock_urlopen.side_effect = Exception("Connection Refused")
    success, res = agent.send_event("http://localhost:8000", {"test": "data"})
    assert success is False
    assert "Connection Refused" in res
