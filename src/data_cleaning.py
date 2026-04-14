import pandas as pd
import os

RAW = "data/raw"
PROCESSED = "data/processed"

os.makedirs(PROCESSED, exist_ok=True)

# ---------- Convert lap time to seconds ----------
def convert_lap_time(time_str):
    try:
        mins, secs = time_str.split(":")
        return int(mins) * 60 + float(secs)
    except:
        return None


def clean_lap_times():
    print("Cleaning lap_times...")

    df = pd.read_csv(f"{RAW}/lap_times.csv")

    df["lap_time_seconds"] = df["time"].apply(convert_lap_time)

    df = df.dropna(subset=["lap_time_seconds"])

    df["lap"] = df["lap"].astype(int)
    df["position"] = df["position"].astype(int)

    # Remove unrealistic laps (safety car etc.)
    df = df[(df["lap_time_seconds"] > 50) & (df["lap_time_seconds"] < 200)]

    df.to_csv(f"{PROCESSED}/lap_times_clean.csv", index=False)
    print("✓ lap_times cleaned")


def clean_pit_stops():
    print("Cleaning pit_stops...")

    df = pd.read_csv(f"{RAW}/pit_stops.csv")

    df["duration"] = pd.to_numeric(df["duration"], errors="coerce")
    df = df.dropna(subset=["duration"])

    df["lap"] = df["lap"].astype(int)

    df.to_csv(f"{PROCESSED}/pit_stops_clean.csv", index=False)
    print("✓ pit_stops cleaned")


def clean_results():
    print("Cleaning results...")

    df = pd.read_csv(f"{RAW}/results.csv")

    df = df[["raceId","driverId","constructorId","grid","positionOrder","statusId"]]

    df.to_csv(f"{PROCESSED}/results_clean.csv", index=False)
    print("✓ results cleaned")


def clean_races():
    print("Cleaning races...")

    df = pd.read_csv(f"{RAW}/races.csv")

    df = df[["raceId","year","round","circuitId","name"]]

    df.to_csv(f"{PROCESSED}/races_clean.csv", index=False)
    print("✓ races cleaned")


if __name__ == "__main__":
    clean_lap_times()
    clean_pit_stops()
    clean_results()
    clean_races()

    print("\nDATA CLEANING COMPLETE ✅")