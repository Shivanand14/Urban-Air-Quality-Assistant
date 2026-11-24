import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  addFamilyMember,
  createAlert,
  deleteFamilyMember,
  getChecklistStates,
  getFamilyMembers,
  getOrCreateUser,
  getSavedRoutines,
  getUserAlerts,
  markAllAlertsRead,
  markAlertRead,
  saveDailyRoutine,
  updateFamilyMember,
  updateUserPreferences,
  upsertChecklistItem,
} from './src/db/users.ts';
import { requireAuth } from './src/middleware/auth.ts';
import type { AuthRequest } from './src/middleware/auth.ts';
import {
  fetchAirQualityData,
  INDIAN_CITIES,
  searchCities,
} from './src/services/airQualityService.ts';
import {
  askBreatheWiseAssistant,
  generatePersonalizedRoutine,
} from './src/services/aiService.ts';
import { computeHouseholdExposure } from './src/services/exposureService.ts';
import type {
  AirQualitySnapshot,
  ChatMessage,
  FamilyMemberProfile,
  SimulationScenario,
} from './src/types/breathewise.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

function parseFiniteNumber(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const n = Number(val);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function sanitizeString(val: unknown, maxLen = 160): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'breathewise-ai', timestamp: new Date().toISOString() });
});

app.get('/api/cities/search', async (req, res) => {
  try {
    const q = sanitizeString(req.query.q, 80);
    const results = await searchCities(q);
    res.json({ cities: results });
  } catch (error) {
    console.error('City search failed:', error);
    res.json({ cities: INDIAN_CITIES });
  }
});

app.get('/api/air-quality', async (req, res) => {
  try {
    const lat = parseFiniteNumber(req.query.lat) ?? 28.6139;
    const lon = parseFiniteNumber(req.query.lon) ?? 77.209;
    const city = sanitizeString(req.query.city, 80) || 'New Delhi';
    const state = sanitizeString(req.query.state, 80) || 'Delhi NCR';
    const scenario: SimulationScenario =
      req.query.scenario === 'severe-demo' ? 'severe-demo' : 'live';

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Invalid geographic coordinates.' });
    }

    const snapshot = await fetchAirQualityData({
      lat,
      lon,
      city,
      state,
      scenario,
    });
    res.json(snapshot);
  } catch (error) {
    console.error('Air quality endpoint error:', error);
    res.status(500).json({ error: 'Unable to retrieve air quality readings.' });
  }
});

app.post('/api/exposure', (req, res) => {
  try {
    const body = req.body as {
      airQuality?: AirQualitySnapshot;
      familyMembers?: FamilyMemberProfile[];
    };

    if (!body?.airQuality || typeof body.airQuality.cpcbAqi !== 'number') {
      return res.status(400).json({ error: 'Valid air quality snapshot is required.' });
    }

    const members = Array.isArray(body.familyMembers) ? body.familyMembers.slice(0, 20) : [];
    const exposure = computeHouseholdExposure(body.airQuality, members);
    res.json(exposure);
  } catch (error) {
    console.error('Exposure calculation error:', error);
    res.status(500).json({ error: 'Unable to calculate household exposure.' });
  }
});

app.post('/api/ai/routine/preview', async (req, res) => {
  try {
    const body = req.body as {
      airQuality?: AirQualitySnapshot;
      familyMembers?: FamilyMemberProfile[];
    };

    if (!body?.airQuality || typeof body.airQuality.cpcbAqi !== 'number') {
      return res.status(400).json({ error: 'Valid air quality snapshot is required.' });
    }

    const members = Array.isArray(body.familyMembers) ? body.familyMembers.slice(0, 20) : [];
    const routine = await generatePersonalizedRoutine({
      airQuality: body.airQuality,
      familyMembers: members,
    });
    res.json(routine);
  } catch (error) {
    console.error('Preview routine generation error:', error);
    res.status(500).json({ error: 'Unable to generate daily routine right now.' });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const body = req.body as {
      question?: string;
      history?: ChatMessage[];
      airQuality?: AirQualitySnapshot;
      familyMembers?: FamilyMemberProfile[];
    };

    const question = sanitizeString(body?.question, 800);
    if (!question) {
      return res.status(400).json({ error: 'Please enter a question.' });
    }
    if (!body?.airQuality || typeof body.airQuality.cpcbAqi !== 'number') {
      return res.status(400).json({ error: 'Active air quality context is required.' });
    }

    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
    const members = Array.isArray(body.familyMembers) ? body.familyMembers.slice(0, 20) : [];

    const answer = await askBreatheWiseAssistant({
      question,
      history,
      airQuality: body.airQuality,
      familyMembers: members,
    });
    res.json(answer);
  } catch (error) {
    console.error('AI assistant chat error:', error);
    res.status(500).json({ error: 'Assistant request failed. Please try again.' });
  }
});

