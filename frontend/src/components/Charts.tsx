import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend } from 'recharts';
import { Activity, Zap, AlertTriangle, Home, TrendingUp } from 'lucide-react';

interface ForecastPoint {
    timestamp: string;
    predicted_consumption: number;
}

interface ChartsProps {
    history: any[];
    forecast: ForecastPoint[];
}

const Charts: React.FC<ChartsProps> = ({ history, forecast }) => {
    // Combine history and forecast for a continuous view if desired,
    // but typically we show them separately or joined.
    // Let's show "Live Consumption History" and "24h Forecast".

    const formattedHistory = history.map(h => ({
        ...h,
        time: new Date(h.timestamp).toLocaleTimeString(),
    })).slice(-20); // Last 20 points

    const formattedForecast = forecast.map(f => ({
        time: new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: f.predicted_consumption
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="text-blue-500" />
                    <h2 className="text-lg font-bold text-slate-800">Live Power Consumption (Watts)</h2>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={formattedHistory}>
                            <defs>
                                <linearGradient id="colorWatts" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                            <XAxis dataKey="time" hide />
                            <YAxis domain={[0, 'auto']} />
                            <Tooltip />
                            <Area type="monotone" dataKey="total_consumption" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWatts)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                 <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-purple-500" />
                    <h2 className="text-lg font-bold text-slate-800">AI 24-Hour Forecast</h2>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formattedForecast}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                            <XAxis dataKey="time" interval={4} />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Charts;
