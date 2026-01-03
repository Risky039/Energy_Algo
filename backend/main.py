from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uvicorn
import random
from datetime import datetime

from backend.models import NILMResponse, AnomalyResponse, ForecastResponse
from backend.services.nilm import nilm_service
from backend.services.anomaly import anomaly_service
from backend.services.forecasting import forecast_service

app = FastAPI(title="Smart Energy Intelligence Platform")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationRequest(BaseModel):
    # Optional override if we want to manually set value,
    # but normally we generate it.
    manual_value: int | None = None

@app.get("/")
def read_root():
    return {"status": "System Operational"}

@app.post("/api/analyze")
def analyze_energy(req: SimulationRequest) -> dict:
    """
    Main polling endpoint.
    1. Generates (or receives) current total consumption.
    2. Runs NILM (Disaggregation).
    3. Runs Anomaly Detection.
    4. Returns combined data.
    """

    # 1. Generate Data
    if req.manual_value is not None:
        current_watts = req.manual_value
    else:
        # Generate from NILM service to be consistent with appliance states
        state = nilm_service.generate_current_state()
        current_watts = sum(state.values())
        # Add some noise/randomness that isn't captured by appliances?
        # Or just use exact sum. Exact sum is cleaner for NILM demo.

    # 2. NILM
    appliances = nilm_service.disaggregate(current_watts)

    # 3. Anomaly
    anomaly_data = anomaly_service.check_anomaly(current_watts)

    return {
        "timestamp": datetime.now(),
        "total_consumption": current_watts,
        "nilm": appliances,
        "anomaly": anomaly_data
    }

@app.get("/api/forecast", response_model=ForecastResponse)
def get_forecast():
    """
    Returns next 24h forecast.
    """
    points = forecast_service.predict_next_24h()
    return ForecastResponse(forecast=points)

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
