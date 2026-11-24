import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Clock, Info, Navigation, Sun } from 'lucide-react';
import type { AirQualitySnapshot } from '../types/breathewise.ts';
import { getCpcbVisualStyle } from '../utils/aqiTheme.ts';

interface OutdoorPlannerViewProps {
  airQuality: AirQualitySnapshot | null;
}

export function OutdoorPlannerView({ airQuality }: OutdoorPlannerViewProps) {
  if (!airQuality) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-600">
        Select a city to view hourly pollution forecasts and lower-exposure outdoor windows.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Smart Outdoor Activity Planner
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Identify comparatively lower-pollution time windows for walking, jogging, children’s play, and school or work commutes in {airQuality.city}.
        </p>
      </div>

      {airQuality.dataMode === 'demo' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-xs text-amber-950 flex items-center gap-2.5">
          <Info className="w-4 h-4 shrink-0 text-amber-800" />
          <span>
            Forecast values below come from demonstration mode and should not be treated as live measurements when planning high-exertion outdoor activities.
          </span>
        </div>
      )}

      {/* Hourly Forecast Bar Chart */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Next 24 Hours Projected Indian CPCB AQI
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Color-coded by CPCB band · Updated {airQuality.updatedAtFormattedIst}
            </p>
          </div>
          <span className="text-xs text-slate-500">
            Lower bars indicate comparatively cleaner hours
          </span>
        </div>

        {airQuality.forecast24h.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Hourly forecast data is unavailable right now. Avoid assuming conditions are safe before prolonged outdoor plans.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={airQuality.forecast24h}
                margin={{ top: 10, right: 8, left: -14, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  interval={2}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="cpcbAqi" name="Projected CPCB AQI" radius={[4, 4, 0, 0]}>
                  {airQuality.forecast24h.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={getCpcbVisualStyle(entry.category).accentHex}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Activity Window Cards */}
      <section aria-label="Recommended activity windows" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {airQuality.outdoorWindows.map((win) => {
          const style = getCpcbVisualStyle(win.category);
          return (
            <article
              key={win.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{win.suitability}</span>
                  <span className="font-mono-num font-semibold text-slate-900">
                    ~{win.avgAqi} AQI · {win.category}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-base text-slate-900 mt-2">
                  {win.activity}
                </h3>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-teal-800">
                  <Clock className="w-3.5 h-3.5" />
                  {win.windowLabel}
                </p>
                <div className={`mt-3 h-1 w-full rounded-sm ${style.barBgClass}`} />
                <p className="mt-3 text-xs text-slate-600 leading-relaxed">{win.guidance}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-700">Indoor Alternative</p>
                <p className="text-xs text-slate-600 mt-0.5">{win.indoorAlternative}</p>
              </div>
            </article>
          );
        })}
      </section>

      {/* Commute & Route Exposure Tips */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-teal-700" />
          <h2 className="font-display text-base font-semibold text-slate-900">
            Commute & Route Exposure Guidance
          </h2>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-teal-700" />
              Why Midday Often Improves
            </p>
            Solar warming between 1:00 PM and 4:00 PM lifts winter thermal inversions, dispersing ground-level PM2.5 temporarily compared to 6:00–9:00 AM.
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="font-semibold text-slate-900 mb-1">Side Streets vs Arterial Roads</p>
            PM2.5 and NO2 concentrations drop noticeably just 50–100 meters away from heavy diesel traffic corridors and construction zones.
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="font-semibold text-slate-900 mb-1">Car Cabin & Two-Wheeler Habits</p>
            Switch car AC to internal recirculation in slow traffic. On two-wheelers or e-rickshaws during Poor+ AQI, wear a snug N95/KN95 respirator.
          </div>
        </div>
      </section>
    </div>
  );
}
