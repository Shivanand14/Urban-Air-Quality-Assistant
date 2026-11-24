import React from 'react';
import { Moon, RefreshCw, Sun, Sunrise, Sunset } from 'lucide-react';
import type {
  AirQualitySnapshot,
  FamilyMemberProfile,
  GeneratedRoutineResponse,
} from '../types/breathewise.ts';

interface DailyRoutineViewProps {
  airQuality: AirQualitySnapshot | null;
  familyMembers: FamilyMemberProfile[];
  routine: GeneratedRoutineResponse | null;
  savedRoutines: Array<{
    id: number;
    city: string;
    aqiValue: number;
    aqiCategory: string;
    sourceMode: string;
    summary: string;
    createdAt: string;
  }>;
  generating: boolean;
  error: string | null;
  onGenerate: () => Promise<void>;
}

export function DailyRoutineView({
  airQuality,
  familyMembers,
  routine,
  savedRoutines,
  generating,
  error,
  onGenerate,
}: DailyRoutineViewProps) {
  const blocks = routine
    ? [
        {
          id: 'morning',
          title: 'Morning',
          window: '6:00 AM – 11:30 AM',
          icon: Sunrise,
          items: routine.routine.morning,
        },
        {
          id: 'afternoon',
          title: 'Afternoon',
          window: '12:00 PM – 4:30 PM',
          icon: Sun,
          items: routine.routine.afternoon,
        },
        {
          id: 'evening',
          title: 'Evening',
          window: '5:00 PM – 8:30 PM',
          icon: Sunset,
          items: routine.routine.evening,
        },
        {
          id: 'night',
          title: 'Night',
          window: '9:00 PM – Bedtime',
          icon: Moon,
          items: routine.routine.night,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            AI Daily Family Routine Generator
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Converts {airQuality?.city ?? 'your city'} AQI ({airQuality?.cpcbAqi ?? '—'} CPCB), weather, and {familyMembers.length} family {familyMembers.length === 1 ? 'profile' : 'profiles'} into a morning-to-night protection plan.
          </p>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={generating || !airQuality}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          {generating
            ? 'Generating Routine...'
            : routine
            ? 'Regenerate Routine'
            : 'Generate Daily Routine'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-900">
          {error}
        </div>
      )}

      {!routine ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <h2 className="font-display font-semibold text-lg text-slate-900">
            Ready to build today’s family schedule
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto">
            Click <strong>Generate Daily Routine</strong> to create personalized Morning, Afternoon, Evening, and Night steps based on current CPCB AQI and your household members.
          </p>
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating || !airQuality}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg"
          >
            Generate Today’s Routine
          </button>
        </div>
      ) : (
        <>
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                {routine.city} · <span className="font-mono-num">{routine.aqiValue}</span> CPCB AQI ({routine.aqiCategory})
              </span>
              <span>Engine: {routine.modelLabel}</span>
            </div>
            <p className="mt-3 text-sm text-slate-800 leading-relaxed">{routine.summary}</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blocks.map((block) => {
              const Icon = block.icon;
              return (
                <section
                  key={block.id}
                  className="bg-white border border-slate-200 rounded-xl p-5"
                >
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-teal-700" />
                      <h2 className="font-display font-semibold text-base text-slate-900">
                        {block.title}
                      </h2>
                    </div>
                    <span className="font-mono-num text-xs text-slate-500">{block.window}</span>
                  </div>
                  <ul className="mt-3 space-y-2.5 text-sm text-slate-700 leading-relaxed list-disc pl-4">
                    {block.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          {routine.memberAdvice.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="font-display text-base font-semibold text-slate-900 mb-3">
                Member-Specific Daily Notes
              </h2>
              <div className="divide-y divide-slate-100">
                {routine.memberAdvice.map((item, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.guidance}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {savedRoutines.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-semibold text-slate-900 mb-3">
            Saved Routine History
          </h2>
          <div className="divide-y divide-slate-100">
            {savedRoutines.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-900">{item.city}</span>
                  <span className="text-slate-500">
                    {' '}
                    · <span className="font-mono-num">{item.aqiValue}</span> AQI ({item.aqiCategory}) · {item.sourceMode}
                  </span>
                  <p className="text-slate-600 mt-0.5 max-w-2xl">{item.summary}</p>
                </div>
                <span className="font-mono-num text-slate-400">
                  {new Intl.DateTimeFormat('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'Asia/Kolkata',
                  }).format(new Date(item.createdAt))}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
