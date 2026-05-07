import fastf1
import pandas as pd

fastf1.Cache.enable_cache('../data/cache')
session = fastf1.get_session(2026, 2, 'R')
session.load(telemetry=False, weather=True)

laps = session.laps.pick_quicklaps().dropna(subset=["LapTime", "Driver", "Compound"])
weather = laps.get_weather_data()

laps = laps.reset_index(drop=True)
weather = weather.reset_index(drop=True)

laps['TrackTemp'] = weather['TrackTemp']
laps['AirTemp'] = weather['AirTemp']

print(laps[['Driver', 'LapTime', 'TrackTemp', 'AirTemp', 'Compound']].head())
