import pandas as pd

RISK = "data/processed/risk_analysis.csv"
UNDERCUT = "data/processed/undercut_analysis.csv"

def generate_alerts():
    print("Generating strategy alerts...")

    risk = pd.read_csv(RISK)
    undercut = pd.read_csv(UNDERCUT)

    df = risk.merge(
        undercut[["raceId","driverId","lap","undercut_threat"]],
        on=["raceId","driverId","lap"],
        how="left"
    )

    df["alert"] = "STAY OUT"

    df.loc[df["risk_level"] == "HIGH", "alert"] = "PIT WINDOW OPEN"
    df.loc[df["undercut_threat"] == True, "alert"] = "UNDERCUT THREAT"
    df.loc[
        (df["risk_level"] == "HIGH") & (df["undercut_threat"] == True),
        "alert"
    ] = "PIT NOW"

    df.to_csv("data/processed/strategy_alerts.csv", index=False)

    print("✓ Strategy alerts generated")


if __name__ == "__main__":
    generate_alerts()