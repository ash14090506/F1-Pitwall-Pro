import pandas as pd

DATA = "data/processed/lap_features.csv"

def detect_risk():
    print("Detecting strategy risks...")

    df = pd.read_csv(DATA)

    # Tire degradation risk
    df["degradation_risk"] = df["pace_delta"] > 0.7

    # Stint length risk
    df["stint_risk"] = df["stint"] > 18

    # Default values
    df["risk_level"] = "LOW"
    df["risk_reason"] = "Stable performance"

    # Medium risk
    df.loc[df["degradation_risk"], "risk_level"] = "MEDIUM"
    df.loc[df["degradation_risk"], "risk_reason"] = "Tire degradation increasing"

    # High risk
    high_risk_condition = df["degradation_risk"] & df["stint_risk"]

    df.loc[high_risk_condition, "risk_level"] = "HIGH"
    df.loc[high_risk_condition, "risk_reason"] = \
        "Tires aging and pace dropping — pit window critical"

    df.to_csv("data/processed/risk_analysis.csv", index=False)

    print("✓ Risk analysis complete")


if __name__ == "__main__":
    detect_risk()