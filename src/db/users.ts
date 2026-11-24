import { and, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  alerts,
  dailyRoutines,
  familyMembers,
  indoorChecklists,
  users,
} from './schema.ts';

export async function getOrCreateUser(uid: string, email: string, displayName?: string | null) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName ?? null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(displayName !== undefined ? { displayName } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database error in getOrCreateUser:', error);
    throw new Error('Unable to load user profile. Please try again later.', { cause: error });
  }
}

export async function updateUserPreferences(
  userId: number,
  prefs: {
    selectedCity?: string;
    selectedLat?: number;
    selectedLon?: number;
    aqiThreshold?: number;
    notificationsEnabled?: boolean;
  }
) {
  try {
    const result = await db
      .update(users)
      .set(prefs)
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database error in updateUserPreferences:', error);
    throw new Error('Unable to save preferences. Please try again later.', { cause: error });
  }
}

export async function getFamilyMembers(userId: number) {
  try {
    return await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.userId, userId))
      .orderBy(familyMembers.createdAt);
  } catch (error) {
    console.error('Database error in getFamilyMembers:', error);
    throw new Error('Unable to load family members. Please try again later.', { cause: error });
  }
}

export async function addFamilyMember(
  userId: number,
  data: {
    name: string;
    ageGroup: string;
    activityType: string;
    sensitivity: string;
    outdoorExposure: string;
  }
) {
  try {
    const result = await db
      .insert(familyMembers)
      .values({
        userId,
        ...data,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database error in addFamilyMember:', error);
    throw new Error('Unable to save family member. Please try again later.', { cause: error });
  }
}

export async function updateFamilyMember(
  userId: number,
  memberId: number,
  data: {
    name: string;
    ageGroup: string;
    activityType: string;
    sensitivity: string;
    outdoorExposure: string;
  }
) {
  try {
    const result = await db
      .update(familyMembers)
      .set(data)
      .where(and(eq(familyMembers.id, memberId), eq(familyMembers.userId, userId)))
      .returning();
    return result[0] ?? null;
  } catch (error) {
    console.error('Database error in updateFamilyMember:', error);
    throw new Error('Unable to update family member. Please try again later.', { cause: error });
  }
}

export async function deleteFamilyMember(userId: number, memberId: number) {
  try {
    const result = await db
      .delete(familyMembers)
      .where(and(eq(familyMembers.id, memberId), eq(familyMembers.userId, userId)))
      .returning();
    return result[0] ?? null;
  } catch (error) {
    console.error('Database error in deleteFamilyMember:', error);
    throw new Error('Unable to remove family member. Please try again later.', { cause: error });
  }
}

export async function getSavedRoutines(userId: number) {
  try {
    return await db
      .select()
      .from(dailyRoutines)
      .where(eq(dailyRoutines.userId, userId))
      .orderBy(desc(dailyRoutines.createdAt))
      .limit(10);
  } catch (error) {
    console.error('Database error in getSavedRoutines:', error);
    throw new Error('Unable to load saved routines. Please try again later.', { cause: error });
  }
}

export async function saveDailyRoutine(
  userId: number,
  data: {
    city: string;
    aqiValue: number;
    aqiCategory: string;
    sourceMode: string;
    morningJson: string;
    afternoonJson: string;
    eveningJson: string;
    nightJson: string;
    summary: string;
  }
) {
  try {
    const result = await db
      .insert(dailyRoutines)
      .values({
        userId,
        ...data,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database error in saveDailyRoutine:', error);
    throw new Error('Unable to save daily routine. Please try again later.', { cause: error });
  }
}

export async function getUserAlerts(userId: number) {
  try {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.createdAt))
      .limit(30);
  } catch (error) {
    console.error('Database error in getUserAlerts:', error);
    throw new Error('Unable to load alert history. Please try again later.', { cause: error });
  }
}

export async function createAlert(
  userId: number,
  data: {
    city: string;
    aqiValue: number;
    severity: string;
    title: string;
    message: string;
  }
) {
  try {
    const result = await db
      .insert(alerts)
      .values({
        userId,
        ...data,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database error in createAlert:', error);
    throw new Error('Unable to record alert. Please try again later.', { cause: error });
  }
}

export async function markAlertRead(userId: number, alertId: number) {
  try {
    const result = await db
      .update(alerts)
      .set({ isRead: true })
      .where(and(eq(alerts.id, alertId), eq(alerts.userId, userId)))
      .returning();
    return result[0] ?? null;
  } catch (error) {
    console.error('Database error in markAlertRead:', error);
    throw new Error('Unable to update alert status. Please try again later.', { cause: error });
  }
}

export async function markAllAlertsRead(userId: number) {
  try {
    await db
      .update(alerts)
      .set({ isRead: true })
      .where(eq(alerts.userId, userId));
  } catch (error) {
    console.error('Database error in markAllAlertsRead:', error);
    throw new Error('Unable to clear unread alerts. Please try again later.', { cause: error });
  }
}

export async function getChecklistStates(userId: number) {
  try {
    return await db
      .select()
      .from(indoorChecklists)
      .where(eq(indoorChecklists.userId, userId));
  } catch (error) {
    console.error('Database error in getChecklistStates:', error);
    throw new Error('Unable to load indoor checklist progress. Please try again later.', {
      cause: error,
    });
  }
}

export async function upsertChecklistItem(
  userId: number,
  room: string,
  itemKey: string,
  completed: boolean
) {
  try {
    const existing = await db
      .select()
      .from(indoorChecklists)
      .where(
        and(
          eq(indoorChecklists.userId, userId),
          eq(indoorChecklists.room, room),
          eq(indoorChecklists.itemKey, itemKey)
        )
      );

    if (existing.length > 0) {
      const updated = await db
        .update(indoorChecklists)
        .set({ completed, updatedAt: new Date() })
        .where(eq(indoorChecklists.id, existing[0].id))
        .returning();
      return updated[0];
    }

    const inserted = await db
      .insert(indoorChecklists)
      .values({
        userId,
        room,
        itemKey,
        completed,
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database error in upsertChecklistItem:', error);
    throw new Error('Unable to save checklist state. Please try again later.', { cause: error });
  }
}
