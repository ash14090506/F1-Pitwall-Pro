import fastf1
import pandas as pd
import numpy as np

session = fastf1.get_session(2026, 1, 'R')
# don't need telemetry for just circuit info potentially? 
# actually circuit info might be standalone
circuit = session.get_circuit_info()

if circuit is not None:
    print("Corners columns:")
    print(circuit.corners.columns)
    print("Corners data:")
    print(circuit.corners.head(2))
    
    # Check what else is in circuit
    print("Rotation:")
    print(circuit.rotation)
else:
    print("Circuit Info is None")

# Also let's check positions
session.load(telemetry=False, weather=False, messages=False)

positions = session.pos_data
print("Pos Data:")
for drv, df in positions.items() if hasattr(positions, 'items') else [] :
    print(f"Driver {drv} pos_data:")
    print(df.head(2))
    break

# Actually for driver positions (run position), we just need lap positions
print("Lap positions:")
laps = session.laps
if not laps.empty and 'Position' in laps.columns:
    print(laps[['Driver', 'LapNumber', 'Position']].head(2))
