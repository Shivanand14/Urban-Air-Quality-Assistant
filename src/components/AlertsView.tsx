import React, { useState } from 'react';
import { Bell, Check, Info } from 'lucide-react';
import type { AirQualitySnapshot, AlertItem } from '../types/breathewise.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface AlertsViewProps {
  airQuality: AirQualitySnapshot | null;
  alerts: AlertItem[];
  threshold: number;
  notificationsEnabled: boolean;
  onUpdatePreferences: (prefs: {
    aqiThreshold?: number;
    notificationsEnabled?: boolean;
  }) => Promise<void>;
  onMarkRead: (id: number) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

const THRESHOLD_PRESETS = [
  { value: 101, label: '101 · Moderate+' },
  { value: 201, label: '201 · Poor+ (Recommended)' },
  { value: 301, label: '301 · Very Poor+' },
  { value: 401, label: '401 · Severe' },
];

export function AlertsView({
  airQuality,
  alerts,
  threshold,
  notificationsEnabled,
  onUpdatePreferences,
  onMarkRead,
  onMarkAllRead,
}: AlertsViewProps) {
  const { user, signInWithGoogle } = useAuth();
  const [browserPermission, setBrowserPermission] = useState<string>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return window.Notification.permission;
  });
  const [permissionNote, setPermissionNote] = useState<string | null>(null);

  const handleRequestBrowserPush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setBrowserPermission('unsupported');
      setPermissionNote(
        'Browser push notifications are unavailable in this environment. In-app alerts remain active whenever pollution crosses your threshold.'
      );
      return;
    }

    try {
      const result = await window.Notification.requestPermission();
      setBrowserPermission(result);
      if (result === 'granted') {
        setPermissionNote('Browser notifications enabled for this session alongside in-app alerts.');
      } else {
        setPermissionNote(
          'Browser push permission was declined or blocked by the embedded preview frame. In-app alerts remain active.'
        );
      }
    } catch {
      setPermissionNote(
        'Push notifications cannot be registered inside an embedded preview iframe. In-app pollution alerts are active and stored in your alert history.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Pollution Alerts & Threshold Preferences
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Automatic warnings when CPCB AQI enters Poor or worse, spikes sharply, or affects planned outdoor routines.
          </p>
        </div>

        {alerts.some((a) => !a.isRead) && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap"
          >
            <Check className="w-3.5 h-3.5" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Preferences Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Custom AQI Alert Threshold
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Trigger an alert whenever {airQuality?.city ?? 'your selected city'} reaches or exceeds this Indian CPCB AQI level.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) =>
                onUpdatePreferences({ notificationsEnabled: e.target.checked })
              }
              className="w-4 h-4 accent-teal-700 rounded"
            />
            In-App Alerts Enabled
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {THRESHOLD_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onUpdatePreferences({ aqiThreshold: preset.value })}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                threshold === preset.value
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2 text-xs text-slate-600 max-w-xl">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              {permissionNote ||
                `Browser Notification status: ${browserPermission}. Note: Background Web Push requires a standalone browser origin; in-app alert monitoring runs automatically while using BreatheWise AI.`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRequestBrowserPush}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
          >
            Check Browser Notification Permission
          </button>
        </div>

        {!user && (
          <p className="text-xs text-teal-800">
            <button
              type="button"
              onClick={signInWithGoogle}
              className="font-semibold underline hover:text-teal-950"
            >
              Sign in with Google
            </button>{' '}
            to save your threshold preferences and alert history to PostgreSQL.
          </p>
        )}
      </section>

      {/* Alert History */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-display text-base font-semibold text-slate-900 mb-4">
          Alert History
        </h2>

        {alerts.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            <Bell className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            No pollution alerts triggered yet below your {threshold} CPCB AQI threshold. Try switching to “Simulate Severe Smog (Demo)” in the top toolbar to see proactive alerting in action.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`py-4 flex flex-wrap items-start justify-between gap-4 ${
                  alert.isRead ? 'opacity-70' : ''
                }`}
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-orange-800">{alert.severity}</span>
                    <span aria-hidden="true">·</span>
                    <span>{alert.city}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num">{alert.aqiValue} CPCB AQI</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num">
                      {new Intl.DateTimeFormat('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'Asia/Kolkata',
                      }).format(new Date(alert.createdAt))}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{alert.message}</p>
                </div>

                {!alert.isRead && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(alert.id)}
                    className="px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg whitespace-nowrap"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
