import pandas as pd

DATA = "data/processed/lap_features.csv"

def detect_undercut():
    print("Detecting undercut threats...")

    df = pd.read_csv(DATA)

    # Sort to ensure proper lap order
    df = df.sort_values(["raceId", "lap"])

    # Identify rivals pitting earlier in same race
    df["rival_pitted_recently"] = df.groupby("raceId")["pitted"].shift(1)

    # Undercut threat condition
    df["undercut_threat"] = (
        (df["rival_pitted_recently"] == 1) &
        (df["pace_delta"] > 0.5)
    )

    df.to_csv("data/processed/undercut_analysis.csv", index=False)

    print("✓ Undercut analysis complete")


if __name__ == "__main__":
    detect_undercut()