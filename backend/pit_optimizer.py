import pandas as pd

DATA = "data/processed/lap_features.csv"
PIT_LOSS = 12   # seconds lost during pit stop

print("Calculating optimal pit lap...")

df = pd.read_csv(DATA)

race_id = df["raceId"].iloc[0]
driver_id = df["driverId"].iloc[0]

driver_data = df[(df["raceId"] == race_id) & (df["driverId"] == driver_id)]

best_lap = None
best_gain = 0

for lap in driver_data["lap"].unique():

    remaining = driver_data[driver_data["lap"] >= lap]

    degradation_loss = remaining["pace_delta"].sum()

    if degradation_loss > PIT_LOSS:
        gain = degradation_loss - PIT_LOSS

        if gain > best_gain:
            best_gain = gain
            best_lap = lap

print(f"Recommended pit lap: {best_lap}")
print(f"Estimated time saved: {round(best_gain,2)} seconds")