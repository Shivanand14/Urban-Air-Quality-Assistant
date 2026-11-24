import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  LocateFixed,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Search,
} from 'lucide-react';
import type { CityOption, SimulationScenario } from '../types/breathewise.ts';
import { INDIAN_CITIES } from '../services/airQualityService.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface TopBarProps {
  activeTitle: string;
  selectedCity: CityOption;
  onSelectCity: (city: CityOption) => void;
  onUseGeolocation: () => void;
  geoLoading: boolean;
  geoError: string | null;
  scenario: SimulationScenario;
  onToggleScenario: (scenario: SimulationScenario) => void;
  onOpenMobileMenu: () => void;
}

export function TopBar({
  activeTitle,
  selectedCity,
  onSelectCity,
  onUseGeolocation,
  geoLoading,
  geoError,
  scenario,
  onToggleScenario,
  onOpenMobileMenu,
}: TopBarProps) {
  const { user, loading: authLoading, signInWithGoogle, signOutUser, authError } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityOption[]>(INDIAN_CITIES);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(INDIAN_CITIES);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/cities/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = (await res.json()) as { cities?: CityOption[] };
          setResults(data.cities ?? INDIAN_CITIES);
        }
      } catch {
        setResults(
          INDIAN_CITIES.filter((c) =>
            c.name.toLowerCase().includes(trimmed.toLowerCase())
          )
        );
      } finally {
        setSearching(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-semibold text-base text-slate-900 truncate">
            {activeTitle}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0" ref={dropdownRef}>
          {/* Location Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
              <span className="max-w-[140px] sm:max-w-[200px] truncate">
                {selectedCity.name}
              </span>
            </button>

            {searchOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-40 p-3">
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Indian or global city..."
                    autoFocus
                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      onUseGeolocation();
                      setSearchOpen(false);
                    }}
                    disabled={geoLoading}
                    className="flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-900 py-1 px-2 rounded hover:bg-teal-50 transition-colors whitespace-nowrap"
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    {geoLoading ? 'Locating...' : 'Use Current Location'}
                  </button>
                  <span className="text-xs text-slate-400">
                    {searching ? 'Searching...' : 'India-first presets'}
                  </span>
                </div>

                <ul className="mt-2 max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {results.length === 0 ? (
                    <li className="py-4 text-center text-xs text-slate-500">
                      No matching cities found. Try another spelling.
                    </li>
                  ) : (
                    results.map((city) => (
                      <li key={`${city.name}-${city.lat}-${city.lon}`}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCity(city);
                            setSearchOpen(false);
                            setQuery('');
                          }}
                          className="w-full text-left px-2.5 py-2 hover:bg-slate-50 rounded-md flex items-center justify-between gap-2 transition-colors"
                        >
                          <span className="text-sm font-medium text-slate-900 truncate">
                            {city.name}
                          </span>
                          <span className="text-xs text-slate-500 truncate">
                            {city.state}
                            {city.country && city.country !== 'India' ? `, ${city.country}` : ''}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Primary Auth CTA */}
          {!authLoading &&
            (user ? (
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-xs text-slate-600 max-w-[140px] truncate">
                  {user.displayName || user.email}
                </span>
                <button
                  type="button"
                  onClick={signOutUser}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            ))}
        </div>
      </div>

      {/* Sub-header Workspace Toolbar for Data Mode & Location Notices */}
      <div className="px-4 lg:px-8 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-slate-600">
          <span>Feed Mode:</span>
          <div className="inline-flex items-center bg-white border border-slate-200 rounded-md p-0.5">
            <button
              type="button"
              onClick={() => onToggleScenario('live')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                scenario === 'live'
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Atmospheric Feed
            </button>
            <button
              type="button"
              onClick={() => onToggleScenario('severe-demo')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                scenario === 'severe-demo'
                  ? 'bg-rose-800 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Simulate Severe Smog (Demo)
            </button>
          </div>
        </div>

        {(geoError || authError) && (
          <div className="flex items-center gap-1.5 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{geoError || authError}</span>
          </div>
        )}
      </div>
    </header>
  );
}
