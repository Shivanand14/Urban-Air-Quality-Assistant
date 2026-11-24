import type {
  AirQualitySnapshot,
  CityOption,
  CpcbCategory,
  HourlyAqiPoint,
  OutdoorWindowRecommendation,
  SimulationScenario,
} from '../types/breathewise.ts';

export const INDIAN_CITIES: CityOption[] = [
  { name: 'New Delhi', state: 'Delhi NCR', country: 'India', lat: 28.6139, lon: 77.209 },
  { name: 'Gurugram', state: 'Haryana', country: 'India', lat: 28.4595, lon: 77.0266 },
  { name: 'Noida', state: 'Uttar Pradesh', country: 'India', lat: 28.5355, lon: 77.391 },
  { name: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.076, lon: 72.8777 },
  { name: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lon: 77.5946 },
  { name: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5726, lon: 88.3639 },
  { name: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 13.0827, lon: 80.2707 },
  { name: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.385, lon: 78.4867 },
  { name: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lon: 73.8567 },
  { name: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0225, lon: 72.5714 },
  { name: 'Lucknow', state: 'Uttar Pradesh', country: 'India', lat: 26.8467, lon: 80.9462 },
  { name: 'Patna', state: 'Bihar', country: 'India', lat: 25.5941, lon: 85.1376 },
];

interface Breakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

const PM25_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
  { cLow: 30.1, cHigh: 60, iLow: 51, iHigh: 100 },
  { cLow: 60.1, cHigh: 90, iLow: 101, iHigh: 200 },
  { cLow: 90.1, cHigh: 120, iLow: 201, iHigh: 300 },
  { cLow: 120.1, cHigh: 250, iLow: 301, iHigh: 400 },
  { cLow: 250.1, cHigh: 500, iLow: 401, iHigh: 500 },
];

const PM10_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
  { cLow: 50.1, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 100.1, cHigh: 250, iLow: 101, iHigh: 200 },
  { cLow: 250.1, cHigh: 350, iLow: 201, iHigh: 300 },
  { cLow: 350.1, cHigh: 430, iLow: 301, iHigh: 400 },
  { cLow: 430.1, cHigh: 800, iLow: 401, iHigh: 500 },
];

const NO2_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
  { cLow: 40.1, cHigh: 80, iLow: 51, iHigh: 100 },
  { cLow: 80.1, cHigh: 180, iLow: 101, iHigh: 200 },
  { cLow: 180.1, cHigh: 280, iLow: 201, iHigh: 300 },
  { cLow: 280.1, cHigh: 400, iLow: 301, iHigh: 400 },
  { cLow: 400.1, cHigh: 800, iLow: 401, iHigh: 500 },
];

const O3_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
  { cLow: 50.1, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 100.1, cHigh: 168, iLow: 101, iHigh: 200 },
  { cLow: 168.1, cHigh: 208, iLow: 201, iHigh: 300 },
  { cLow: 208.1, cHigh: 748, iLow: 301, iHigh: 400 },
  { cLow: 748.1, cHigh: 1000, iLow: 401, iHigh: 500 },
];

const SO2_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
  { cLow: 40.1, cHigh: 80, iLow: 51, iHigh: 100 },
  { cLow: 80.1, cHigh: 380, iLow: 101, iHigh: 200 },
  { cLow: 380.1, cHigh: 800, iLow: 201, iHigh: 300 },
  { cLow: 800.1, cHigh: 1600, iLow: 301, iHigh: 400 },
  { cLow: 1600.1, cHigh: 2400, iLow: 401, iHigh: 500 },
];

// CPCB CO is in mg/m3 (Open-Meteo returns ug/m3; divide by 1000)
const CO_MG_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 1.0, iLow: 0, iHigh: 50 },
  { cLow: 1.01, cHigh: 2.0, iLow: 51, iHigh: 100 },
  { cLow: 2.01, cHigh: 10.0, iLow: 101, iHigh: 200 },
  { cLow: 10.01, cHigh: 17.0, iLow: 201, iHigh: 300 },
  { cLow: 17.01, cHigh: 34.0, iLow: 301, iHigh: 400 },
  { cLow: 34.01, cHigh: 60.0, iLow: 401, iHigh: 500 },
];

