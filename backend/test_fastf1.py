import fastf1
import pandas as pd
session = fastf1.get_session(2026, 1, 'R')
session.load(telemetry=False, weather=False, messages=True)

# Test Race Control Time
rcm = session.race_control_messages.copy()
rcm['Time_s'] = (rcm['Time'] - session.session_start_time).dt.total_seconds()
print(rcm[['Time', 'Time_s']].head())

# Test Pitstops
pit_out_laps = session.laps[pd.notnull(session.laps['PitOutTime'])].copy()
print(f"Total outlaps: {len(pit_out_laps)}")

stops = []
for _, lap in pit_out_laps.iterrows():
    in_lap = session.laps[(session.laps['Driver'] == lap['Driver']) & (session.laps['LapNumber'] == lap['LapNumber'] - 1)]
    pit_loss = 0.0
    if not in_lap.empty and pd.notnull(in_lap.iloc[0]['PitInTime']):
        pit_loss = (lap['PitOutTime'] - in_lap.iloc[0]['PitInTime']).total_seconds()
    stops.append(pit_loss)

print(f"Sample pit losses: {stops[:5]}")
