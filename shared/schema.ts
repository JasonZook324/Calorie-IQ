import { sql, relations } from "drizzle-orm";
import { pgTable, text, serial, date, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with email-based authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  dailyEntries: many(dailyEntries),
}));

// Daily entries for calories, weight, and optional macros
export const dailyEntries = pgTable("daily_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  calories: integer("calories").notNull(),
  weight: real("weight"),
  protein: integer("protein"),
  carbs: integer("carbs"),
  fat: integer("fat"),
});

export const dailyEntriesRelations = relations(dailyEntries, ({ one }) => ({
  user: one(users, {
    fields: [dailyEntries.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDailyEntrySchema = createInsertSchema(dailyEntries).omit({
  id: true,
  userId: true,
});

// Extended validation schemas
export const loginSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = loginSchema;

export const dailyEntryFormSchema = insertDailyEntrySchema.extend({
  date: z.string().min(1, "Date is required"),
  calories: z.number().min(0, "Calories must be positive").max(20000, "Calories seem too high"),
  weight: z.number().min(20, "Weight must be at least 20").max(1000, "Weight seems too high").nullable().optional(),
  protein: z.number().min(0).max(1000).nullable().optional(),
  carbs: z.number().min(0).max(2000).nullable().optional(),
  fat: z.number().min(0).max(1000).nullable().optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDailyEntry = z.infer<typeof insertDailyEntrySchema>;
export type DailyEntry = typeof dailyEntries.$inferSelect;

// Calculated metrics type (computed on the fly)
export type CalculatedMetrics = {
  maintenanceCalories: number | null;
  dailyDeficit: number | null;
  weeklyDeficit: number | null;
  rollingAvgCalories7Day: number | null;
  rollingAvgCalories14Day: number | null;
  rollingAvgDeficit7Day: number | null;
  rollingAvgWeight7Day: number | null;
  weightChange7Day: number | null;
};
