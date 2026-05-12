import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

DATA = "data/processed/lap_features.csv"

print("Training ML risk model...")

df = pd.read_csv(DATA)

features = [
    "lap_time_seconds",
    "pace_delta",
    "stint",
    "rolling_pace"
]

target = "pitted"

df = df.dropna(subset=features)

X = df[features]
y = df[target]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

predictions = model.predict(X_test)

print("\nModel Performance:")
print(classification_report(y_test, predictions))

importance = pd.Series(model.feature_importances_, index=features)
print("\nFeature Importance:")
print(importance.sort_values(ascending=False))

print("\nML model trained successfully")