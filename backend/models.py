from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

class Appliance(BaseModel):
    name: str
    is_running: bool
    power_draw: int  # Watts

class NILMResponse(BaseModel):
    timestamp: datetime
    total_consumption: int
    appliances: List[Appliance]

class AnomalyResponse(BaseModel):
    timestamp: datetime
    value: int
    is_anomaly: bool
    deviation: float
    message: str

class ForecastPoint(BaseModel):
    timestamp: datetime
    predicted_consumption: float

class ForecastResponse(BaseModel):
    forecast: List[ForecastPoint]
