import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import fastf1
import pandas as pd
import numpy as np

app = FastAPI(title="F1 Pitwall API", version="1.0")

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup FastF1 Cache
CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "cache"))
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

@app.get("/")
def root():
    return {"message": "F1 Pitwall API is running", "version": "1.0"}


@app.get("/api/races")
def get_races(year: int = 2026):
    """Get the event schedule for a given year."""
    try:
        schedule = fastf1.get_event_schedule(year)
        # Filter out pre-season testing and unknown events if necessary
        schedule = schedule[schedule['EventFormat'] != 'testing']
        races = []
        for idx, event in schedule.iterrows():
            races.append({
                "round": event["RoundNumber"],
                "country": event["Country"],
                "location": event["Location"],
                "name": event["EventName"],
                "date": str(event["EventDate"].date()) if pd.notnull(event["EventDate"]) else None,
            })
        return {"year": year, "races": races}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from fastapi import BackgroundTasks

@app.get("/api/drivers")
def get_drivers(year: int, round: int, session_type: str, background_tasks: BackgroundTasks):
    """Get the drivers that participated in a specific session, and pre-warm telemetry cache."""
    try:
        session = fastf1.get_session(year, round, session_type)
        session.load(telemetry=False, laps=False, weather=False)
        
        # session.results contains Driver properties
        results = session.results
        drivers = []
        for idx, driver in results.iterrows():
            drivers.append({
                "driver_id": driver["DriverId"],
                "driver_number": driver["DriverNumber"],
                "abbreviation": driver["Abbreviation"],
                "full_name": f"{driver['FirstName']} {driver['LastName']}",
                "team_name": driver["TeamName"],
                "team_color": driver["TeamColor"]
            })
            
        # Trigger heavy telemetry parsing in the background so it's ready when user clicks play
        background_tasks.add_task(get_parsed_session, year, round, session_type)
        
        return {"year": year, "round": round, "session": session_type, "drivers": drivers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



import threading

# In-memory RAM cache for parsed FastF1 sessions to avoid redundant Pandas processing overhead
loaded_sessions = {}
session_lock = threading.Lock()

def get_parsed_session(year: int, round: int, session_type: str):
    key = f"{year}_{round}_{session_type}"
    with session_lock:
        if key not in loaded_sessions:
            print(f"[{key}] Pandas is parsing telemetry from cache into RAM for the first time... this will take ~30s...")
            session = fastf1.get_session(year, round, session_type)
            session.load(telemetry=True, laps=True, weather=False)
            
            # FASTF1 BUG Guard: If FastF1 gracefully choked or failed to fetch valid F1 Live Timing,
            # it might leave `.laps` entirely unloaded. Check before committing broken data to RAM!
            try:
                # Accessing .laps checks if it throws the DataNotLoaded flag internally
                if session.laps is None or len(session.laps) == 0:
                    raise Exception("Missing Laps data.")
            except Exception as e:
                print(f"[{key}] Validation Failed: No telemetry/laps parsed ({e}). Breaking memory lock so it retries.")
                raise ValueError("F1 Live Session Data unavailable. Either the server rejected the connection or the race data is missing.")
            
            loaded_sessions[key] = session
            print(f"[{key}] Parsing complete. Locked into RAM!")
            
        return loaded_sessions[key]


@app.get("/api/telemetry/fastest")
def get_fastest_lap_telemetry(year: int, round: int, session_type: str, driver: str):
    """Retrieve telemetry for the fastest lap of a specific driver."""
    try:
        session = get_parsed_session(year, round, session_type)
        
        laps = session.laps.pick_driver(driver)
        if laps.empty:
            raise HTTPException(status_code=404, detail="No laps found for this driver.")
            
        fastest_lap = laps.pick_fastest()
        if pd.isnull(fastest_lap['LapTime']):
            raise HTTPException(status_code=404, detail="No valid fastest lap time found.")
            
        telemetry = fastest_lap.get_telemetry()
        
        # Replace NaNs with None for JSON serialization
        telemetry = telemetry.replace([np.inf, -np.inf, np.nan], None)
        
        data = {
            "distance": telemetry["Distance"].tolist(),
            "x": telemetry["X"].tolist(),
            "y": telemetry["Y"].tolist(),
            "speed": telemetry["Speed"].tolist(),
            "throttle": telemetry["Throttle"].tolist(),
            "brake": telemetry["Brake"].tolist(),
            "rpm": telemetry["RPM"].tolist(),
            "gear": telemetry["nGear"].tolist(),
            "drs": telemetry["DRS"].tolist(),
            "lap_time": str(fastest_lap['LapTime'])
        }
        return {"driver": driver, "telemetry": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/clear_cache")
def clear_backend_memory():
    """Clear all RAM-locked session variables to force re-parsing of any stuck datasets."""
    with session_lock:
        loaded_sessions.clear()
    return {"status": "cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)