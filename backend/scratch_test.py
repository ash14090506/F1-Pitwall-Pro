import fastf1
import fastf1.utils
import pandas as pd
import numpy as np

fastf1.Cache.enable_cache('../data/cache')
session = fastf1.get_session(2026, 1, 'R')
session.load(telemetry=True, laps=True, weather=False)

laps = session.laps
laps_drv1 = laps.pick_driver('VER')
laps_drv2 = laps.pick_driver('LEC')

lap1 = laps_drv1.pick_fastest()
lap2 = laps_drv2.pick_fastest()

delta_time, ref_tel, comp_tel = fastf1.utils.delta_time(lap1, lap2)
print("Delta Time:", delta_time[:5])

# check acceleration
tel = lap1.get_telemetry()
# calculate lon accel: dv/dt
tel['Time_s'] = tel['Time'].dt.total_seconds()
dt = tel['Time_s'].diff()
dv = tel['Speed'].diff() / 3.6 # km/h to m/s
lon_accel = (dv / dt) / 9.81 # in Gs
print("Lon Accel Gs:", lon_accel.min(), lon_accel.max())
