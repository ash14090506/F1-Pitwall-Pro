import fastf1

def test():
    session = fastf1.get_session(2026, 1, 'R')
    session.load(telemetry=False, weather=False, messages=False)
    # Check if we have track_info
    if hasattr(session, 'track_info') and session.track_info is not None:
        print("Track info exists!")
        print(session.track_info.corners)
    else:
        print("No track info.")

if __name__ == "__main__":
    test()
