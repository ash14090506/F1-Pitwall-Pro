import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt

DATA = "data/processed/strategy_alerts.csv"
DRIVERS = "data/raw/drivers.csv"
RACES = "data/raw/races.csv"
CIRCUITS = "data/raw/circuits.csv"


# Page setup
st.set_page_config(page_title="F1 Strategy Wall", layout="wide")

st.title("🏎️ F1 Race Strategy Wall")

# load datasets
df = pd.read_csv(DATA)
drivers = pd.read_csv(DRIVERS)
races = pd.read_csv(RACES)
circuits = pd.read_csv(CIRCUITS)

# add circuit location info
races = races.merge(
    circuits[["circuitId", "location", "country"]],
    on="circuitId",
    how="left"
)

# merge into main dataset
df = df.merge(drivers[["driverId", "surname"]], on="driverId", how="left")

df = df.merge(
    races[["raceId", "name", "year", "location", "country"]],
    on="raceId",
    how="left"
)# Sidebar filters
st.sidebar.header("Race Controls")

race_options = df[["raceId","name","year"]].drop_duplicates()

race_label = st.sidebar.selectbox(
    "Race",
    race_options.apply(lambda x: f"{x['year']} - {x['name']}", axis=1)
)

race = race_options[race_options.apply(
    lambda x: f"{x['year']} - {x['name']}", axis=1) == race_label
]["raceId"].values[0]

driver_name = st.sidebar.selectbox(
    "Driver",
    sorted(df[df["raceId"] == race]["surname"].unique())
)

filtered = df[(df["raceId"] == race) & (df["surname"] == driver_name)]

race_info = filtered.iloc[0]

st.subheader(f"{race_info['year']} {race_info['name']}")
st.caption(f"📍 {race_info['location']}, {race_info['country']}")

st.subheader(f"Driver: {driver_name}")

# ALERT DISPLAY
latest = filtered.iloc[-1]

if latest["alert"] == "PIT NOW":
    st.error("🔴 PIT NOW — Undercut threat & tire drop")
elif latest["alert"] == "UNDERCUT THREAT":
    st.warning("⚠ Undercut threat detected")
elif latest["alert"] == "PIT WINDOW OPEN":
    st.warning("🟡 Pit window open")
else:
    st.success("🟢 Pace stable — Stay out")

# Strategy table with colors
st.subheader("Strategy Timeline")

def highlight_risk(val):
    if val == "HIGH":
        return "background-color: #ff4b4b"
    if val == "MEDIUM":
        return "background-color: #ffa500"
    return ""

styled = filtered[["lap","risk_level","risk_reason","alert"]].style.applymap(
    highlight_risk, subset=["risk_level"]
)

st.dataframe(styled, use_container_width=True)

# Lap time graph
st.subheader("Lap Time & Pit Stops")

fig = plt.figure()

plt.plot(filtered["lap"], filtered["lap_time_seconds"], label="Lap Time")

# Mark pit laps
pit_laps = filtered[filtered["pitted"] == 1]["lap"]
pit_times = filtered[filtered["pitted"] == 1]["lap_time_seconds"]

plt.scatter(pit_laps, pit_times, marker="o", s=80, label="Pit Stop")

plt.xlabel("Lap")
plt.ylabel("Lap Time (sec)")
plt.title(f"{driver_name} Performance")
plt.legend()

st.pyplot(fig)

# Risk summary
st.subheader("Risk Summary")

col1, col2, col3 = st.columns(3)

col1.metric("HIGH Risk Laps", (filtered["risk_level"] == "HIGH").sum())
col2.metric("Undercut Threats", filtered["undercut_threat"].sum())
col3.metric("Pit Stops", filtered["pitted"].sum())

st.caption("Explainable strategy insights based on tire degradation and rival pit timing.")