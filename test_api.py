import requests
import time

print("Testing RUS...")
start = time.time()
try:
    rA = requests.get("http://127.0.0.1:8001/api/telemetry/fastest?year=2026&round=1&session_type=R&driver=RUS", timeout=60)
    print("RUS Status Code:", rA.status_code, "Time:", time.time() - start)
except Exception as e:
    print("RUS Exception:", e)

print("Testing ANT...")
start = time.time()
try:
    rB = requests.get("http://127.0.0.1:8001/api/telemetry/fastest?year=2026&round=1&session_type=R&driver=ANT", timeout=60)
    print("ANT Status Code:", rB.status_code, "Time:", time.time() - start)
except Exception as e:
    print("ANT Exception:", e)
