import fastf1
import pandas as pd

fastf1.Cache.enable_cache('data/cache')
session = fastf1.get_session(2023, 1, 'R')
session.load()
print(session.track_status)
