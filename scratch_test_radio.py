import fastf1

def test_radio():
    year = 2024
    round = 1
    session_type = 'R'
    session = fastf1.get_session(year, round, session_type)
    # Minimizing load
    session.load(telemetry=False, laps=False, weather=False, messages=True)
    
    print("\n--- Session Attributes ---")
    for attr in dir(session):
        if not attr.startswith('_'):
            print(attr)

if __name__ == "__main__":
    test_radio()
