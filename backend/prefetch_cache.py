import fastf1
import os

# Setup Cache Directory identically to our main app
CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "cache"))
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

def prefetch_season(year):
    print(f"Fetching F1 schedule for the {year} season...")
    try:
        schedule = fastf1.get_event_schedule(year)
    except Exception as e:
        print(f"Failed to get schedule: {e}")
        return

    # Filter out pre-season testing
    schedule = schedule[schedule['EventFormat'] != 'testing']
    
    for _, event in schedule.iterrows():
        round_num = event["RoundNumber"]
        event_name = event["EventName"]
        
        # Skip invalid rounds
        if round_num <= 0:
            continue
            
        print(f"\n==============================================")
        print(f"  Prefetching: {event_name} (Round {round_num})")
        print(f"==============================================")
        
        try:
            # Getting 'R' (Race) session since that's what the UI uses
            session = fastf1.get_session(year, round_num, 'R')
            print("Downloading massive telemetry & position arrays to sqlite cache...")
            
            # This triggers the same logic that previously hung the UI, but now safely in the background
            session.load(telemetry=True, laps=True, weather=False)
            
            print(f"[SUCCESS] {event_name} is now cached!")
        except Exception as e:
            print(f"[SKIPPED] Could not load {event_name}. If the race hasn't happened yet, this is normal. Error: {e}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Prefetch fastf1 cache for a whole season.")
    parser.add_argument("--year", type=int, default=2026, help="The F1 season year to download")
    args = parser.parse_args()

    print("=========================================================")
    print(f" STARTING BULK CACHE DOWNLOAD FOR {args.year}")
    print(" WARNING: This will download gigabytes of raw F1 data.")
    print(" This process may take several hours depending on connection.")
    print("=========================================================\n")
    
    prefetch_season(args.year)
    
    print("\n[COMPLETE] Your F1 Pitwall Desktop app will now be lightning fast for these races!")
