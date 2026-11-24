import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  selectedCity: text('selected_city').notNull().default('New Delhi'),
  selectedLat: doublePrecision('selected_lat').notNull().default(28.6139),
  selectedLon: doublePrecision('selected_lon').notNull().default(77.209),
  aqiThreshold: integer('aqi_threshold').notNull().default(201),
  notificationsEnabled: boolean('notifications_enabled').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const familyMembers = pgTable('family_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  ageGroup: text('age_group').notNull(),
  activityType: text('activity_type').notNull(),
  sensitivity: text('sensitivity').notNull(),
  outdoorExposure: text('outdoor_exposure').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dailyRoutines = pgTable('daily_routines', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  city: text('city').notNull(),
  aqiValue: integer('aqi_value').notNull(),
  aqiCategory: text('aqi_category').notNull(),
  sourceMode: text('source_mode').notNull(),
  morningJson: text('morning_json').notNull(),
  afternoonJson: text('afternoon_json').notNull(),
  eveningJson: text('evening_json').notNull(),
  nightJson: text('night_json').notNull(),
  summary: text('summary').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  city: text('city').notNull(),
  aqiValue: integer('aqi_value').notNull(),
  severity: text('severity').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const indoorChecklists = pgTable('indoor_checklists', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  room: text('room').notNull(),
  itemKey: text('item_key').notNull(),
  completed: boolean('completed').notNull().default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  familyMembers: many(familyMembers),
  dailyRoutines: many(dailyRoutines),
  alerts: many(alerts),
  indoorChecklists: many(indoorChecklists),
}));

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  user: one(users, {
    fields: [familyMembers.userId],
    references: [users.id],
  }),
}));

export const dailyRoutinesRelations = relations(dailyRoutines, ({ one }) => ({
  user: one(users, {
    fields: [dailyRoutines.userId],
    references: [users.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
}));

export const indoorChecklistsRelations = relations(indoorChecklists, ({ one }) => ({
  user: one(users, {
    fields: [indoorChecklists.userId],
    references: [users.id],
  }),
}));
