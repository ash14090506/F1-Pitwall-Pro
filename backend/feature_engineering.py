import pandas as pd

PROCESSED = "data/processed"


def engineer_features():
    print("Engineering features...")

    laps = pd.read_csv(f"{PROCESSED}/lap_times_clean.csv")
    pits = pd.read_csv(f"{PROCESSED}/pit_stops_clean.csv")

    # Merge pit info
    df = laps.merge(
        pits,
        on=["raceId", "driverId", "lap"],
        how="left"
    )

    df["pitted"] = df["duration"].notna().astype(int)

    # Calculate stint number
    df["stint"] = df.groupby(["raceId","driverId"])["pitted"].cumsum()

    # Rolling average pace (last 3 laps)
    df["rolling_pace"] = (
        df.groupby(["raceId","driverId"])["lap_time_seconds"]
        .rolling(3).mean().reset_index(level=[0,1], drop=True)
    )

    # Pace change (degradation indicator)
    df["pace_delta"] = df["lap_time_seconds"] - df["rolling_pace"]

    df.to_csv(f"{PROCESSED}/lap_features.csv", index=False)

    print("✓ Features created")


if __name__ == "__main__":
    engineer_features()