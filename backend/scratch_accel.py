import fastf1
import pandas as pd
import numpy as np

fastf1.Cache.enable_cache('../data/cache')
session = fastf1.get_session(2026, 1, 'R')
session.load(telemetry=True, laps=True, weather=False)

laps = session.laps.pick_driver('VER')
lap = laps.pick_fastest()
tel = lap.get_telemetry()

# Calculate Lon Accel
tel['Time_s'] = tel['Time'].dt.total_seconds()
dt = tel['Time_s'].diff()
dv = tel['Speed'].diff() / 3.6 # km/h to m/s
tel['Lon_Accel'] = (dv / dt) / 9.81

# Calculate Lat Accel using curve radius R = (dx^2 + dy^2)^(3/2) / |dx*d2y - dy*d2x|
# and LatAccel = v^2 / R
dx = tel['X'].diff()
dy = tel['Y'].diff()
d2x = dx.diff()
d2y = dy.diff()

R = ((dx**2 + dy**2)**1.5) / np.abs(dx * d2y - dy * d2x)
v_ms = tel['Speed'] / 3.6
tel['Lat_Accel'] = (v_ms**2 / R) / 9.81

print("Lat Accel range:", tel['Lat_Accel'].min(), tel['Lat_Accel'].max())
print("Lon Accel range:", tel['Lon_Accel'].min(), tel['Lon_Accel'].max())