function computeSubIndex(value: number | null | undefined, breakpoints: Breakpoint[]): number {
  if (value === null || value === undefined || Number.isNaN(value) || value < 0) return 0;
  for (const bp of breakpoints) {
    if (value <= bp.cHigh) {
      const ratio = (value - bp.cLow) / Math.max(0.0001, bp.cHigh - bp.cLow);
      return Math.round(bp.iLow + ratio * (bp.iHigh - bp.iLow));
    }
  }
  return 500;
}

export function calculateIndianCpcbAqi(params: {
  pm25?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  coUg?: number | null;
  o3?: number | null;
}): { aqi: number; dominantPollutant: string } {
  const candidates: Array<{ name: string; subIndex: number }> = [
    { name: 'PM2.5', subIndex: computeSubIndex(params.pm25, PM25_BREAKPOINTS) },
    { name: 'PM10', subIndex: computeSubIndex(params.pm10, PM10_BREAKPOINTS) },
    { name: 'NO2', subIndex: computeSubIndex(params.no2, NO2_BREAKPOINTS) },
    { name: 'O3', subIndex: computeSubIndex(params.o3, O3_BREAKPOINTS) },
    { name: 'SO2', subIndex: computeSubIndex(params.so2, SO2_BREAKPOINTS) },
    {
      name: 'CO',
      subIndex: computeSubIndex(
        params.coUg !== null && params.coUg !== undefined ? params.coUg / 1000 : null,
        CO_MG_BREAKPOINTS
      ),
    },
  ];

  candidates.sort((a, b) => b.subIndex - a.subIndex);
  const top = candidates[0];
  return {
    aqi: Math.max(0, Math.min(500, top.subIndex)),
    dominantPollutant: top.subIndex > 0 ? top.name : 'PM2.5',
  };
}

export function getCpcbCategory(aqi: number): {
  category: CpcbCategory;
  description: string;
} {
  if (aqi <= 50) {
    return {
      category: 'Good',
      description: 'Minimal health impact. Comfortable for outdoor routines across all age groups.',
    };
  }
  if (aqi <= 100) {
    return {
      category: 'Satisfactory',
      description: 'Minor breathing discomfort possible only for unusually sensitive individuals.',
    };
  }
  if (aqi <= 200) {
    return {
      category: 'Moderate',
      description: 'Breathing discomfort possible for children, elderly adults, and people with asthma or heart conditions.',
    };
  }
  if (aqi <= 300) {
    return {
      category: 'Poor',
      description: 'Breathing discomfort on prolonged exposure for most people; sensitive groups should limit outdoor exertion.',
    };
  }
  if (aqi <= 400) {
    return {
      category: 'Very Poor',
      description: 'Respiratory illness risk on prolonged exposure. Keep windows closed during peak smog hours and avoid outdoor workouts.',
    };
  }
  return {
    category: 'Severe',
    description: 'Affects healthy individuals and poses serious risk to children, elderly adults, and respiratory patients. Stay indoors with filtered air.',
  };
}

function degreesToCompass(deg: number | null): string {
  if (deg === null || Number.isNaN(deg)) return 'N/A';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function formatIstTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(date) + ' IST';
}

function formatHourLabelIst(isoString: string): string {
  const dt = new Date(isoString);
  if (Number.isNaN(dt.getTime())) return isoString;
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(dt);
}

