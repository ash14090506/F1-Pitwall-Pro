import fastf1
import pandas as pd

fastf1.Cache.enable_cache('C:/Users/HP/AppData/Local/Temp/fastf1_cache') 

def test():
    session = fastf1.get_session(2026, 1, 'R')
    session.load(telemetry=False, weather=False, messages=False)
    laps = session.laps.pick_driver('VER')
    print("Columns:", laps.columns.tolist())
    
    first_lap = laps.iloc[0]
    print("\nFirst Lap Data:")
    for col in laps.columns:
        print(f"{col}: {first_lap[col]}")

if __name__ == "__main__":
    test()
