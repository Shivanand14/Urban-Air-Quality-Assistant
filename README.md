# BreatheWise AI — Urban Air Quality Assistant

> *Breathe smarter. Live healthier. Protect your family.*

BreatheWise AI converts atmospheric pollution and weather data into personalized, practical daily actions for urban families—focusing on children, elderly members, commuters, and respiratory sensitivities under the **Indian CPCB National AQI (0–500)** standard.

## Key Modules Implemented

1. **Smart Air Quality Dashboard**: Displays live Indian CPCB AQI, 6 color-coded bands (*Good, Satisfactory, Moderate, Poor, Very Poor, Severe*), PM2.5, PM10, NO2, SO2, CO (mg/m³), O3, temperature (°C), humidity, wind speed/direction, IST timestamps, 24-hour Recharts trend, and an explicit US EPA reference comparison without mixing standards.
2. **Family Health & Exposure Score**: Add/edit/remove family members (age group, activity pattern, optional sensitivity, outdoor exposure). Computes an informational **Family Exposure Score (0–100)** (explicitly labeled non-diagnostic) alongside member-specific precautions.
3. **Smart Outdoor Activity Planner**: Analyzes 24-hour hourly AQI forecasts to highlight comparatively lower-exposure windows for walking, jogging, children's play, and commutes, plus indoor alternatives during high pollution.
4. **Indoor Air Quality Coach**: Room-by-room optimization (*Bedroom, Living Room, Children's Room, Kitchen*), window-opening verdicts, True HEPA sizing guidance (explicitly excluding ozone generators), and interactive daily checklists.
5. **AI Daily Family Routine Generator**: Server-side Gemini (`gemini-4-hydrogen`) routine builder generating Morning, Afternoon, Evening, and Night plans with a transparent Rule-Based Safety Engine fallback when an AI key is unavailable.
6. **Ask BreatheWise AI Assistant**: Conversational assistant grounded in active city AQI, timestamps, data mode (live vs demo), and saved family profiles.
7. **Pollution Alerts & Thresholds**: Custom CPCB AQI alert thresholds, in-app alert banners, alert history, and browser notification capability check.
8. **Air Quality Education Hub**: Illustrated guides covering PM2.5 vs PM10, winter thermal inversion, Indian CPCB vs US AQI, and True HEPA filtration.

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Recharts, Lucide Icons
- **Backend**: Express.js (Node.js + TypeScript)
- **Database**: PostgreSQL (Cloud SQL) with Drizzle ORM (`users`, `family_members`, `daily_routines`, `alerts`, `indoor_checklists`)
- **Authentication**: Firebase Authentication (Google Sign-In) with server-side token verification (`firebase-admin`)
- **AI Engine**: `@google/genai` (`gemini-4-hydrogen`) server-side + deterministic Rule-Based Safety Engine fallback
- **External Data APIs**: Open-Meteo Air Quality (CAMS), Open-Meteo Weather Forecast, Open-Meteo Geocoding, Browser Geolocation API (with user consent)

## Environment Variables

Configure secrets in your runtime environment (see `.env.example`):

- `GEMINI_API_KEY`: Server-side Google Gemini API key (never exposed to browser code)
- `APP_URL`: Application hosting URL
- `SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`, `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD`: Provisioned Cloud SQL PostgreSQL connection credentials

## Local Development & GitHub Safety

`.env*` (except `.env.example`) and `firebase-applet-config.json` are excluded in `.gitignore` so API keys and project credentials are never committed to GitHub. Before running locally from a fresh clone:

```bash
cp .env.example .env
cp firebase-applet-config.example.json firebase-applet-config.json
npm install
npm run lint
npm run build
npm run dev
```

## Known Limitations & Safety Boundaries

- **Informational Guidance Only**: Exposure scores, routines, and AI assistant replies are environmental-health support tools, not medical diagnoses or prescriptions.
- **Atmospheric Model Resolution**: Live pollutant readings use Open-Meteo CAMS regional atmospheric data converted to Indian CPCB AQI breakpoints rather than hyperlocal street-corner IoT sensors; if unreachable, the app switches to clearly labeled Demonstration Mode.
- **Browser Push Notifications**: Embedded preview iframes may restrict Web Push permissions; in-app threshold alerts remain active in all environments.