export function buildOutdoorWindows(
  forecast24h: HourlyAqiPoint[],
  isDemo: boolean
): OutdoorWindowRecommendation[] {
  if (!forecast24h.length) {
    return [
      {
        id: 'unavailable',
        activity: 'General Outdoor Activity',
        windowLabel: 'Forecast Unavailable',
        avgAqi: 0,
        category: 'Moderate',
        suitability: 'Caution Advised',
        guidance:
          'Hourly forecast data is unavailable right now. Avoid assuming conditions are safe; verify live readings before prolonged outdoor plans.',
        indoorAlternative: 'Indoor stretching, yoga, or supervised indoor play.',
      },
    ];
  }

  // Find best 2-hour contiguous window in next 24h
  let bestStartIdx = 0;
  let bestAvg = Infinity;
  for (let i = 0; i < Math.max(1, forecast24h.length - 1); i++) {
    const next = forecast24h[i + 1] ?? forecast24h[i];
    const avg = Math.round((forecast24h[i].cpcbAqi + next.cpcbAqi) / 2);
    if (avg < bestAvg) {
      bestAvg = avg;
      bestStartIdx = i;
    }
  }

  const bestStart = forecast24h[bestStartIdx];
  const bestEnd = forecast24h[Math.min(forecast24h.length - 1, bestStartIdx + 2)];
  const bestCat = getCpcbCategory(bestAvg).category;
  const bestSuitability: OutdoorWindowRecommendation['suitability'] =
    bestAvg <= 150
      ? 'Lower Exposure Window'
      : bestAvg <= 250
      ? 'Caution Advised'
      : 'Avoid Outdoors';

  const windowRange = `${bestStart.label} – ${bestEnd.label}`;

  // Morning commute window (look for 07:00-10:00 if present or earliest hours)
  const earlySlice = forecast24h.slice(0, Math.min(6, forecast24h.length));
  const earlyAvg = Math.round(
    earlySlice.reduce((sum, p) => sum + p.cpcbAqi, 0) / earlySlice.length
  );
  const earlyCat = getCpcbCategory(earlyAvg).category;

  const afternoonSlice = forecast24h.slice(
    Math.min(6, forecast24h.length - 1),
    Math.min(14, forecast24h.length)
  );
  const afternoonAvg = Math.round(
    afternoonSlice.reduce((sum, p) => sum + p.cpcbAqi, 0) /
      Math.max(1, afternoonSlice.length)
  );
  const afternoonCat = getCpcbCategory(afternoonAvg).category;

  const demoQualifier = isDemo ? ' (based on simulated demo forecast)' : '';

  return [
    {
      id: 'walk-jog',
      activity: 'Brisk Walking & Light Jogging',
      windowLabel: windowRange,
      avgAqi: bestAvg,
      category: bestCat,
      suitability: bestSuitability,
      guidance:
        bestAvg > 250
          ? `Even the lowest-pollution window (${windowRange}) averages ${bestAvg} CPCB AQI (${bestCat})${demoQualifier}. Postpone outdoor cardio and choose indoor movement.`
          : bestAvg > 150
          ? `Comparatively lower pollution expected around ${windowRange} (~${bestAvg} AQI, ${bestCat})${demoQualifier}. Keep intensity moderate and wear a well-fitted N95/KN95 if sensitive.`
          : `Lowest projected pollution window is ${windowRange} (~${bestAvg} AQI, ${bestCat})${demoQualifier}. Suitable for a light walk away from heavy traffic corridors.`,
      indoorAlternative: 'Indoor treadmill, stationary cycling, or 25-minute living-room mobility routine.',
    },
    {
      id: 'children-play',
      activity: "Children's Outdoor Play",
      windowLabel: afternoonSlice.length ? `${afternoonSlice[0].label} – ${afternoonSlice[afternoonSlice.length - 1].label}` : windowRange,
      avgAqi: afternoonAvg,
      category: afternoonCat,
      suitability:
        afternoonAvg <= 120
          ? 'Lower Exposure Window'
          : afternoonAvg <= 220
          ? 'Caution Advised'
          : 'Avoid Outdoors',
      guidance:
        afternoonAvg > 200
          ? `Projected AQI is ${afternoonAvg} (${afternoonCat})${demoQualifier}. Children breathe faster per body weight—move active play indoors with windows closed.`
          : `Midday thermal mixing brings projected AQI to ~${afternoonAvg} (${afternoonCat})${demoQualifier}. Keep outdoor play under 30–45 minutes in parks away from main roads.`,
      indoorAlternative: 'Indoor obstacle course, building blocks, dance games, or reading corner.',
    },
    {
      id: 'commute',
      activity: 'School & Office Commute',
      windowLabel: earlySlice.length ? `${earlySlice[0].label} – ${earlySlice[earlySlice.length - 1].label}` : 'Next 6 Hours',
      avgAqi: earlyAvg,
      category: earlyCat,
      suitability:
        earlyAvg <= 150
          ? 'Lower Exposure Window'
          : earlyAvg <= 250
          ? 'Caution Advised'
          : 'Avoid Outdoors',
      guidance:
        earlyAvg > 200
          ? `Near-term AQI averages ${earlyAvg} (${earlyCat})${demoQualifier}. Use car cabin recirculation mode, avoid open two-wheeler travel without an N95 mask, and pick tree-lined side streets.`
          : `Near-term AQI averages ${earlyAvg} (${earlyCat})${demoQualifier}. Prefer enclosed transit or less congested routes away from diesel arterial junctions.`,
      indoorAlternative: 'Remote work or carpool with AC set to internal air recirculation.',
    },
  ];
}

