import fastf1
import pandas as pd

fastf1.Cache.enable_cache('data/cache')
session = fastf1.get_session(2023, 1, 'Q')
session.load()
print(session.laps.columns)
print(session.laps['Position'].unique())
