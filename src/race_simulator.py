import pandas as pd
import numpy as np

DATA = "data/processed/lap_features.csv"

# realistic pit lane time loss (seconds)
PIT_LOSS = 12

print("\nSimulating race strategies...\n")

# --------------------------------------------------
# LOAD DATA
# --------------------------------------------------
df = pd.read_csv(DATA, low_memory=False)

# ensure required columns exist
required_cols = ["raceId","driverId","lap","lap_time_seconds","pace_delta"]

missing = [c for c in required_cols if c not in df.columns]
if missing:
    print("Missing columns:", missing)
    exit()

# select first race & driver automatically
race_id = df["raceId"].iloc[0]
driver_id = df["driverId"].iloc[0]

driver_data = df[
    (df["raceId"] == race_id) &
    (df["driverId"] == driver_id)
].copy()

driver_data = driver_data.sort_values("lap")

print(f"Race ID: {race_id}")
print(f"Driver ID: {driver_id}")
print(f"Laps Available: {len(driver_data)}\n")

if len(driver_data) == 0:
    print("No lap data found.")
    exit()

# fill missing values
driver_data["pace_delta"] = driver_data["pace_delta"].fillna(0)
driver_data["lap_time_seconds"] = driver_data["lap_time_seconds"].fillna(method="ffill")

laps = driver_data["lap"].values
lap_times = driver_data["lap_time_seconds"].values
pace_delta = driver_data["pace_delta"].values

# --------------------------------------------------
# RACE SIMULATION ENGINE
# --------------------------------------------------
def simulate_race(pit_lap=None):
    total_time = 0
    tire_wear = 0

    for i in range(len(laps)):

        lap_time = lap_times[i]

        # reset tire wear after pit
        if pit_lap and laps[i] == pit_lap:
            total_time += PIT_LOSS
            tire_wear = 0

        # accumulate tire degradation
        tire_wear += pace_delta[i]

        total_time += lap_time + tire_wear

    return total_time


# --------------------------------------------------
# TEST MULTIPLE STRATEGIES
# --------------------------------------------------

race_length = int(laps.max())

strategies = {
    "No Stop": None,
    "Pit Early": int(race_length * 0.25),
    "Pit Mid": int(race_length * 0.50),
    "Pit Late": int(race_length * 0.75),
}

results = {}

for name, lap in strategies.items():
    time = simulate_race(lap)
    results[name] = time

# --------------------------------------------------
# OUTPUT RESULTS
# --------------------------------------------------
print("Strategy Results:\n")

for strat, time in results.items():
    print(f"{strat:10} → {round(time/60,2)} minutes")

best_strategy = min(results, key=results.get)

print("\nOptimal Strategy:")
print(f"🏁 {best_strategy} is fastest")

time_saved = (max(results.values()) - min(results.values())) / 60
print(f"⏱ Potential time gain: {round(time_saved,2)} minutes")