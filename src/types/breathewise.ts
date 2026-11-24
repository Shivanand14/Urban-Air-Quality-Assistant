export type CpcbCategory =
  | 'Good'
  | 'Satisfactory'
  | 'Moderate'
  | 'Poor'
  | 'Very Poor'
  | 'Severe';

export type DataMode = 'live' | 'demo';

export type SimulationScenario = 'live' | 'severe-demo';

export interface CityOption {
  name: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
}

export interface PollutantReadings {
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null; // ug/m3 from Open-Meteo, displayed in mg/m3 for CPCB
  o3: number | null;
}

export interface WeatherReadings {
  temperatureC: number | null;
  humidityPct: number | null;
  windSpeedKmh: number | null;
  windDirectionDeg: number | null;
  windCompass: string;
}

export interface HourlyAqiPoint {
  isoTime: string;
  label: string;
  cpcbAqi: number;
  pm25: number;
  pm10: number;
  category: CpcbCategory;
}

export interface OutdoorWindowRecommendation {
  id: string;
  activity: string;
  windowLabel: string;
  avgAqi: number;
  category: CpcbCategory;
  suitability: 'Lower Exposure Window' | 'Caution Advised' | 'Avoid Outdoors';
  guidance: string;
  indoorAlternative: string;
}

export interface AirQualitySnapshot {
  city: string;
  state: string;
  lat: number;
  lon: number;
  cpcbAqi: number;
  usAqiReference: number | null;
  dominantPollutant: string;
  category: CpcbCategory;
  categoryDescription: string;
  standardLabel: string;
  standardComparisonNote: string;
  pollutants: PollutantReadings;
  weather: WeatherReadings;
  updatedAtIso: string;
  updatedAtFormattedIst: string;
  dataMode: DataMode;
  sourceAttribution: string;
  demoNotice: string | null;
  history24h: HourlyAqiPoint[];
  forecast24h: HourlyAqiPoint[];
  outdoorWindows: OutdoorWindowRecommendation[];
}

export type AgeGroup =
  | 'Child (0-12)'
  | 'Teen (13-17)'
  | 'Adult (18-59)'
  | 'Elderly (60+)';

export type ActivityType =
  | 'School Commute'
  | 'Outdoor Worker'
  | 'Morning Jogger'
  | 'Daily Commuter'
  | 'Indoor / Homebound';

export type SensitivityCategory =
  | 'None'
  | 'Asthma / Respiratory'
  | 'Allergic Rhinitis'
  | 'Cardiac Sensitivity'
  | 'Pregnancy';

export type OutdoorExposureLevel =
  | 'Low (<1 hr/day)'
  | 'Moderate (1-3 hrs/day)'
  | 'High (>3 hrs/day)';

export interface FamilyMemberProfile {
  id: number;
  name: string;
  ageGroup: AgeGroup;
  activityType: ActivityType;
  sensitivity: SensitivityCategory;
  outdoorExposure: OutdoorExposureLevel;
}

export interface MemberExposureAssessment {
  memberId: number;
  name: string;
  ageGroup: AgeGroup;
  sensitivity: SensitivityCategory;
  exposureScore: number; // 0-100 informational estimate
  exposureBand: 'Low' | 'Moderate' | 'Elevated' | 'High';
  precautions: string[];
  indoorAlternatives: string[];
}

export interface HouseholdExposureSummary {
  overallScore: number;
  band: 'Low' | 'Moderate' | 'Elevated' | 'High';
  disclaimer: string;
  topThreeActions: string[];
  memberAssessments: MemberExposureAssessment[];
}

export interface DailyRoutineBlocks {
  morning: string[];
  afternoon: string[];
  evening: string[];
  night: string[];
}

export interface GeneratedRoutineResponse {
  id?: number;
  city: string;
  aqiValue: number;
  aqiCategory: CpcbCategory;
  sourceMode: 'gemini' | 'rule-based';
  modelLabel: string;
  summary: string;
  topThreeActions: string[];
  routine: DailyRoutineBlocks;
  memberAdvice: Array<{
    name: string;
    guidance: string;
  }>;
  createdAt?: string;
}

export interface AlertItem {
  id: number;
  city: string;
  aqiValue: number;
  severity: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sourceMode?: 'gemini' | 'rule-based';
  timestamp: string;
}
