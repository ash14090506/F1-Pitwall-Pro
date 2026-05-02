import fastf1
from fastf1.api import team_radio

def test_api_radio():
    session = fastf1.get_session(2024, 1, 'R')
    session.load(telemetry=False, laps=False, weather=False)
    
    try:
        radio = team_radio(session.api_path)
        print(radio.columns)
        print(radio.head(3))
    except Exception as e:
        print(f"Error: {e}")
        
if __name__ == "__main__":
    test_api_radio()
