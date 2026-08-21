import sys
import os
import time
import socket
import platform
import json
import urllib.request
import argparse
from datetime import datetime, timezone

def get_host_details():
    """Gathers local host metadata."""
    hostname = socket.gethostname()
    try:
        ip_address = socket.gethostbyname(hostname)
    except Exception:
        ip_address = "127.0.0.1"

    os_type = f"{platform.system()} {platform.release()}"
    return {
        "hostname": hostname,
        "ip_address": ip_address,
        "operating_system": os_type,
        "agent_version": "1.0.0"
    }

def send_event(server_url, event_data):
    """Sends telemetry payload to the API server via urllib."""
    url = f"{server_url.rstrip('/')}/api/events/"
    payload = json.dumps(event_data).encode("utf-8")
    
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 201:
                return True, json.loads(response.read().decode("utf-8"))
            else:
                return False, f"Server returned status {response.status}"
    except Exception as e:
        return False, str(e)

def simulate_brute_force(server_url, host_meta):
    """Simulates 5 failed logins within 1 second to trigger Brute Force alerts."""
    print("[*] Simulating Brute Force Attack (5 failed login attempts)...")
    attacker_ip = "10.0.0.88"
    
    for i in range(5):
        event = {
            **host_meta,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "failed_login",
            "source_ip": attacker_ip,
            "username": "administrator"
        }
        success, res = send_event(server_url, event)
        if success:
            print(f"  [+] Ingested failed login attempt {i+1}/5 from {attacker_ip}")
        else:
            print(f"  [-] Failed to send event: {res}")
        time.sleep(0.1)
    print("[+] Brute force simulation complete.")

def simulate_port_scan(server_url, host_meta):
    """Simulates a port scan connecting to 10 distinct ports to trigger Discovery alerts."""
    print("[*] Simulating Port Scan (Network Discovery)...")
    scanner_ip = "10.0.0.99"
    
    for port in range(80, 90):
        event = {
            **host_meta,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "network_connection",
            "source_ip": scanner_ip,
            "destination_port": port
        }
        success, res = send_event(server_url, event)
        if success:
            print(f"  [+] Ingested connection to port {port} from {scanner_ip}")
        else:
            print(f"  [-] Failed to send event: {res}")
        time.sleep(0.1)
    print("[+] Port scan simulation complete.")

def simulate_malware(server_url, host_meta):
    """Simulates process execution of credentials dumping tool (mimikatz)."""
    print("[*] Simulating Suspected Malware Execution...")
    event = {
        **host_meta,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "process_creation",
        "process_name": "mimikatz.exe",
        "command_line": "mimikatz.exe privilege::debug sekurlsa::logonpasswords exit"
    }
    success, res = send_event(server_url, event)
    if success:
        print("[+] Ingested suspicious process execution (mimikatz.exe)")
    else:
        print(f"[-] Failed to send event: {res}")

def simulate_threat_intel(server_url, host_meta, bad_ip):
    """Simulates host connecting to a blacklisted IP address."""
    print(f"[*] Simulating Command & Control connection to Blacklisted IP: {bad_ip}...")
    event = {
        **host_meta,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "network_connection",
        "source_ip": bad_ip,
        "destination_port": 443
    }
    success, res = send_event(server_url, event)
    if success:
        print(f"[+] Ingested telemetry connecting to blacklisted IP {bad_ip}")
    else:
        print(f"[-] Failed to send event: {res}")

def main():
    parser = argparse.ArgumentParser(description="CyberShield XDR Endpoint Agent Simulator")
    parser.add_argument("--server", default="http://127.0.0.1:8000", help="FastAPI Server base URL")
    parser.add_argument("--interval", type=int, default=10, help="Heartbeat telemetry interval in seconds")
    parser.add_argument(
        "--simulate", 
        choices=["brute-force", "port-scan", "malware", "threat-intel"], 
        help="Simulate a specific security attack and exit"
    )
    parser.add_argument("--target-ip", default="185.220.101.5", help="Target blacklisted IP for threat-intel simulation")
    
    args = parser.parse_args()
    host_meta = get_host_details()
    
    print("="*60)
    print("            CYBERSHIELD XDR ENDPOINT AGENT SENSOR")
    print("="*60)
    print(f"Hostname:         {host_meta['hostname']}")
    print(f"IP Address:       {host_meta['ip_address']}")
    print(f"Operating System: {host_meta['operating_system']}")
    print(f"Server Target:    {args.server}")
    print("="*60)

    # Attack simulation execution paths
    if args.simulate:
        if args.simulate == "brute-force":
            simulate_brute_force(args.server, host_meta)
        elif args.simulate == "port-scan":
            simulate_port_scan(args.server, host_meta)
        elif args.simulate == "malware":
            simulate_malware(args.server, host_meta)
        elif args.simulate == "threat-intel":
            simulate_threat_intel(args.server, host_meta, args.target_ip)
        sys.exit(0)

    # Continuous telemetry collection heartbeat loop
    print(f"[*] Ingesting background telemetry heartbeats every {args.interval}s. Press Ctrl+C to stop...")
    bg_processes = ["explorer.exe", "svchost.exe", "chrome.exe", "taskhostw.exe", "spoolsv.exe"]
    counter = 0
    
    try:
        while True:
            # Simulate a normal background process launch or network poll
            proc = bg_processes[counter % len(bg_processes)]
            event = {
                **host_meta,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_type": "process_creation" if counter % 2 == 0 else "network_connection",
                "process_name": proc if counter % 2 == 0 else None,
                "destination_port": None if counter % 2 == 0 else 443,
                "source_ip": None if counter % 2 == 0 else "127.0.0.1"
            }
            
            success, res = send_event(args.server, event)
            if success:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Heartbeat sent. State: online (Event ID: {res['id']})")
            else:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Heartbeat failed: {res}")
                
            counter += 1
            time.sleep(args.interval)
            
    except KeyboardInterrupt:
        print("\n[*] Agent sensor terminated by user. Exiting.")

if __name__ == "__main__":
    main()
