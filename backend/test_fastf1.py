import fastf1
session = fastf1.get_session(2026, 1, 'R')
session.load(telemetry=False, weather=True, messages=True)

print("--- WEATHER ---")
if session.weather_data is not None:
    print(session.weather_data.head())
    
print("--- RACE CONTROL ---")
rcm = session.race_control_messages
if rcm is not None:
    print(rcm.dtypes)
    print(rcm.head())
