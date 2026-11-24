import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Compass,
  Droplets,
  Info,
  RefreshCw,
  ShieldAlert,
  Thermometer,
  Wind,
} from 'lucide-react';
import type {
  AirQualitySnapshot,
  HouseholdExposureSummary,
} from '../types/breathewise.ts';
import { getCpcbVisualStyle } from '../utils/aqiTheme.ts';
import type { NavTabId } from './Sidebar.tsx';

interface DashboardViewProps {
  airQuality: AirQualitySnapshot | null;
  loading: boolean;
  error: string | null;
  exposure: HouseholdExposureSummary | null;
  familyCount: number;
  onRefresh: () => void;
  onNavigate: (tab: NavTabId) => void;
}

export function DashboardView({
  airQuality,
  loading,
  error,
  exposure,
  familyCount,
  onRefresh,
  onNavigate,
}: DashboardViewProps) {
  if (loading && !airQuality) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-white border border-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-white border border-slate-200 rounded-xl" />
          <div className="h-28 bg-white border border-slate-200 rounded-xl" />
          <div className="h-28 bg-white border border-slate-200 rounded-xl" />
        </div>
        <div className="h-72 bg-white border border-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error && !airQuality) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h2 className="font-display font-semibold text-lg text-slate-900">
          Unable to load air quality data
        </h2>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Fetch
        </button>
      </div>
    );
  }

  if (!airQuality) return null;

  const style = getCpcbVisualStyle(airQuality.category);

  const pollutantCards = [
    {
      label: 'PM2.5',
      value: airQuality.pollutants.pm25,
      unit: 'µg/m³',
      note: 'Fine respirable particles',
    },
    {
      label: 'PM10',
      value: airQuality.pollutants.pm10,
      unit: 'µg/m³',
      note: 'Coarse dust & road particles',
    },
    {
      label: 'NO2',
      value: airQuality.pollutants.no2,
      unit: 'µg/m³',
      note: 'Traffic & combustion gas',
    },
    {
      label: 'SO2',
      value: airQuality.pollutants.so2,
      unit: 'µg/m³',
      note: 'Industrial sulfur dioxide',
    },
    {
      label: 'CO',
      value:
        airQuality.pollutants.co !== null
          ? Number((airQuality.pollutants.co / 1000).toFixed(2))
          : null,
      unit: 'mg/m³',
      note: 'Carbon monoxide',
    },
    {
      label: 'O3',
      value: airQuality.pollutants.o3,
      unit: 'µg/m³',
      note: 'Ground-level ozone',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Clearly Labeled Demonstration Notice */}
      {airQuality.dataMode === 'demo' && airQuality.demoNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-950">
                Demonstration Mode Active — Not Live Sensor Measurements
              </p>
              <p className="text-xs text-amber-900 mt-0.5">{airQuality.demoNotice}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Split: Current CPCB AQI + 3 Priority Family Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <section className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-800">
                  {airQuality.city}, {airQuality.state}
                </span>
                <span aria-hidden="true">·</span>
                <span>{airQuality.standardLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num">{airQuality.updatedAtFormattedIst}</span>
              </div>
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 py-1 px-2 rounded hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="flex items-baseline gap-4">
                  <span className="font-mono-num text-6xl font-bold tracking-tight text-slate-900">
                    {airQuality.cpcbAqi}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-3 h-3 rounded-sm ${style.barBgClass}`}
                        aria-hidden="true"
                      />
                      <span className={`font-display text-2xl font-bold ${style.textClass}`}>
                        {airQuality.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Dominant Pollutant: <strong className="text-slate-800">{airQuality.dominantPollutant}</strong>
                      {airQuality.usAqiReference !== null && (
                        <>
                          {' '}
                          · US EPA Ref: <span className="font-mono-num">{airQuality.usAqiReference}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-700 leading-relaxed max-w-xl">
                  {airQuality.categoryDescription}
                </p>
              </div>
            </div>
          </div>

          {/* CPCB Scale Bar & Weather Strip */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-6 gap-1.5" aria-label="Indian CPCB AQI scale">
              {[
                { name: 'Good', cls: 'bg-green-600' },
                { name: 'Satisfactory', cls: 'bg-lime-600' },
                { name: 'Moderate', cls: 'bg-yellow-500' },
                { name: 'Poor', cls: 'bg-orange-600' },
                { name: 'Very Poor', cls: 'bg-red-600' },
                { name: 'Severe', cls: 'bg-rose-900' },
              ].map((band) => (
                <div key={band.name} className="space-y-1">
                  <div
                    className={`h-2 rounded-sm ${band.cls} ${
                      airQuality.category === band.name ? 'ring-2 ring-offset-1 ring-slate-900' : 'opacity-45'
                    }`}
                  />
                  <p className="text-[11px] text-slate-500 truncate">{band.name}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-5">
                <span className="inline-flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-slate-400" />
                  <span className="font-mono-num font-medium text-slate-800">
                    {airQuality.weather.temperatureC !== null
                      ? `${airQuality.weather.temperatureC} °C`
                      : 'N/A'}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-slate-400" />
                  <span className="font-mono-num font-medium text-slate-800">
                    {airQuality.weather.humidityPct !== null
                      ? `${airQuality.weather.humidityPct}% Humidity`
                      : 'N/A'}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-slate-400" />
                  <span className="font-mono-num font-medium text-slate-800">
                    {airQuality.weather.windSpeedKmh !== null
                      ? `${airQuality.weather.windSpeedKmh} km/h`
                      : 'N/A'}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-slate-400" />
                  <span className="font-mono-num font-medium text-slate-800">
                    {airQuality.weather.windCompass}
                  </span>
                </span>
              </div>
              <span className="text-slate-500">{airQuality.sourceAttribution}</span>
            </div>
          </div>
        </section>

        {/* Right Column: Top 3 Actions + Family Exposure Score */}
        <section className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-teal-800">
                  Family Exposure Score · {familyCount} {familyCount === 1 ? 'member' : 'members'}
                </p>
                <h2 className="font-display text-lg font-semibold text-slate-900 mt-0.5">
                  Top 3 Actions for Your Family Today
                </h2>
              </div>
              {exposure && (
                <div className="text-right shrink-0">
                  <div className="font-mono-num text-2xl font-bold text-slate-900">
                    {exposure.overallScore}
                    <span className="text-xs font-normal text-slate-500">/100</span>
                  </div>
                  <p className="text-xs font-medium text-slate-600">{exposure.band} Exposure</p>
                </div>
              )}
            </div>

            <ol className="mt-4 space-y-3">
              {(exposure?.topThreeActions ?? []).map((action, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-b-0"
                >
                  <span className="font-mono-num text-xs font-semibold text-teal-800 bg-teal-50 w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5">
                    0{idx + 1}
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed">{action}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
            <p className="text-[11px] text-slate-500">
              {exposure?.disclaimer ||
                'Informational estimate based on local AQI and family profile—not a medical risk score.'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('routine')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
              >
                Generate AI Daily Routine
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('family')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                Manage Family ({familyCount})
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Pollutant Breakdown Grid */}
      <section aria-label="Measured air pollutants">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Pollutant Concentrations
          </h2>
          <p className="text-xs text-slate-500">{airQuality.standardComparisonNote}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {pollutantCards.map((item) => (
            <div
              key={item.label}
              className="bg-white border border-slate-200 rounded-xl p-4"
            >
              <p className="text-xs font-medium text-slate-500">{item.label}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-mono-num text-2xl font-bold text-slate-900">
                  {item.value !== null ? item.value : '—'}
                </span>
                <span className="text-xs text-slate-500">{item.unit}</span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 truncate">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 24-Hour Pollution Trend Chart */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              24-Hour Pollution Trend (Indian CPCB AQI & PM2.5)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hourly trajectory across the last 24 hours in {airQuality.city}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('outdoor')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-900 whitespace-nowrap"
          >
            View Next 24h Outdoor Windows
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={airQuality.history24h}
              margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
            >
              <defs>
                <linearGradient id="cpcbTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={style.chartFill} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={style.chartFill} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748B' }}
                interval={3}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="cpcbAqi"
                name="CPCB AQI"
                stroke={style.chartStroke}
                strokeWidth={2.2}
                fill="url(#cpcbTrendGrad)"
              />
              <Area
                type="monotone"
                dataKey="pm25"
                name="PM2.5 (µg/m³)"
                stroke="#0F766E"
                strokeWidth={1.6}
                fill="transparent"
                strokeDasharray="4 3"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Quick Action Strip to Outdoor & Indoor Protection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Smart Outdoor Window</p>
            <p className="font-display font-semibold text-base text-slate-900 mt-1">
              {airQuality.outdoorWindows[0]?.windowLabel ?? 'Check forecast'}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {airQuality.outdoorWindows[0]?.suitability} · Est.{' '}
              <span className="font-mono-num">{airQuality.outdoorWindows[0]?.avgAqi ?? '—'}</span> CPCB AQI
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('outdoor')}
            className="px-3.5 py-2 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Outdoor Planner
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Ask BreatheWise AI</p>
            <p className="font-display font-semibold text-base text-slate-900 mt-1">
              Should we open windows or go out?
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Contextual advice grounded in {airQuality.city} readings and your family profile
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('assistant')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-teal-700" />
            Ask AI
          </button>
        </div>
      </div>
    </div>
  );
}
