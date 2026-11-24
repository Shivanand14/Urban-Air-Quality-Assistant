import React, { useState } from 'react';
import { CheckCircle2, Circle, Home, ShieldCheck } from 'lucide-react';
import type { AirQualitySnapshot } from '../types/breathewise.ts';
import { DAILY_INDOOR_HABITS, ROOM_GUIDES, type RoomId } from '../data/indoorAndEducation.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface IndoorAirHacksViewProps {
  airQuality: AirQualitySnapshot | null;
  checklistMap: Record<string, boolean>;
  onToggleChecklist: (room: string, itemKey: string, completed: boolean) => Promise<void>;
}

export function IndoorAirHacksView({
  airQuality,
  checklistMap,
  onToggleChecklist,
}: IndoorAirHacksViewProps) {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<RoomId>('bedroom');
  const [imgFailed, setImgFailed] = useState(false);

  const activeGuide = ROOM_GUIDES.find((r) => r.id === selectedRoom) ?? ROOM_GUIDES[0];
  const currentAqi = airQuality?.cpcbAqi ?? 180;
  const shouldCloseWindows = currentAqi > 120;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Indoor Air Quality Coach
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Practical, room-by-room actions to keep indoor PM2.5, cooking aerosols, and dust low during urban pollution episodes.
        </p>
      </div>

      {/* Top Recommendation Banner + Editorial Photo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-teal-800">
              Window & Filtration Verdict · {airQuality?.city ?? 'Your Home'} ({currentAqi} CPCB AQI)
            </p>
            <h2 className="font-display text-xl font-bold text-slate-900 mt-1">
              {shouldCloseWindows
                ? 'Keep External Windows Closed & Filter Indoor Air'
                : 'Brief Cross-Ventilation Permitted Away from Peak Traffic'}
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {shouldCloseWindows
                ? `Outdoor CPCB AQI is currently ${currentAqi} (${airQuality?.category ?? 'Elevated'}). Opening windows now pulls fine PM2.5 indoors. Keep balcony doors latched, run an appropriately sized True HEPA purifier, and wait for a midday dip before brief airing.`
                : `Outdoor air is currently ${currentAqi} (${airQuality?.category ?? 'Satisfactory'}). You can open cross-windows for 15–20 minutes to clear stale indoor CO2, then close them before evening traffic builds.`}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              Core Indoor Air Safeguards
            </p>
            <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
              {DAILY_INDOOR_HABITS.map((habit, idx) => (
                <li key={idx}>{habit}</li>
              ))}
            </ul>
          </div>
        </section>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          {!imgFailed ? (
            <img
              src="/src/assets/images/edu_hepa_airflow_1795508028103.jpg"
              alt="Modern urban apartment living room with a True HEPA air purifier and sealed glass balcony doors"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-56 lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-56 lg:h-full bg-gradient-to-br from-slate-100 to-teal-50 flex flex-col items-center justify-center p-6 text-center">
              <Home className="w-8 h-8 text-teal-700 mb-2" />
              <p className="text-sm font-semibold text-slate-800">True HEPA Clean-Air Zone</p>
              <p className="text-xs text-slate-500 mt-1">
                Mechanical HEPA + carbon filtration without ozone generation
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Room-Wise Tabs & Interactive Checklist */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {ROOM_GUIDES.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoom(room.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedRoom === room.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {room.name}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500">
            {user
              ? 'Checklist progress saved to your PostgreSQL account'
              : 'Sign in with Google to persist daily checklist progress'}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-3">
            <p className="text-xs font-medium text-teal-800">{activeGuide.focus}</p>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              {activeGuide.name} Optimization
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600 list-disc pl-4 leading-relaxed">
              {activeGuide.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6">
            <h4 className="text-xs font-semibold text-slate-800 mb-3">
              Daily {activeGuide.name} Checklist
            </h4>
            <div className="space-y-2">
              {activeGuide.checklist.map((item) => {
                const mapKey = `${activeGuide.id}:${item.key}`;
                const checked = Boolean(checklistMap[mapKey]);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      onToggleChecklist(activeGuide.id, item.key, !checked)
                    }
                    className={`w-full text-left p-3.5 rounded-lg border transition-colors flex items-start gap-3 ${
                      checked
                        ? 'bg-teal-50/60 border-teal-200'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    {checked ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          checked ? 'text-teal-950 line-through' : 'text-slate-900'
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