// Authenticated PostgreSQL persistence routes
app.get('/api/user/bootstrap', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || 'user@breathewise.local';
    const name = typeof req.user!.name === 'string' ? req.user!.name : null;

    const user = await getOrCreateUser(uid, email, name);
    const [members, routines, userAlerts, checklists] = await Promise.all([
      getFamilyMembers(user.id),
      getSavedRoutines(user.id),
      getUserAlerts(user.id),
      getChecklistStates(user.id),
    ]);

    res.json({
      user,
      familyMembers: members,
      savedRoutines: routines,
      alerts: userAlerts,
      checklists,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to load account data.';
    res.status(500).json({ error: msg });
  }
});

app.put('/api/user/preferences', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(
      req.user!.uid,
      req.user!.email || 'user@breathewise.local'
    );

    const body = req.body as {
      selectedCity?: string;
      selectedLat?: number;
      selectedLon?: number;
      aqiThreshold?: number;
      notificationsEnabled?: boolean;
    };

    const prefs: {
      selectedCity?: string;
      selectedLat?: number;
      selectedLon?: number;
      aqiThreshold?: number;
      notificationsEnabled?: boolean;
    } = {};

    if (typeof body.selectedCity === 'string' && body.selectedCity.trim()) {
      prefs.selectedCity = sanitizeString(body.selectedCity, 80);
    }
    if (
      typeof body.selectedLat === 'number' &&
      body.selectedLat >= -90 &&
      body.selectedLat <= 90
    ) {
      prefs.selectedLat = body.selectedLat;
    }
    if (
      typeof body.selectedLon === 'number' &&
      body.selectedLon >= -180 &&
      body.selectedLon <= 180
    ) {
      prefs.selectedLon = body.selectedLon;
    }
    if (
      typeof body.aqiThreshold === 'number' &&
      body.aqiThreshold >= 50 &&
      body.aqiThreshold <= 450
    ) {
      prefs.aqiThreshold = Math.round(body.aqiThreshold);
    }
    if (typeof body.notificationsEnabled === 'boolean') {
      prefs.notificationsEnabled = body.notificationsEnabled;
    }

    const updated = await updateUserPreferences(user.id, prefs);
    res.json({ user: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update preferences.';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/family', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(
      req.user!.uid,
      req.user!.email || 'user@breathewise.local'
    );
    const body = req.body as Record<string, unknown>;

    const name = sanitizeString(body.name, 60);
    const ageGroup = sanitizeString(body.ageGroup, 40);
    const activityType = sanitizeString(body.activityType, 50);
    const sensitivity = sanitizeString(body.sensitivity, 50) || 'None';
    const outdoorExposure = sanitizeString(body.outdoorExposure, 40);

    if (!name || !ageGroup || !activityType || !outdoorExposure) {
      return res.status(400).json({ error: 'All required family member fields must be filled.' });
    }

    const created = await addFamilyMember(user.id, {
      name,
      ageGroup,
      activityType,
      sensitivity,
      outdoorExposure,
    });
    res.status(201).json({ member: created });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to add family member.';
    res.status(500).json({ error: msg });
  }
});

app.put('/api/family/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(
      req.user!.uid,
      req.user!.email || 'user@breathewise.local'
    );
    const memberId = parseFiniteNumber(req.params.id);
    if (!memberId) return res.status(400).json({ error: 'Invalid member ID.' });

    const body = req.body as Record<string, unknown>;
    const name = sanitizeString(body.name, 60);
    const ageGroup = sanitizeString(body.ageGroup, 40);
    const activityType = sanitizeString(body.activityType, 50);
    const sensitivity = sanitizeString(body.sensitivity, 50) || 'None';
    const outdoorExposure = sanitizeString(body.outdoorExposure, 40);

    if (!name || !ageGroup || !activityType || !outdoorExposure) {
      return res.status(400).json({ error: 'All required family member fields must be filled.' });
    }

    const updated = await updateFamilyMember(user.id, memberId, {
      name,
      ageGroup,
      activityType,
      sensitivity,
      outdoorExposure,
    });
    if (!updated) return res.status(404).json({ error: 'Family member not found.' });
    res.json({ member: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update family member.';
    res.status(500).json({ error: msg });
  }
});

