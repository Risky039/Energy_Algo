import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from collections import deque
from backend.models import AnomalyResponse
from datetime import datetime

class AnomalyDetector:
    def __init__(self, window_size=100):
        self.history = deque(maxlen=window_size)
        self.window_size = window_size
        self.model = IsolationForest(contamination=0.05, random_state=42)
        self.is_fitted = False

        # Pre-seed with some normal data so we don't crash on start
        # Assume normal consumption is around 500-4000W
        initial_data = np.random.normal(1000, 300, 50).reshape(-1, 1)
        self.history.extend(initial_data.flatten())
        self.fit_model()

    def fit_model(self):
        if len(self.history) >= 20:
            data = np.array(self.history).reshape(-1, 1)
            self.model.fit(data)
            self.is_fitted = True

    def check_anomaly(self, current_value: int) -> AnomalyResponse:
        """
        Checks for anomaly using both Statistical (Z-Score) and IsolationForest.
        """

        # 1. Update History
        self.history.append(current_value)

        # Re-fit occasionally? For real-time, maybe not every request.
        # Let's simple re-fit every 10 requests or just use the pre-trained one
        # but since we lack training data, we should re-fit to adapt to "normal".
        # For efficiency, let's just re-fit if we have enough data.
        if len(self.history) % 10 == 0:
            self.fit_model()

        # 2. Statistical Check (Moving Average & Std Dev)
        data_list = list(self.history)
        mean = np.mean(data_list)
        std = np.std(data_list)

        is_stat_anomaly = False
        deviation = 0.0

        if std > 0:
            z_score = (current_value - mean) / std
            deviation = z_score
            if abs(z_score) > 2:
                is_stat_anomaly = True

        # 3. Isolation Forest Check
        is_if_anomaly = False
        if self.is_fitted:
            # Predict returns -1 for anomaly, 1 for normal
            pred = self.model.predict([[current_value]])
            if pred[0] == -1:
                is_if_anomaly = True

        # Combine logic: Flag if either is true, or enforce both?
        # Prompt says: "IsolationForest pipeline that flags ... > 2 std dev".
        # This implies the IF pipeline *specifically* looks for that, OR we use IF *and* the rule.
        # I'll enable the anomaly if BOTH or EITHER?
        # A robust system might use ensemble. Let's say if Z-Score is high, it's definitely a spike.
        # IF might catch weirder patterns.

        is_anomaly = is_stat_anomaly or is_if_anomaly

        msg = "Normal"
        if is_anomaly:
            msg = f"Anomaly Detected! Value {current_value}W deviates significantly (Z={deviation:.2f})."

        return AnomalyResponse(
            timestamp=datetime.now(),
            value=current_value,
            is_anomaly=is_anomaly,
            deviation=deviation,
            message=msg
        )

anomaly_service = AnomalyDetector()