function buildDemoSnapshot(
  city: string,
  state: string,
  lat: number,
  lon: number,
  reason: string,
  severeMode: boolean
): AirQualitySnapshot {
  const now = new Date();
  const basePm25 = severeMode ? 268 : 114;
  const basePm10 = severeMode ? 395 : 188;

  const makePoint = (offsetHours: number): HourlyAqiPoint => {
    const dt = new Date(now.getTime() + offsetHours * 3600_000);
    const istHour = Number(
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      }).format(dt)
    );
    // Diurnal winter smog pattern: higher early morning/late night, lower mid-afternoon
    const diurnalFactor =
      istHour >= 13 && istHour <= 17
        ? 0.72
        : istHour >= 6 && istHour <= 9
        ? 1.18
        : istHour >= 21 || istHour <= 2
        ? 1.24
        : 0.96;

    const pm25 = Math.round(basePm25 * diurnalFactor);
    const pm10 = Math.round(basePm10 * diurnalFactor);
    const { aqi } = calculateIndianCpcbAqi({ pm25, pm10, no2: severeMode ? 94 : 52, o3: 38 });
    return {
      isoTime: dt.toISOString(),
      label: formatHourLabelIst(dt.toISOString()),
      cpcbAqi: aqi,
      pm25,
      pm10,
      category: getCpcbCategory(aqi).category,
    };
  };

  const history24h = Array.from({ length: 24 }, (_, idx) => makePoint(idx - 23));
  const forecast24h = Array.from({ length: 24 }, (_, idx) => makePoint(idx + 1));

  const currentPm25 = basePm25;
  const currentPm10 = basePm10;
  const currentNo2 = severeMode ? 98 : 49;
  const currentSo2 = severeMode ? 28 : 16;
  const currentCoUg = severeMode ? 2900 : 1450;
  const currentO3 = severeMode ? 42 : 54;

  const { aqi, dominantPollutant } = calculateIndianCpcbAqi({
    pm25: currentPm25,
    pm10: currentPm10,
    no2: currentNo2,
    so2: currentSo2,
    coUg: currentCoUg,
    o3: currentO3,
  });

  const { category, description } = getCpcbCategory(aqi);

  return {
    city,
    state,
    lat,
    lon,
    cpcbAqi: aqi,
    usAqiReference: severeMode ? 318 : 181,
    dominantPollutant,
    category,
    categoryDescription: description,
    standardLabel: 'Indian CPCB AQI (0–500)',
    standardComparisonNote:
      'Indian CPCB AQI uses 24-hour Indian National Ambient Air Quality breakpoints (0–500 across 6 bands). US EPA AQI uses stricter PM2.5 thresholds and is shown separately for reference only.',
    pollutants: {
      pm25: currentPm25,
      pm10: currentPm10,
      no2: currentNo2,
      so2: currentSo2,
      co: currentCoUg,
      o3: currentO3,
    },
    weather: {
      temperatureC: severeMode ? 13.4 : 18.2,
      humidityPct: severeMode ? 79 : 61,
      windSpeedKmh: severeMode ? 4.1 : 8.6,
      windDirectionDeg: 305,
      windCompass: 'NW',
    },
    updatedAtIso: now.toISOString(),
    updatedAtFormattedIst: formatIstTimestamp(now),
    dataMode: 'demo',
    sourceAttribution: severeMode
      ? 'Demonstration Scenario · Simulated Severe Winter Smog'
      : 'Demonstration Data · Live API Unavailable',
    demoNotice: reason,
    history24h,
    forecast24h,
    outdoorWindows: buildOutdoorWindows(forecast24h, true),
  };
}

