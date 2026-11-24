import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar, type NavTabId } from './components/Sidebar.tsx';
import { TopBar } from './components/TopBar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { FamilyHealthView } from './components/FamilyHealthView.tsx';
import { OutdoorPlannerView } from './components/OutdoorPlannerView.tsx';
import { IndoorAirHacksView } from './components/IndoorAirHacksView.tsx';
import { DailyRoutineView } from './components/DailyRoutineView.tsx';
import { AiAssistantView } from './components/AiAssistantView.tsx';
import { AlertsView } from './components/AlertsView.tsx';
import { LearnHubView } from './components/LearnHubView.tsx';
import { INDIAN_CITIES } from './services/airQualityService.ts';
import type {
  AirQualitySnapshot,
  AlertItem,
  CityOption,
  FamilyMemberProfile,
  GeneratedRoutineResponse,
  HouseholdExposureSummary,
  SimulationScenario,
} from './types/breathewise.ts';

const TAB_TITLES: Record<NavTabId, string> = {
  dashboard: 'Air Quality Dashboard',
  family: 'Family Health',
  outdoor: 'Outdoor Activity Planner',
  indoor: 'Indoor Air Hacks',
  routine: 'AI Daily Routine',
  assistant: 'Ask BreatheWise AI',
  alerts: 'Pollution Alerts',
  learn: 'Education Hub',
};

