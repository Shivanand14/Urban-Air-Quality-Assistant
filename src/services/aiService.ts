import { GoogleGenAI, Type } from '@google/genai';
import type {
  AirQualitySnapshot,
  ChatMessage,
  FamilyMemberProfile,
  GeneratedRoutineResponse,
} from '../types/breathewise.ts';
import { computeHouseholdExposure } from './exposureService.ts';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim().length < 10) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildRuleBasedRoutine(
  airQuality: AirQualitySnapshot,
  familyMembers: FamilyMemberProfile[]
): GeneratedRoutineResponse {
  const aqi = airQuality.cpcbAqi;
  const exposure = computeHouseholdExposure(airQuality, familyMembers);
  const bestWindow = airQuality.outdoorWindows[0]?.windowLabel ?? '2:00 PM – 4:00 PM';
  const hasChild = familyMembers.some((m) => m.ageGroup === 'Child (0-12)');
  const hasElderly = familyMembers.some((m) => m.ageGroup === 'Elderly (60+)');
  const isPoorOrWorse = aqi >= 201;

  const morning = [
    `Check ${airQuality.city} CPCB AQI (${aqi}, ${airQuality.category}) before stepping out; ${isPoorOrWorse ? 'skip outdoor morning walks or jogging' : 'keep outdoor exertion away from main roads'}.`,
    hasChild
      ? `Prepare school commute precautions: ${isPoorOrWorse ? 'use a child-sized N95/KF94 mask and enclosed transport' : 'avoid lingering near idling school buses'}.`
      : 'Use car cabin air recirculation or enclosed transit during morning peak traffic.',
    `Keep kitchen exhaust running during breakfast cooking and ${isPoorOrWorse ? 'keep external windows closed' : 'briefly ventilate if outdoor AQI is below 100'}.`,
  ];

  const afternoon = [
    `Lowest projected pollution window today is ${bestWindow}; ${isPoorOrWorse ? 'keep vigorous activities indoors even during this dip' : 'use this window for essential errands or light walks'}.`,
    hasChild
      ? isPoorOrWorse
        ? 'Choose indoor play (puzzles, indoor games, reading) instead of park time after school.'
        : 'Supervise short outdoor play in parks away from traffic corridors.'
      : 'Use damp mopping instead of dry sweeping to capture settled indoor dust.',
    'Monitor afternoon hydration and avoid burning incense, candles, or mosquito coils indoors.',
  ];

  const evening = [
    `Re-check evening CPCB AQI as cooling air traps traffic and cooking emissions (${airQuality.weather.windSpeedKmh ?? 'low'} km/h wind).`,
    hasElderly
      ? isPoorOrWorse
        ? 'Encourage elderly family members to stay indoors with gentle corridor walks or chair stretches.'
        : 'Keep evening walks brief and wear a mask near busy streets.'
      : 'Change out of outdoor commute clothes and wash hands/face upon returning home.',
    'Keep balcony doors sealed before dusk and run exhaust fans while preparing dinner.',
  ];

  const night = [
    'Keep bedroom floors dust-free and run an appropriately sized HEPA air purifier on low/medium sleep mode.',
    'Check humidifier/dehumidifier balance to maintain comfortable 40–55% indoor humidity without dampness.',
    `Review tomorrow’s hourly AQI forecast in the Outdoor Planner before setting morning school or workout alarms.`,
  ];

  const memberAdvice = familyMembers.map((m) => {
    const assessment = exposure.memberAssessments.find((a) => a.memberId === m.id);
    return {
      name: m.name,
      guidance:
        assessment?.precautions.slice(0, 2).join(' ') ??
        'Follow general urban air quality precautions and monitor daily AQI shifts.',
    };
  });

  return {
    city: airQuality.city,
    aqiValue: aqi,
    aqiCategory: airQuality.category,
    sourceMode: 'rule-based',
    modelLabel: 'BreatheWise Rule-Based Safety Engine (AI key unavailable)',
    summary: `Based on ${airQuality.dataMode === 'demo' ? 'demonstration' : 'measured'} CPCB AQI of ${aqi} (${airQuality.category}) in ${airQuality.city}, ${isPoorOrWorse ? 'prioritize indoor routines, sealed windows, and filtered bedroom air today.' : 'time short outdoor errands around lower-pollution midday hours and maintain clean indoor ventilation.'}`,
    topThreeActions: exposure.topThreeActions,
    routine: { morning, afternoon, evening, night },
    memberAdvice,
  };
}