export async function fetchAirQualityData(params: {
  lat: number;
  lon: number;
  city: string;
  state?: string;
  scenario?: SimulationScenario;
}): Promise<AirQualitySnapshot> {
  const { lat, lon, city, state = 'India', scenario = 'live' } = params;

  if (scenario === 'severe-demo') {
    return buildDemoSnapshot(
      city,
      state,
      lat,
      lon,
      'Simulated Severe Winter Smog scenario active for family emergency planning. Switch back to Live Feed anytime.',
      true
    );
  }

  try {
    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${encodeURIComponent(
      lat
    )}&longitude=${encodeURIComponent(
      lon
    )}&hourly=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ozone,us_aqi&past_days=1&forecast_days=2&timezone=Asia%2FKolkata`;

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
      lat
    )}&longitude=${encodeURIComponent(
      lon
    )}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&timezone=Asia%2FKolkata`;

    const [aqRes, weatherRes] = await Promise.all([
      fetch(aqUrl, { signal: AbortSignal.timeout(8000) }),
      fetch(weatherUrl, { signal: AbortSignal.timeout(8000) }),
    ]);

    if (!aqRes.ok) {
      throw new Error(`Open-Meteo Air Quality HTTP ${aqRes.status}`);
    }

    const aqData = (await aqRes.json()) as {
      hourly?: {
        time?: string[];
        pm2_5?: Array<number | null>;
        pm10?: Array<number | null>;
        nitrogen_dioxide?: Array<number | null>;
        sulphur_dioxide?: Array<number | null>;
        carbon_monoxide?: Array<number | null>;
        ozone?: Array<number | null>;
        us_aqi?: Array<number | null>;
      };
    };

    const weatherData = weatherRes.ok
      ? ((await weatherRes.json()) as {
          current?: {
            temperature_2m?: number;
            relative_humidity_2m?: number;
            wind_speed_10m?: number;
            wind_direction_10m?: number;
          };
        })
      : null;

    const times = aqData.hourly?.time ?? [];
    if (!times.length) {
      throw new Error('Empty hourly payload from Open-Meteo');
    }

    // Find current hour index closest to now in Asia/Kolkata
    const nowMs = Date.now();
    let currentIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < times.length; i++) {
      // Open-Meteo returns YYYY-MM-DDTHH:mm in Asia/Kolkata when timezone=Asia%2FKolkata
      const parsed = new Date(`${times[i]}+05:30`).getTime();
      if (!Number.isNaN(parsed)) {
        const diff = Math.abs(parsed - nowMs);
        if (diff < minDiff) {
          minDiff = diff;
          currentIdx = i;
        }
      }
    }

    const readNum = (arr: Array<number | null> | undefined, idx: number): number | null => {
      const v = arr?.[idx];
      return typeof v === 'number' && !Number.isNaN(v) ? Number(v.toFixed(1)) : null;
    };

    const pm25 = readNum(aqData.hourly?.pm2_5, currentIdx);
    const pm10 = readNum(aqData.hourly?.pm10, currentIdx);
    const no2 = readNum(aqData.hourly?.nitrogen_dioxide, currentIdx);
    const so2 = readNum(aqData.hourly?.sulphur_dioxide, currentIdx);
    const co = readNum(aqData.hourly?.carbon_monoxide, currentIdx);
    const o3 = readNum(aqData.hourly?.ozone, currentIdx);
    const usAqiRef = readNum(aqData.hourly?.us_aqi, currentIdx);

    const { aqi, dominantPollutant } = calculateIndianCpcbAqi({
      pm25,
      pm10,
      no2,
      so2,
      coUg: co,
      o3,
    });
    const { category, description } = getCpcbCategory(aqi);

    const buildSlice = (start: number, end: number): HourlyAqiPoint[] => {
      const points: HourlyAqiPoint[] = [];
      for (let i = Math.max(0, start); i < Math.min(times.length, end); i++) {
        const p25 = readNum(aqData.hourly?.pm2_5, i) ?? 0;
        const p10 = readNum(aqData.hourly?.pm10, i) ?? 0;
        const pNo2 = readNum(aqData.hourly?.nitrogen_dioxide, i);
        const pO3 = readNum(aqData.hourly?.ozone, i);
        const sub = calculateIndianCpcbAqi({ pm25: p25, pm10: p10, no2: pNo2, o3: pO3 });
        const isoWithTz = `${times[i]}+05:30`;
        points.push({
          isoTime: isoWithTz,
          label: formatHourLabelIst(isoWithTz),
          cpcbAqi: sub.aqi,
          pm25: Math.round(p25),
          pm10: Math.round(p10),
          category: getCpcbCategory(sub.aqi).category,
        });
      }
      return points;
    };

    const history24h = buildSlice(currentIdx - 23, currentIdx + 1);
    const forecast24h = buildSlice(currentIdx + 1, currentIdx + 25);

    const temp = weatherData?.current?.temperature_2m ?? null;
    const humidity = weatherData?.current?.relative_humidity_2m ?? null;
    const windSpeed = weatherData?.current?.wind_speed_10m ?? null;
    const windDir = weatherData?.current?.wind_direction_10m ?? null;

    const now = new Date();
    return {
      city,
      state,
      lat,
      lon,
      cpcbAqi: aqi,
      usAqiReference: usAqiRef !== null ? Math.round(usAqiRef) : null,
      dominantPollutant,
      category,
      categoryDescription: description,
      standardLabel: 'Indian CPCB AQI (0–500)',
      standardComparisonNote:
        'AQI shown is computed strictly using Indian CPCB National Air Quality Index breakpoints (0–500). US EPA AQI is displayed separately as a reference without mixing scales.',
      pollutants: {
        pm25,
        pm10,
        no2,
        so2,
        co,
        o3,
      },
      weather: {
        temperatureC: temp !== null ? Number(temp.toFixed(1)) : null,
        humidityPct: humidity !== null ? Math.round(humidity) : null,
        windSpeedKmh: windSpeed !== null ? Number(windSpeed.toFixed(1)) : null,
        windDirectionDeg: windDir !== null ? Math.round(windDir) : null,
        windCompass: degreesToCompass(windDir),
      },
      updatedAtIso: now.toISOString(),
      updatedAtFormattedIst: formatIstTimestamp(now),
      dataMode: 'live',
      sourceAttribution: 'Open-Meteo CAMS Atmospheric & Weather Model (Converted to Indian CPCB AQI)',
      demoNotice: null,
      history24h,
      forecast24h,
      outdoorWindows: buildOutdoorWindows(forecast24h, false),
    };
  } catch (error) {
    console.error('External air quality fetch failed, switching to clearly labeled demo mode:', error);
    return buildDemoSnapshot(
      city,
      state,
      lat,
      lon,
      'Live atmospheric API could not be reached. Displaying clearly labeled demonstration values so you can explore family routines and safety tools.',
      false
    );
  }
}

export async function searchCities(query: string): Promise<CityOption[]> {
  const clean = query.trim();
  if (!clean) return INDIAN_CITIES;

  const lower = clean.toLowerCase();
  const presetMatches = INDIAN_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(lower) ||
      c.state.toLowerCase().includes(lower)
  );

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      clean
    )}&count=6&language=en&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return presetMatches;

    const data = (await res.json()) as {
      results?: Array<{
        name: string;
        admin1?: string;
        country?: string;
        latitude: number;
        longitude: number;
      }>;
    };

    const remote: CityOption[] = (data.results ?? []).map((r) => ({
      name: r.name,
      state: r.admin1 || r.country || 'Urban Area',
      country: r.country || '',
      lat: r.latitude,
      lon: r.longitude,
    }));

    // Prioritize Indian cities first while preserving global matches
    const combined = [...presetMatches];
    for (const item of remote) {
      if (
        !combined.some(
          (p) =>
            p.name.toLowerCase() === item.name.toLowerCase() &&
            Math.abs(p.lat - item.lat) < 0.2
        )
      ) {
        combined.push(item);
      }
    }
    return combined.slice(0, 8);
  } catch {
    return presetMatches;
  }
}