function BreatheWiseWorkspace() {
  const { user, getToken } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedCity, setSelectedCity] = useState<CityOption>(INDIAN_CITIES[0]);
  const [scenario, setScenario] = useState<SimulationScenario>('live');
  const [airQuality, setAirQuality] = useState<AirQualitySnapshot | null>(null);
  const [aqLoading, setAqLoading] = useState(true);
  const [aqError, setAqError] = useState<string | null>(null);

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [familyMembers, setFamilyMembers] = useState<FamilyMemberProfile[]>([]);
  const [exposure, setExposure] = useState<HouseholdExposureSummary | null>(null);

  const [routine, setRoutine] = useState<GeneratedRoutineResponse | null>(null);
  const [savedRoutines, setSavedRoutines] = useState<
    Array<{
      id: number;
      city: string;
      aqiValue: number;
      aqiCategory: string;
      sourceMode: string;
      summary: string;
      createdAt: string;
    }>
  >([]);
  const [routineGenerating, setRoutineGenerating] = useState(false);
  const [routineError, setRoutineError] = useState<string | null>(null);

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [aqiThreshold, setAqiThreshold] = useState(201);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [toastAlert, setToastAlert] = useState<AlertItem | null>(null);

  const [checklistMap, setChecklistMap] = useState<Record<string, boolean>>({});

  const lastAlertKeyRef = useRef<string>('');
  const localIdCounterRef = useRef(1);

  // Fetch Air Quality whenever city or scenario changes
  const loadAirQuality = useCallback(
    async (city: CityOption, activeScenario: SimulationScenario) => {
      setAqLoading(true);
      setAqError(null);
      try {
        const qs = new URLSearchParams({
          lat: String(city.lat),
          lon: String(city.lon),
          city: city.name,
          state: city.state,
          scenario: activeScenario,
        });
        const res = await fetch(`/api/air-quality?${qs.toString()}`);
        if (!res.ok) {
          throw new Error(`Unable to fetch air quality (${res.status})`);
        }
        const data = (await res.json()) as AirQualitySnapshot;
        setAirQuality(data);
      } catch (error) {
        setAqError(
          error instanceof Error
            ? error.message
            : 'Unable to load air quality data right now.'
        );
      } finally {
        setAqLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAirQuality(selectedCity, scenario);
  }, [selectedCity, scenario, loadAirQuality]);

  // Recompute household exposure when airQuality or familyMembers change
  useEffect(() => {
    if (!airQuality) return;
    let cancelled = false;

    fetch('/api/exposure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ airQuality, familyMembers }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: HouseholdExposureSummary | null) => {
        if (!cancelled && data) setExposure(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [airQuality, familyMembers]);

  // Bootstrap PostgreSQL account data when signed in
  useEffect(() => {
    if (!user) {
      return;
    }
    let cancelled = false;

    (async () => {
      const token = await getToken();
      if (!token || cancelled) return;

      try {
        const res = await fetch('/api/user/bootstrap', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;

        const data = (await res.json()) as {
          user: {
            selectedCity: string;
            selectedLat: number;
            selectedLon: number;
            aqiThreshold: number;
            notificationsEnabled: boolean;
          };
          familyMembers: FamilyMemberProfile[];
          savedRoutines: Array<{
            id: number;
            city: string;
            aqiValue: number;
            aqiCategory: string;
            sourceMode: string;
            morningJson: string;
            afternoonJson: string;
            eveningJson: string;
            nightJson: string;
            summary: string;
            createdAt: string;
          }>;
          alerts: AlertItem[];
          checklists: Array<{ room: string; itemKey: string; completed: boolean }>;
        };

        if (cancelled) return;
        setAqiThreshold(data.user.aqiThreshold);
        setNotificationsEnabled(data.user.notificationsEnabled);
        setFamilyMembers(data.familyMembers ?? []);
        setAlerts(data.alerts ?? []);

        const nextChecklist: Record<string, boolean> = {};
        for (const item of data.checklists ?? []) {
          nextChecklist[`${item.room}:${item.itemKey}`] = item.completed;
        }
        setChecklistMap(nextChecklist);

        if (data.savedRoutines && data.savedRoutines.length > 0) {
          setSavedRoutines(data.savedRoutines);
          const latest = data.savedRoutines[0];
          try {
            setRoutine({
              id: latest.id,
              city: latest.city,
              aqiValue: latest.aqiValue,
              aqiCategory: latest.aqiCategory as GeneratedRoutineResponse['aqiCategory'],
              sourceMode: latest.sourceMode as 'gemini' | 'rule-based',
              modelLabel:
                latest.sourceMode === 'gemini'
                  ? 'Gemini AI (Saved)'
                  : 'Rule-Based Safety Engine (Saved)',
              summary: latest.summary,
              topThreeActions: [],
              routine: {
                morning: JSON.parse(latest.morningJson) as string[],
                afternoon: JSON.parse(latest.afternoonJson) as string[],
                evening: JSON.parse(latest.eveningJson) as string[],
                night: JSON.parse(latest.nightJson) as string[],
              },
              memberAdvice: [],
              createdAt: latest.createdAt,
            });
          } catch {
            // ignore malformed JSON
          }
        }

        if (data.user.selectedCity) {
          setSelectedCity({
            name: data.user.selectedCity,
            state: 'Saved Location',
            country: 'India',
            lat: data.user.selectedLat,
            lon: data.user.selectedLon,
          });
        }
      } catch (err) {
        console.error('Bootstrap error:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, getToken]);

  // Proactive alert trigger whenever AQI crosses threshold
  useEffect(() => {
    if (!airQuality || !notificationsEnabled) return;

    const effectiveTrigger = Math.min(aqiThreshold, 201);
    const severeForecast = airQuality.forecast24h.some((p) => p.cpcbAqi >= 350);
    const shouldAlert =
      airQuality.cpcbAqi >= effectiveTrigger ||
      airQuality.cpcbAqi >= aqiThreshold ||
      severeForecast;

    if (!shouldAlert) return;

    const dedupeKey = `${airQuality.city}:${airQuality.cpcbAqi}:${airQuality.dataMode}:${aqiThreshold}`;
    if (lastAlertKeyRef.current === dedupeKey) return;
    lastAlertKeyRef.current = dedupeKey;

    const severity =
      airQuality.cpcbAqi >= 401
        ? 'Severe'
        : airQuality.cpcbAqi >= 301
        ? 'Very Poor'
        : airQuality.cpcbAqi >= 201
        ? 'Poor'
        : 'Adverse Forecast';

    const title =
      airQuality.cpcbAqi >= aqiThreshold
        ? `${airQuality.city} reached ${airQuality.cpcbAqi} CPCB AQI (${airQuality.category})`
        : `Severe smog forecast ahead in ${airQuality.city}`;

    const message =
      airQuality.cpcbAqi >= 301
        ? 'Outdoor air is Very Poor/Severe. Keep windows closed, postpone outdoor exercise, and run indoor HEPA filtration.'
        : 'Air quality crossed your alert threshold. Review your Outdoor Planner and switch high-exertion routines indoors.';

    const createAndStoreAlert = async () => {
      if (user) {
        const token = await getToken();
        if (token) {
          try {
            const res = await fetch('/api/alerts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                city: airQuality.city,
                aqiValue: airQuality.cpcbAqi,
                severity,
                title,
                message,
              }),
            });
            if (res.ok) {
              const data = (await res.json()) as { alert: AlertItem };
              setAlerts((prev) => [data.alert, ...prev]);
              setToastAlert(data.alert);
              return;
            }
          } catch {
            // fall through to local session alert
          }
        }
      }

      const localAlert: AlertItem = {
        id: localIdCounterRef.current++,
        city: airQuality.city,
        aqiValue: airQuality.cpcbAqi,
        severity,
        title,
        message,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setAlerts((prev) => [localAlert, ...prev]);
      setToastAlert(localAlert);
    };

    createAndStoreAlert();
  }, [airQuality, aqiThreshold, notificationsEnabled, user, getToken]);

  const handleSelectCity = async (city: CityOption) => {
    setGeoError(null);
    setSelectedCity(city);
    if (user) {
      const token = await getToken();
      if (token) {
        fetch('/api/user/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            selectedCity: city.name,
            selectedLat: city.lat,
            selectedLon: city.lon,
          }),
        }).catch(() => {});
      }
    }
  };

  const handleUseGeolocation = () => {
    setGeoError(null);
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported in this browser. Search or pick a city instead.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const city: CityOption = {
          name: 'Current Location',
          state: `${pos.coords.latitude.toFixed(2)}°N, ${pos.coords.longitude.toFixed(2)}°E`,
          country: '',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        handleSelectCity(city);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(
            'Location permission declined. Showing selected city—choose any city manually anytime.'
          );
        } else {
          setGeoError('Unable to detect GPS coordinates right now. Select a city manually.');
        }
      },
      { timeout: 8000 }
    );
  };

  const handleAddMember = async (member: Omit<FamilyMemberProfile, 'id'>) => {
    if (user) {
      const token = await getToken();
      if (token) {
        const res = await fetch('/api/family', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(member),
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error || 'Failed to save family member.');
        }
        const data = (await res.json()) as { member: FamilyMemberProfile };
        setFamilyMembers((prev) => [...prev, data.member]);
        return;
      }
    }

    setFamilyMembers((prev) => [
      ...prev,
      { id: localIdCounterRef.current++, ...member },
    ]);
  };

  const handleUpdateMember = async (
    id: number,
    member: Omit<FamilyMemberProfile, 'id'>
  ) => {
    if (user) {
      const token = await getToken();
      if (token) {
        const res = await fetch(`/api/family/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(member),
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error || 'Failed to update family member.');
        }
        const data = (await res.json()) as { member: FamilyMemberProfile };
        setFamilyMembers((prev) => prev.map((m) => (m.id === id ? data.member : m)));
        return;
      }
    }

    setFamilyMembers((prev) =>
      prev.map((m) => (m.id === id ? { id, ...member } : m))
    );
  };

  const handleDeleteMember = async (id: number) => {
    if (user) {
      const token = await getToken();
      if (token) {
        const res = await fetch(`/api/family/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
          return;
        }
      }
    }
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleGenerateRoutine = async () => {
    if (!airQuality) return;
    setRoutineGenerating(true);
    setRoutineError(null);

    try {
      const token = user ? await getToken() : null;
      const endpoint = token ? '/api/routines/generate' : '/api/ai/routine/preview';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ airQuality, familyMembers }),
      });

      const data = (await res.json()) as GeneratedRoutineResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Unable to generate routine.');
      }

      setRoutine(data);
      if (token && data.id) {
        setSavedRoutines((prev) => [
          {
            id: data.id!,
            city: data.city,
            aqiValue: data.aqiValue,
            aqiCategory: data.aqiCategory,
            sourceMode: data.sourceMode,
            summary: data.summary,
            createdAt: data.createdAt || new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch (error) {
      setRoutineError(
        error instanceof Error ? error.message : 'Unable to generate daily routine.'
      );
    } finally {
      setRoutineGenerating(false);
    }
  };

  const handleUpdateAlertPrefs = async (prefs: {
    aqiThreshold?: number;
    notificationsEnabled?: boolean;
  }) => {
    if (prefs.aqiThreshold !== undefined) setAqiThreshold(prefs.aqiThreshold);
    if (prefs.notificationsEnabled !== undefined) {
      setNotificationsEnabled(prefs.notificationsEnabled);
    }

    if (user) {
      const token = await getToken();
      if (token) {
        await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(prefs),
        });
      }
    }
  };

  const handleMarkAlertRead = async (id: number) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
    if (user) {
      const token = await getToken();
      if (token) {
        await fetch(`/api/alerts/${id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
  };

  const handleMarkAllAlertsRead = async () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    if (user) {
      const token = await getToken();
      if (token) {
        await fetch('/api/alerts/read-all', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
  };

  const handleToggleChecklist = async (
    room: string,
    itemKey: string,
    completed: boolean
  ) => {
    setChecklistMap((prev) => ({ ...prev, [`${room}:${itemKey}`]: completed }));
    if (user) {
      const token = await getToken();
      if (token) {
        await fetch('/api/checklists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ room, itemKey, completed }),
        });
      }
    }
  };

  const unreadAlertsCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="min-h-screen flex bg-[#F7F9FB] text-slate-900">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unreadAlertsCount={unreadAlertsCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activeTitle={TAB_TITLES[activeTab]}
          selectedCity={selectedCity}
          onSelectCity={handleSelectCity}
          onUseGeolocation={handleUseGeolocation}
          geoLoading={geoLoading}
          geoError={geoError}
          scenario={scenario}
          onToggleScenario={setScenario}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Proactive In-App Pollution Alert Banner */}
        {toastAlert && (
          <div className="px-4 lg:px-8 pt-4">
            <div className="max-w-6xl mx-auto bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-orange-800 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-orange-950">
                    {toastAlert.severity} Pollution Alert · {toastAlert.title}
                  </p>
                  <p className="text-xs text-orange-900 mt-0.5">{toastAlert.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('alerts');
                    setToastAlert(null);
                  }}
                  className="text-xs font-semibold text-orange-900 underline whitespace-nowrap"
                >
                  Manage Alerts
                </button>
                <button
                  type="button"
                  onClick={() => setToastAlert(null)}
                  aria-label="Dismiss alert"
                  className="p-1 text-orange-700 hover:text-orange-950"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                airQuality={airQuality}
                loading={aqLoading}
                error={aqError}
                exposure={exposure}
                familyCount={familyMembers.length}
                onRefresh={() => loadAirQuality(selectedCity, scenario)}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'family' && (
              <FamilyHealthView
                airQuality={airQuality}
                familyMembers={familyMembers}
                exposure={exposure}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
              />
            )}

            {activeTab === 'outdoor' && (
              <OutdoorPlannerView airQuality={airQuality} />
            )}

            {activeTab === 'indoor' && (
              <IndoorAirHacksView
                airQuality={airQuality}
                checklistMap={checklistMap}
                onToggleChecklist={handleToggleChecklist}
              />
            )}

            {activeTab === 'routine' && (
              <DailyRoutineView
                airQuality={airQuality}
                familyMembers={familyMembers}
                routine={routine}
                savedRoutines={savedRoutines}
                generating={routineGenerating}
                error={routineError}
                onGenerate={handleGenerateRoutine}
              />
            )}

            {activeTab === 'assistant' && (
              <AiAssistantView
                airQuality={airQuality}
                familyMembers={familyMembers}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsView
                airQuality={airQuality}
                alerts={alerts}
                threshold={aqiThreshold}
                notificationsEnabled={notificationsEnabled}
                onUpdatePreferences={handleUpdateAlertPrefs}
                onMarkRead={handleMarkAlertRead}
                onMarkAllRead={handleMarkAllAlertsRead}
              />
            )}

            {activeTab === 'learn' && <LearnHubView />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BreatheWiseWorkspace />
    </AuthProvider>
  );
}
