import fastf1
import pandas as pd

fastf1.Cache.enable_cache('../data/cache')

session = fastf1.get_session(2024, 1, 'R')
session.load(telemetry=True, laps=True, weather=False, messages=False)

drv_laps = session.laps.pick_driver('VER')
lap1 = drv_laps.iloc[0]

car_data = lap1.get_car_data()
speeds = car_data['Speed'].values
times = car_data['Time'].dt.total_seconds().values

print("First 20 speeds:", speeds[:20])

start_idx = None
reach_50_idx = None

for i in range(len(speeds)):
    if speeds[i] < 5:
        start_idx = i
    elif speeds[i] >= 50 and start_idx is not None:
        reach_50_idx = i
        break

if start_idx is not None and reach_50_idx is not None:
    time_diff = times[reach_50_idx] - times[start_idx]
    print(f"0-50 time: {time_diff}s")
else:
    print("Could not find start or reach 50")
