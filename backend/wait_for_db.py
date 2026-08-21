import socket
import time
import sys

def wait_for_port(host, port, timeout_sec=30):
    start_time = time.time()
    print(f"[*] Checking database connection at {host}:{port}...")
    while time.time() - start_time < timeout_sec:
        try:
            with socket.create_connection((host, port), timeout=1):
                print(f"[+] Database port {host}:{port} is open and accepting requests!")
                return True
        except (socket.timeout, ConnectionRefusedError):
            time.sleep(1)
    print(f"[-] Connection check timed out waiting for {host}:{port}!")
    return False

if __name__ == "__main__":
    # Check postgres container port 5432
    success = wait_for_port("postgres", 5432)
    if not success:
        sys.exit(1)
