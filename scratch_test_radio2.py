import fastf1
import pandas as pd

def test_radio_df():
    year = 2024
    round = 1
    session_type = 'R'
    print(f"Loading {year} {round} {session_type}...")
    session = fastf1.get_session(year, round, session_type)
    session.load(telemetry=False, laps=False, weather=False, messages=True)
    
    df = session.team_radio
    if df is not None and not df.empty:
        print("\n--- Team Radio Columns ---")
        print(df.columns)
        print("\n--- First 3 Rows ---")
        print(df.head(3))
    else:
        print("No team radio data available.")

if __name__ == "__main__":
    test_radio_df()