app.delete('/api/family/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(
      req.user!.uid,
      req.user!.email || 'user@breathewise.local'
    );
    const memberId = parseFiniteNumber(req.params.id);
    if (!memberId) return res.status(400).json({ error: 'Invalid member ID.' });

    const deleted = await deleteFamilyMember(user.id, memberId);
    if (!deleted) return res.status(404).json({ error: 'Family member not found.' });
    res.json({ deletedId: memberId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to delete family member.';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/routines/generate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(
      req.user!.uid,
      req.user!.email || 'user@breathewise.local'
    );
    const body = req.body as {
      airQuality?: AirQualitySnapshot;
      familyMembers?: FamilyMemberProfile[];
    };

    if (!body?.airQuality || typeof body.airQuality.cpcbAqi !== 'number') {
      return res.status(400).json({ error: 'Valid air quality data is required.' });
    }

    const dbMembers = await getFamilyMembers(user.id);
    const effectiveMembers = (
      Array.isArray(body.familyMembers) && body.familyMembers.length > 0
        ? body.familyMembers
        : dbMembers
    ) as FamilyMemberProfile[];

    const generated = await generatePersonalizedRoutine({
      airQuality: body.airQuality,
      familyMembers: effectiveMembers,
    });

    const saved = await saveDailyRoutine(user.id, {
      city: generated.city,
      aqiValue: generated.aqiValue,
      aqiCategory: generated.aqiCategory,
      sourceMode: generated.sourceMode,
      morningJson: JSON.stringify(generated.routine.morning),
      afternoonJson: JSON.stringify(generated.routine.afternoon),
      eveningJson: JSON.stringify(generated.routine.evening),
      nightJson: JSON.stringify(generated.routine.night),
      summary: generated.summary,
    });

    res.json({
      ...generated,
      id: saved.id,
      createdAt: saved.createdAt,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to generate and save routine.';
    res.status(500).json({ error: msg });
  }
});

app.get('/api/alerts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(
      req.user!.uid,
      req.user!.email || 'user@breathewise.local'
    );
    const list = await getUserAlerts(user.id);
    res.json({ alerts: list });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch alerts.';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/alerts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(
      req.user!.uid,
      req.user!.email || 'user@breathewise.local'
    );
    const body = req.body as Record<string, unknown>;
    const city = sanitizeString(body.city, 80);
    const aqiValue = parseFiniteNumber(body.aqiValue);
    const severity = sanitizeString(body.severity, 30);
    const title = sanitizeString(body.title, 120);
    const message = sanitizeString(body.message, 500);

    if (!city || aqiValue === null || !severity || !title || !message) {
      return res.status(400).json({ error: 'Invalid alert payload.' });
    }

    const alert = await createAlert(user.id, {
      city,
      aqiValue: Math.round(aqiValue),
      severity,
      title,
      message,
    });
    res.status(201).json({ alert });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to save alert.';
    res.status(500).json({ error: msg });
  }
});

app.patch('/api/alerts/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(
      req.user!.uid,
      req.user!.email || 'user@breathewise.local'
    );
    const alertId = parseFiniteNumber(req.params.id);
    if (!alertId) return res.status(400).json({ error: 'Invalid alert ID.' });
    const updated = await markAlertRead(user.id, alertId);
    if (!updated) return res.status(404).json({ error: 'Alert not found.' });
    res.json({ alert: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to mark alert read.';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/alerts/read-all', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(
      req.user!.uid,
      req.user!.email || 'user@breathewise.local'
    );
    await markAllAlertsRead(user.id);
    res.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to clear unread alerts.';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/checklists', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(
      req.user!.uid,
      req.user!.email || 'user@breathewise.local'
    );
    const body = req.body as Record<string, unknown>;
    const room = sanitizeString(body.room, 40);
    const itemKey = sanitizeString(body.itemKey, 80);
    const completed = Boolean(body.completed);

    if (!room || !itemKey) {
      return res.status(400).json({ error: 'Room and itemKey are required.' });
    }

    const item = await upsertChecklistItem(user.id, room, itemKey, completed);
    res.json({ item });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to save checklist item.';
    res.status(500).json({ error: msg });
  }
});

async function startServer() {
  const distDir = path.resolve(__dirname, 'dist');
  const useProdStatic =
    process.env.NODE_ENV === 'production' &&
    fs.existsSync(path.join(distDir, 'index.html'));

  if (useProdStatic) {
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BreatheWise AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