export async function generatePersonalizedRoutine(params: {
  airQuality: AirQualitySnapshot;
  familyMembers: FamilyMemberProfile[];
}): Promise<GeneratedRoutineResponse> {
  const { airQuality, familyMembers } = params;
  const ai = getGeminiClient();

  if (!ai) {
    return buildRuleBasedRoutine(airQuality, familyMembers);
  }

  const familyContext =
    familyMembers.length > 0
      ? familyMembers
          .map(
            (m) =>
              `- ${m.name} (${m.ageGroup}, activity: ${m.activityType}, sensitivity: ${m.sensitivity}, outdoor exposure: ${m.outdoorExposure})`
          )
          .join('\n')
      : '- General urban household (no specific members added yet)';

  const forecastSummary = airQuality.outdoorWindows
    .map((w) => `${w.activity}: ${w.windowLabel} (~${w.avgAqi} CPCB AQI, ${w.category})`)
    .join('; ');

  const prompt = `
Generate a practical, non-diagnostic daily air quality protection routine for this urban family in India.

Location & Conditions:
- City: ${airQuality.city}, ${airQuality.state}
- Data Mode: ${airQuality.dataMode === 'demo' ? 'Demonstration / Simulated data' : 'Live atmospheric model data'}
- Timestamp: ${airQuality.updatedAtFormattedIst}
- Indian CPCB AQI: ${airQuality.cpcbAqi} (${airQuality.category}), Dominant pollutant: ${airQuality.dominantPollutant}
- PM2.5: ${airQuality.pollutants.pm25 ?? 'N/A'} ug/m3, PM10: ${airQuality.pollutants.pm10 ?? 'N/A'} ug/m3, NO2: ${airQuality.pollutants.no2 ?? 'N/A'} ug/m3
- Weather: ${airQuality.weather.temperatureC ?? 'N/A'} °C, Humidity ${airQuality.weather.humidityPct ?? 'N/A'}%, Wind ${airQuality.weather.windSpeedKmh ?? 'N/A'} km/h ${airQuality.weather.windCompass}
- Hourly Forecast Windows: ${forecastSummary}

Family Members:
${familyContext}

Strict Rules:
1. Never diagnose medical conditions or prescribe medications. For respiratory sensitivities, recommend following their existing clinician care plan.
2. Never recommend ozone generators for indoor air purification.
3. Never claim a polluted time window is "safe"—use "comparatively lower-exposure window" or recommend indoor alternatives when AQI >= 201.
4. Keep each bullet concise (1 sentence), practical, and tailored to Indian urban households.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are BreatheWise AI, a practical environmental-health family routine planner focused on Indian urban smog protection. Return valid JSON matching the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            topThreeActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            morning: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            afternoon: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            evening: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            night: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            memberAdvice: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  guidance: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    const raw = (response.text ?? '').trim();
    const parsed = JSON.parse(raw) as {
      summary?: string;
      topThreeActions?: string[];
      morning?: string[];
      afternoon?: string[];
      evening?: string[];
      night?: string[];
      memberAdvice?: Array<{ name: string; guidance: string }>;
    };

    const fallback = buildRuleBasedRoutine(airQuality, familyMembers);
    return {
      city: airQuality.city,
      aqiValue: airQuality.cpcbAqi,
      aqiCategory: airQuality.category,
      sourceMode: 'gemini',
      modelLabel: 'Gemini AI (gemini-4-hydrogen)',
      summary: parsed.summary || fallback.summary,
      topThreeActions:
        parsed.topThreeActions && parsed.topThreeActions.length >= 2
          ? parsed.topThreeActions.slice(0, 3)
          : fallback.topThreeActions,
      routine: {
        morning: parsed.morning?.length ? parsed.morning : fallback.routine.morning,
        afternoon: parsed.afternoon?.length ? parsed.afternoon : fallback.routine.afternoon,
        evening: parsed.evening?.length ? parsed.evening : fallback.routine.evening,
        night: parsed.night?.length ? parsed.night : fallback.routine.night,
      },
      memberAdvice:
        parsed.memberAdvice && parsed.memberAdvice.length > 0
          ? parsed.memberAdvice
          : fallback.memberAdvice,
    };
  } catch (error) {
    console.error('Gemini routine generation failed, falling back cleanly to rule-based engine:', error);
    return buildRuleBasedRoutine(airQuality, familyMembers);
  }
}

function buildRuleBasedChatReply(
  question: string,
  airQuality: AirQualitySnapshot,
  familyMembers: FamilyMemberProfile[]
): { reply: string; sourceMode: 'rule-based' } {
  const q = question.toLowerCase();
  const aqi = airQuality.cpcbAqi;
  const dataTag =
    airQuality.dataMode === 'demo'
      ? `Currently using Demonstration Data (${aqi} CPCB AQI, ${airQuality.category}) for ${airQuality.city} as of ${airQuality.updatedAtFormattedIst}.`
      : `Current reading for ${airQuality.city} (${airQuality.updatedAtFormattedIst}): ${aqi} CPCB AQI (${airQuality.category}), PM2.5 ${airQuality.pollutants.pm25 ?? 'N/A'} µg/m³.`;

  const hasChild = familyMembers.some((m) => m.ageGroup === 'Child (0-12)');
  const hasSensitive = familyMembers.some((m) => m.sensitivity !== 'None');

  if (q.includes('window') || q.includes('open')) {
    return {
      sourceMode: 'rule-based',
      reply: `${dataTag}\n\n${
        aqi <= 100
          ? 'General Guidance: Outdoor air is currently in a favorable band, so brief cross-ventilation for 15–20 minutes is reasonable away from heavy road dust.'
          : `General Guidance: Keep external windows and balcony doors closed right now, as outdoor CPCB AQI is ${aqi} (${airQuality.category}). Wait until hourly forecast levels drop closer to your cleanest midday window (${airQuality.outdoorWindows[0]?.windowLabel ?? 'mid-afternoon'}) before brief ventilation.`
      }\n\n(Generated by BreatheWise Rule-Based Safety Engine because live AI service is currently unavailable.)`,
    };
  }

  if (q.includes('child') || q.includes('outside') || q.includes('park') || q.includes('play')) {
    return {
      sourceMode: 'rule-based',
      reply: `${dataTag}\n\n${
        aqi >= 201
          ? `General Guidance: At ${aqi} CPCB AQI (${airQuality.category}), postpone outdoor playground time for children. Move active play indoors with filtered air and use a well-fitted N95/KF94 mask if a brief commute is unavoidable.`
          : aqi >= 101
          ? `General Guidance: Keep outdoor play brief (<30–45 minutes) during your lowest-AQI forecast window (${airQuality.outdoorWindows[1]?.windowLabel ?? 'mid-afternoon'}) and choose parks away from traffic.${hasChild ? ' Watch closely for any coughing or fatigue.' : ''}`
          : 'General Guidance: Current outdoor conditions are favorable for children’s outdoor play. Rinse hands and face after returning indoors.'
      }\n\nIf a child experiences wheezing, persistent cough, or shortness of breath, follow their clinician’s care plan and seek professional medical attention.\n\n(Generated by BreatheWise Rule-Based Safety Engine.)`,
    };
  }

  if (q.includes('bedroom') || q.includes('indoor') || q.includes('hepa') || q.includes('purifier')) {
    return {
      sourceMode: 'rule-based',
      reply: `${dataTag}\n\nGeneral Indoor Guidance:\n- Keep windows sealed during Poor or worse outdoor AQI and damp-mop floors instead of dry sweeping.\n- Run an appropriately sized True HEPA air purifier (never an ozone generator) in sleeping areas and replace filters per manufacturer schedules.\n- Avoid indoor smoking, incense, dhoop, and scented candles, and use kitchen exhaust fans while cooking.\n\n(Generated by BreatheWise Rule-Based Safety Engine.)`,
    };
  }

  return {
    sourceMode: 'rule-based',
    reply: `${dataTag}\n\nGeneral Family Guidance:\n- Current outdoor conditions are ${airQuality.category}${hasSensitive ? ' (extra caution advised for sensitive members in your profile)' : ''}.\n- ${aqi >= 201 ? 'Avoid outdoor exercise, seal gaps around windows, and run indoor HEPA filtration if available.' : 'Plan essential outdoor errands around your lowest projected forecast window in the Outdoor Planner.'}\n- This is informational guidance, not medical advice. Consult a qualified doctor promptly for any concerning respiratory symptoms.\n\n(Generated by BreatheWise Rule-Based Safety Engine.)`,
  };
}

export async function askBreatheWiseAssistant(params: {
  question: string;
  history: ChatMessage[];
  airQuality: AirQualitySnapshot;
  familyMembers: FamilyMemberProfile[];
}): Promise<{ reply: string; sourceMode: 'gemini' | 'rule-based' }> {
  const { question, history, airQuality, familyMembers } = params;
  const ai = getGeminiClient();

  if (!ai) {
    return buildRuleBasedChatReply(question, airQuality, familyMembers);
  }

  const familyText =
    familyMembers.length > 0
      ? familyMembers
          .map(
            (m) =>
              `${m.name}: ${m.ageGroup}, ${m.activityType}, sensitivity=${m.sensitivity}, exposure=${m.outdoorExposure}`
          )
          .join(' | ')
      : 'No individual family profiles saved yet.';

  const systemInstruction = `
You are "Ask BreatheWise AI", an urban air quality and family protection assistant.

LIVE CONTEXT (Measured / Active Feed):
- City: ${airQuality.city}, ${airQuality.state}
- Data Source Mode: ${airQuality.dataMode === 'demo' ? 'DEMONSTRATION DATA (not live sensor measurements)' : 'LIVE ATMOSPHERIC MODEL DATA'}
- Timestamp: ${airQuality.updatedAtFormattedIst}
- Indian CPCB AQI: ${airQuality.cpcbAqi} (${airQuality.category})
- Dominant Pollutant: ${airQuality.dominantPollutant}
- Pollutants: PM2.5=${airQuality.pollutants.pm25 ?? 'unavailable'} µg/m³, PM10=${airQuality.pollutants.pm10 ?? 'unavailable'} µg/m³, NO2=${airQuality.pollutants.no2 ?? 'unavailable'} µg/m³, SO2=${airQuality.pollutants.so2 ?? 'unavailable'} µg/m³, O3=${airQuality.pollutants.o3 ?? 'unavailable'} µg/m³
- Weather: ${airQuality.weather.temperatureC ?? 'unavailable'} °C, Humidity ${airQuality.weather.humidityPct ?? 'unavailable'}%, Wind ${airQuality.weather.windSpeedKmh ?? 'unavailable'} km/h ${airQuality.weather.windCompass}
- Best Forecast Window: ${airQuality.outdoorWindows[0]?.windowLabel ?? 'unavailable'} (~${airQuality.outdoorWindows[0]?.avgAqi ?? 'N/A'} CPCB AQI)
- Family Profile: ${familyText}

MANDATORY SAFETY & TRUTHFULNESS RULES:
1. Always clearly distinguish measured/active feed data from general environmental-health recommendations.
2. If Data Source Mode is DEMONSTRATION DATA or any reading is "unavailable", state that clearly.
3. Never diagnose medical conditions or prescribe medications. For asthma/respiratory questions, advise following their clinician's existing care plan and seeking professional medical attention for concerning symptoms (wheezing, chest tightness, breathlessness).
4. Never suggest ozone generators for indoor air cleaning.
5. Keep answers concise, structured, empathetic, and immediately actionable for families.
`;

  const recentHistory = history
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const combinedPrompt = recentHistory
    ? `Recent conversation:\n${recentHistory}\n\nCurrent question: ${question}`
    : question;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: combinedPrompt,
      config: {
        systemInstruction,
      },
    });
    const text = (response.text ?? '').trim();
    if (!text) {
      return buildRuleBasedChatReply(question, airQuality, familyMembers);
    }
    return {
      reply: text,
      sourceMode: 'gemini',
    };
  } catch (error) {
    console.error('Gemini chat error, falling back to rule-based safety reply:', error);
    return buildRuleBasedChatReply(question, airQuality, familyMembers);
  }
}
