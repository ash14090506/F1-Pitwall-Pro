import pandas as pd
import numpy as np
import fastf1

def calculate_style_metrics(driver, session):
    try:
        # Get driver laps
        laps = session.laps.pick_driver(driver)
        if laps.empty:
            return None
            
        fastest_lap = laps.pick_fastest()
        if pd.isnull(fastest_lap['LapTime']):
            return None
            
        # 1. Pace Consistency
        # Filter valid flying laps (exclude in/out laps)
        valid_laps = laps[laps['IsAccurate'] == True]
        if len(valid_laps) > 2:
            std_dev = valid_laps['LapTime'].dt.total_seconds().std()
            # Normalize: 0s std_dev -> 100, >2s std_dev -> 0
            consistency_score = max(0, min(100, 100 - (std_dev * 50)))
        else:
            consistency_score = 50.0 # Default if not enough laps
            
        # Get telemetry for fastest lap to compute other metrics
        # process_telemetry_data adds Lon_Accel and Lat_Accel
        try:
            tel = fastest_lap.get_telemetry()
            # Basic recreation of process_telemetry_data
            tel['Time_s'] = tel['Time'].dt.total_seconds()
            dt = tel['Time_s'].diff()
            dv = tel['Speed'].diff() / 3.6
            tel['Lon_Accel'] = (dv / dt) / 9.81
            tel['Lon_Accel'] = tel['Lon_Accel'].fillna(0)
            
            dx = tel['X'].diff()
            dy = tel['Y'].diff()
            dx_smooth = dx.rolling(window=5, center=True, min_periods=1).mean()
            dy_smooth = dy.rolling(window=5, center=True, min_periods=1).mean()
            d2x = dx_smooth.diff()
            d2y = dy_smooth.diff()
            R = ((dx_smooth**2 + dy_smooth**2)**1.5) / (np.abs(dx_smooth * d2y - dy_smooth * d2x) + 1e-6)
            v_ms = tel['Speed'] / 3.6
            tel['Lat_Accel'] = (v_ms**2 / R) / 9.81
            tel['Lat_Accel'] = tel['Lat_Accel'].clip(-6.0, 6.0).fillna(0)
        except Exception:
            return None

        # 2. Braking Aggressiveness (Max negative Lon_Accel)
        # Normalize: -5g -> 100, 0g -> 0
        min_lon = tel['Lon_Accel'].min()
        braking_score = max(0, min(100, (abs(min_lon) / 5.0) * 100))
        
        # 3. Throttle Commitment (% of lap at full throttle >= 99%)
        full_throttle_pct = (len(tel[tel['Throttle'] >= 99]) / len(tel)) * 100
        # Normalize: 50% -> 0, 80% -> 100
        throttle_score = max(0, min(100, (full_throttle_pct - 50) * (100 / 30)))
        
        # 4. Cornering G-Force (Average Lat_Accel when > 1g)
        cornering = tel[tel['Lat_Accel'] > 1.0]['Lat_Accel']
        if len(cornering) > 0:
            avg_corner_g = cornering.mean()
            # Normalize: 1g -> 0, 4g -> 100
            corner_score = max(0, min(100, (avg_corner_g - 1.0) * (100 / 3.0)))
        else:
            corner_score = 0
            
        # 5. Top Speed
        top_speed = tel['Speed'].max()
        # Normalize: 280 -> 0, 350 -> 100
        speed_score = max(0, min(100, (top_speed - 280) * (100 / 70)))
        
        return {
            "driver": driver,
            "consistency": round(consistency_score, 1),
            "braking": round(braking_score, 1),
            "throttle": round(throttle_score, 1),
            "cornering": round(corner_score, 1),
            "speed": round(speed_score, 1)
        }
    except Exception as e:
        print(f"Error computing for {driver}: {e}")
        return None

if __name__ == "__main__":
    fastf1.Cache.enable_cache('c:\\Users\\HP\\Desktop\\f1_strategy_ai\\data\\cache')
    session = fastf1.get_session(2023, 1, 'Q')
    session.load()
    res = calculate_style_metrics('VER', session)
    print("VER", res)
    res2 = calculate_style_metrics('HAM', session)
    print("HAM", res2)
