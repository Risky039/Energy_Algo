import React, { useState, useEffect } from 'react';
import { Zap, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import Charts from './Charts';

// Types matching Backend
interface Appliance {
    name: string;
    is_running: boolean;
    power_draw: number;
}

interface AnomalyData {
    timestamp: string;
    value: number;
    is_anomaly: boolean;
    deviation: number;
    message: string;
}

interface AnalysisData {
    timestamp: string;
    total_consumption: number;
    nilm: Appliance[];
    anomaly: AnomalyData;
}

interface ForecastPoint {
    timestamp: string;
    predicted_consumption: number;
}

const Dashboard: React.FC = () => {
    const [currentData, setCurrentData] = useState<AnalysisData | null>(null);
    const [history, setHistory] = useState<AnalysisData[]>([]);
    const [forecast, setForecast] = useState<ForecastPoint[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Fetch Forecast once on mount
    useEffect(() => {
        const fetchForecast = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/forecast');
                const data = await res.json();
                setForecast(data.forecast);
            } catch (err) {
                console.error("Failed to fetch forecast", err);
            }
        };
        fetchForecast();
    }, []);

    // Poll Analysis every 2 seconds
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });
                const data: AnalysisData = await res.json();

                setCurrentData(data);
                setHistory(prev => [...prev, data].slice(-50)); // Keep last 50
                setError(null);
            } catch (err) {
                console.error("Failed to fetch analysis", err);
                setError("Backend connection failed. Is the server running?");
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, []);

    if (!currentData) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Zap className="h-12 w-12 text-blue-500 animate-pulse mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-800">Initializing Smart Energy Platform...</h1>
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                        <Zap className="fill-yellow-400 text-yellow-500" />
                        Smart Energy Intelligence
                    </h1>
                    <p className="text-slate-500 mt-1">Real-time NILM, Anomaly Detection & Forecasting</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                    <span className="text-sm text-slate-400 uppercase tracking-wide font-semibold">Status</span>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`h-3 w-3 rounded-full ${currentData.anomaly.is_anomaly ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></div>
                        <span className="font-medium">{currentData.anomaly.is_anomaly ? 'CRITICAL ALERT' : 'Normal Operation'}</span>
                    </div>
                </div>
            </header>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Load */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                    <h3 className="text-slate-500 text-sm font-semibold uppercase">Current Load</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-4xl font-bold">{currentData.total_consumption}</span>
                        <span className="text-lg text-slate-400">Watts</span>
                    </div>
                </div>

                {/* Anomaly Score */}
                 <div className={`bg-white p-6 rounded-xl shadow-md border-l-4 ${currentData.anomaly.is_anomaly ? 'border-red-500 bg-red-50' : 'border-green-500'}`}>
                    <h3 className="text-slate-500 text-sm font-semibold uppercase">Anomaly Status</h3>
                    <div className="mt-2">
                        {currentData.anomaly.is_anomaly ? (
                            <div>
                                <div className="flex items-center gap-2 text-red-600 font-bold text-xl">
                                    <AlertTriangle />
                                    <span>DETECTED</span>
                                </div>
                                <p className="text-sm text-red-700 mt-1">{currentData.anomaly.message}</p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-green-600 font-bold text-xl">
                                <CheckCircle />
                                <span>SAFE</span>
                            </div>
                        )}
                        <p className="text-xs text-slate-400 mt-2">Z-Score Deviation: {currentData.anomaly.deviation.toFixed(2)}</p>
                    </div>
                </div>

                {/* Active Appliances Count */}
                 <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                    <h3 className="text-slate-500 text-sm font-semibold uppercase">Active Appliances (NILM)</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-4xl font-bold">
                            {currentData.nilm.filter(a => a.is_running).length}
                        </span>
                        <span className="text-lg text-slate-400">/ {currentData.nilm.length}</span>
                    </div>
                </div>
            </div>

            <Charts history={history} forecast={forecast} />

            {/* Appliance Breakdown */}
            <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Lightbulb className="text-yellow-500" />
                        Real-Time Disaggregation (NILM)
                    </h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentData.nilm.map((app) => (
                            <div key={app.name} className={`flex items-center justify-between p-4 rounded-lg border ${app.is_running ? 'border-green-200 bg-green-50' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${app.is_running ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                    <span className="font-semibold text-slate-700">{app.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className={`block font-bold ${app.is_running ? 'text-slate-900' : 'text-slate-400'}`}>
                                        {app.power_draw} W
                                    </span>
                                    <span className="text-xs text-slate-400">{app.is_running ? 'Running' : 'Off'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
