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

def process_telemetry_data(telemetry):
    # Calculate Longitudinal and Lateral Acceleration
    try:
        # Time and Speed delta for Lon_Accel
        telemetry['Time_s'] = telemetry['Time'].dt.total_seconds()
        dt = telemetry['Time_s'].diff()
        dv = telemetry['Speed'].diff() / 3.6  # km/h to m/s
        telemetry['Lon_Accel'] = (dv / dt) / 9.81
        telemetry['Lon_Accel'] = telemetry['Lon_Accel'].fillna(0)
        
        # Track curvature for Lat_Accel
        dx = telemetry['X'].diff()
        dy = telemetry['Y'].diff()
        # Smooth GPS position noise
        dx_smooth = dx.rolling(window=5, center=True, min_periods=1).mean()
        dy_smooth = dy.rolling(window=5, center=True, min_periods=1).mean()
        d2x = dx_smooth.diff()
        d2y = dy_smooth.diff()
        
        # R = ((dx^2 + dy^2)^1.5) / |dx * d2y - dy * d2x|
        R = ((dx_smooth**2 + dy_smooth**2)**1.5) / (np.abs(dx_smooth * d2y - dy_smooth * d2x) + 1e-6)
        v_ms = telemetry['Speed'] / 3.6
        telemetry['Lat_Accel'] = (v_ms**2 / R) / 9.81
        # Clip absurd outliers resulting from tight slow corners where dx/dy ~= 0
        telemetry['Lat_Accel'] = telemetry['Lat_Accel'].clip(-6.0, 6.0).fillna(0)
    except Exception as e:
        print(f"Failed to calculate acceleration: {e}")
        telemetry['Lon_Accel'] = 0.0
        telemetry['Lat_Accel'] = 0.0
        
    return telemetry

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
        telemetry = process_telemetry_data(telemetry)
        
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
            "lon_accel": telemetry["Lon_Accel"].tolist(),
            "lat_accel": telemetry["Lat_Accel"].tolist(),
            "lap_time": str(fastest_lap['LapTime'])
        }
        return {"driver": driver, "telemetry": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/telemetry/lap")
def get_lap_telemetry(year: int, round: int, session_type: str, driver: str, lap_number: int):
    """Retrieve telemetry for a specific custom lap of a driver."""
    try:
        session = get_parsed_session(year, round, session_type)
        
        laps = session.laps.pick_driver(driver)
        if laps.empty:
            raise HTTPException(status_code=404, detail="No laps found for this driver.")
            
        lap = laps[laps['LapNumber'] == lap_number]
        if lap.empty:
            raise HTTPException(status_code=404, detail="Lap number not found.")
            
        lap = lap.iloc[0]
        telemetry = lap.get_telemetry()
        telemetry = process_telemetry_data(telemetry)
        
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
            "lon_accel": telemetry["Lon_Accel"].tolist(),
            "lat_accel": telemetry["Lat_Accel"].tolist(),
            "lap_time": str(lap['LapTime'])
        }
        return {"driver": driver, "telemetry": data, "lap_number": lap_number}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/telemetry/delta")
def get_telemetry_delta(year: int, round: int, session_type: str, ref_driver: str, comp_driver: str):
    """Retrieve time and speed delta between a reference driver and a comparison driver on their fastest laps."""
    try:
        session = get_parsed_session(year, round, session_type)
        
        ref_laps = session.laps.pick_driver(ref_driver)
        comp_laps = session.laps.pick_driver(comp_driver)
        
        if ref_laps.empty or comp_laps.empty:
            raise HTTPException(status_code=404, detail="Laps not found for one or more drivers.")
            
        ref_lap = ref_laps.pick_fastest()
        comp_lap = comp_laps.pick_fastest()
        
        ref_tel = ref_lap.get_telemetry()
        comp_tel = comp_lap.get_telemetry()
        
        # Use simple distance interpolation (since fastf1 delta_time is deprecated)
        ref_dist = ref_tel['Distance'].values
        ref_time = ref_tel['Time'].dt.total_seconds().values
        ref_speed = ref_tel['Speed'].values
        
        comp_dist = comp_tel['Distance'].values
        comp_time = comp_tel['Time'].dt.total_seconds().values
        comp_speed = comp_tel['Speed'].values
        
        # Interpolate comp_time and comp_speed onto ref_dist
        comp_time_interp = np.interp(ref_dist, comp_dist, comp_time)
        comp_speed_interp = np.interp(ref_dist, comp_dist, comp_speed)
        
        delta_time = comp_time_interp - ref_time
        delta_speed = comp_speed_interp - ref_speed
        
        # To avoid json serialization issues with numpy types
        data = {
            "distance": ref_dist.tolist(),
            "delta_time": delta_time.tolist(),
            "delta_speed": delta_speed.tolist(),
            "ref_speed": ref_speed.tolist(),
            "comp_speed": comp_speed_interp.tolist()
        }
        
        return {
            "ref_driver": ref_driver,
            "comp_driver": comp_driver,
            "delta": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/laps_summary")
def get_laps_summary(year: int, round: int, session_type: str, drivers: str):
    """Retrieve Lap-by-Lap data for comparison."""
    try:
        session = get_parsed_session(year, round, session_type)
        driver_list = [d.strip() for d in drivers.split(',') if d.strip()]
        
        result = {}
        for drv in driver_list:
            laps = session.laps.pick_driver(drv)
            if laps.empty:
                continue
                
            drv_laps = []
            for _, lap in laps.iterrows():
                def format_timedelta(td):
                    if pd.isnull(td):
                        return "-"
                    total_seconds = td.total_seconds()
                    minutes = int(total_seconds // 60)
                    seconds = total_seconds % 60
                    return f"{minutes}:{seconds:06.3f}"
                
                drv_laps.append({
                    "LapNumber": int(lap["LapNumber"]) if pd.notnull(lap["LapNumber"]) else None,
                    "LapTime": format_timedelta(lap["LapTime"]),
                    "Sector1Time": format_timedelta(lap["Sector1Time"]),
                    "Sector2Time": format_timedelta(lap["Sector2Time"]),
                    "Sector3Time": format_timedelta(lap["Sector3Time"]),
                    "Compound": str(lap["Compound"]) if pd.notnull(lap["Compound"]) else "-",
                    "TyreLife": str(lap["TyreLife"]) if pd.notnull(lap["TyreLife"]) else "-",
                    "IsPersonalBest": bool(lap["IsPersonalBest"]) if pd.notnull(lap["IsPersonalBest"]) else False
                })
            result[drv] = drv_laps
            
        return {"driver_laps": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/weather")
def get_weather_data(year: int, round: int, session_type: str):
    """Retrieve environmental weather data over the session time."""
    try:
        session = get_parsed_session(year, round, session_type)
        if session.weather_data is None or session.weather_data.empty:
            raise HTTPException(status_code=404, detail="Weather data not available.")
            
        weather = session.weather_data.copy()
        weather["Time_s"] = weather["Time"].dt.total_seconds()
        weather = weather.replace([np.inf, -np.inf, np.nan], None)
        
        data = {
            "time": weather["Time_s"].tolist(),
            "air_temp": weather["AirTemp"].tolist(),
            "track_temp": weather["TrackTemp"].tolist(),
            "humidity": weather["Humidity"].tolist(),
            "pressure": weather["Pressure"].tolist(),
            "rainfall": weather["Rainfall"].tolist()
        }
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pitstops")
def get_pitstop_data(year: int, round: int, session_type: str):
    """Retrieve pitstop history for all drivers from laps data."""
    try:
        session = get_parsed_session(year, round, session_type)
        if session.laps is None or session.laps.empty:
            raise HTTPException(status_code=404, detail="Lap data not available.")
            
        pit_laps = session.laps[pd.notnull(session.laps['PitOutTime'])].copy()
        
        if pit_laps.empty:
            return {"pitstops": []}
            
        stops = []
        for _, lap in pit_laps.iterrows():
            in_lap = session.laps[(session.laps['Driver'] == lap['Driver']) & (session.laps['LapNumber'] == lap['LapNumber'] - 1)]
            pit_loss = 0.0
            if not in_lap.empty and pd.notnull(in_lap.iloc[0]['PitInTime']):
                pit_loss = (lap['PitOutTime'] - in_lap.iloc[0]['PitInTime']).total_seconds()
            
            stops.append({
                "driver": str(lap["Driver"]),
                "lap": int(lap["LapNumber"]) - 1,
                "compound": str(lap["Compound"]),
                "stint": int(lap["Stint"]) if pd.notnull(lap["Stint"]) else 0,
                "pit_loss": float(pit_loss)
            })
            
        return {"pitstops": stops}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/race_control")
def get_race_control_messages(year: int, round: int, session_type: str):
    """Retrieve flags and race control messages."""
    try:
        session = get_parsed_session(year, round, session_type)
        rcm = session.race_control_messages
        
        if rcm is None or rcm.empty:
            return {"messages": []}
            
        rcm_safe = rcm.copy()
        
        if 'Time' in rcm_safe.columns:
            rcm_safe['Time_clean'] = pd.to_datetime(rcm_safe['Time'])
            if not rcm_safe['Time_clean'].empty:
                rcm_safe['Time_s'] = (rcm_safe['Time_clean'] - rcm_safe['Time_clean'].min()).dt.total_seconds()
            else:
                rcm_safe['Time_s'] = 0.0
        else:
            rcm_safe['Time_s'] = 0.0
            
        rcm_safe = rcm_safe.replace([np.inf, -np.inf, np.nan], None)
        
        messages = []
        for _, msg in rcm_safe.iterrows():
            messages.append({
                "time": float(msg["Time_s"]) if pd.notnull(msg["Time_s"]) else 0.0,
                "category": str(msg.get("Category", "Unknown")),
                "message": str(msg.get("Message", "Unknown")),
                "flag": str(msg.get("Flag", "Unknown")),
                "status": str(msg.get("Status", "Unknown"))
            })
            
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/circuit_info")
def get_circuit_data(year: int, round: int, session_type: str):
    """Retrieve circuit geometry and markers (DRS, Corners)."""
    try:
        session = get_parsed_session(year, round, session_type)
        try:
            circuit = session.get_circuit_info()
        except Exception:
            circuit = None
        
        if circuit is None:
            raise HTTPException(status_code=404, detail="Circuit geometry not found.")
            
        corners_list = []
        if hasattr(circuit, 'corners') and circuit.corners is not None and not circuit.corners.empty:
            for _, c in circuit.corners.iterrows():
                corners_list.append({
                    "number": str(c.get("Number", "")),
                    "letter": str(c.get("Letter", "")),
                    "x": float(c.get("X", 0.0)),
                    "y": float(c.get("Y", 0.0)),
                    "angle": float(c.get("Angle", 0.0)),
                    "distance": float(c.get("Distance", 0.0))
                })
                
        rotation = float(circuit.rotation) / 180 * np.pi if hasattr(circuit, 'rotation') else 0.0
        
        return {
            "corners": corners_list,
            "rotation": rotation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/positions")
def get_positions_data(year: int, round: int, session_type: str):
    """Retrieve lap-by-lap track positions for positional chart."""
    try:
        session = get_parsed_session(year, round, session_type)
        if session.laps is None or session.laps.empty:
            raise HTTPException(status_code=404, detail="Laps data not available for positions.")
            
        pos_data = []
        for drv in session.laps['Driver'].unique():
            drv_laps = session.laps.pick_driver(drv)
            if drv_laps.empty: continue
            
            laps_list = []
            positions_list = []
            
            for _, lap in drv_laps.iterrows():
                if pd.notnull(lap.get('Position')) and pd.notnull(lap.get('LapNumber')):
                    laps_list.append(int(lap['LapNumber']))
                    positions_list.append(int(lap['Position']))
                    
            if len(laps_list) > 0:
                pos_data.append({
                    "driver": str(drv),
                    "laps": laps_list,
                    "positions": positions_list
                })
                
        return {"driver_positions": pos_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tire_strategy")
def get_tire_strategy(year: int, round: int, session_type: str):
    """Retrieve tire stint strategies for visual whiteboard."""
    try:
        session = get_parsed_session(year, round, session_type)
        if session.laps is None or session.laps.empty:
            raise HTTPException(status_code=404, detail="Laps data not available.")
            
        driver_stints = []
        for drv in session.laps['Driver'].unique():
            drv_laps = session.laps.pick_driver(drv)
            if drv_laps.empty: continue
            
            stints_groups = drv_laps.dropna(subset=['Stint']).groupby('Stint')
            stints = []
            
            for stint, stint_df in stints_groups:
                compound = str(stint_df['Compound'].iloc[0])
                fresh = bool(stint_df['FreshTyre'].iloc[0]) if 'FreshTyre' in stint_df.columns and pd.notnull(stint_df['FreshTyre'].iloc[0]) else True
                start_lap = int(stint_df['LapNumber'].min())
                end_lap = int(stint_df['LapNumber'].max())
                laps_length = end_lap - start_lap + 1
                
                stints.append({
                    "stint": int(stint),
                    "compound": compound,
                    "fresh_tyre": fresh,
                    "start_lap": start_lap,
                    "end_lap": end_lap,
                    "laps": laps_length
                })
                
            if len(stints) > 0:
                driver_stints.append({
                    "driver": str(drv),
                    "stints": stints
                })
                
        driver_stints = sorted(driver_stints, key=lambda x: max(s['end_lap'] for s in x['stints']), reverse=True)
        return {"driver_stints": driver_stints}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/traffic")
def get_traffic_data(year: int, round: int, session_type: str):
    """Retrieve dirty air / traffic metrics."""
    try:
        session = get_parsed_session(year, round, session_type)
        if session.laps is None or session.laps.empty:
            raise HTTPException(status_code=404, detail="Laps data not available.")
            
        DIRTY_AIR_THRESHOLD = 1.5 
        
        laps = session.laps.dropna(subset=['Time', 'Driver', 'LapNumber']).copy()
        
        lap_times = {}
        for drv in laps['Driver'].unique():
            drv_laps = laps[laps['Driver'] == drv]
            lap_times[drv] = {int(row['LapNumber']): row['Time'].total_seconds() for _, row in drv_laps.iterrows()}
            
        traffic_stats = []
        for drv in lap_times:
            dirty_air_laps = 0
            clean_air_laps = 0
            
            for lap_num, t_a in lap_times[drv].items():
                is_dirty = False
                for other_drv in lap_times:
                    if other_drv == drv: continue
                    t_b = lap_times[other_drv].get(lap_num)
                    if t_b is not None:
                        gap = t_a - t_b
                        if 0 < gap <= DIRTY_AIR_THRESHOLD:
                            is_dirty = True
                            break
                            
                if is_dirty:
                    dirty_air_laps += 1
                else:
                    clean_air_laps += 1
                    
            if dirty_air_laps + clean_air_laps > 0:
                perc = (dirty_air_laps / (dirty_air_laps + clean_air_laps)) * 100.0
                traffic_stats.append({
                    "driver": str(drv),
                    "dirty_air_laps": dirty_air_laps,
                    "clean_air_laps": clean_air_laps,
                    "dirty_air_percentage": float(f"{perc:.1f}")
                })
                
        traffic_stats = sorted(traffic_stats, key=lambda x: x['dirty_air_percentage'], reverse=True)
        return {"traffic": traffic_stats}
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