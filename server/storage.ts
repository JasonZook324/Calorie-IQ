import { 
  users, 
  dailyEntries,
  type User, 
  type InsertUser,
  type DailyEntry,
  type InsertDailyEntry 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getEntriesByUserId(userId: number): Promise<DailyEntry[]>;
  getEntryById(id: number, userId: number): Promise<DailyEntry | undefined>;
  getEntryByDate(userId: number, date: string): Promise<DailyEntry | undefined>;
  createEntry(userId: number, entry: InsertDailyEntry): Promise<DailyEntry>;
  updateEntry(id: number, userId: number, entry: Partial<InsertDailyEntry>): Promise<DailyEntry | undefined>;
  deleteEntry(id: number, userId: number): Promise<boolean>;
  getEntriesInRange(userId: number, startDate: string, endDate: string): Promise<DailyEntry[]>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getEntriesByUserId(userId: number): Promise<DailyEntry[]> {
    return db
      .select()
      .from(dailyEntries)
      .where(eq(dailyEntries.userId, userId))
      .orderBy(desc(dailyEntries.date));
  }

  async getEntryById(id: number, userId: number): Promise<DailyEntry | undefined> {
    const [entry] = await db
      .select()
      .from(dailyEntries)
      .where(and(eq(dailyEntries.id, id), eq(dailyEntries.userId, userId)));
    return entry || undefined;
  }

  async getEntryByDate(userId: number, date: string): Promise<DailyEntry | undefined> {
    const [entry] = await db
      .select()
      .from(dailyEntries)
      .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, date)));
    return entry || undefined;
  }

  async createEntry(userId: number, entry: InsertDailyEntry): Promise<DailyEntry> {
    const [created] = await db
      .insert(dailyEntries)
      .values({ ...entry, userId })
      .returning();
    return created;
  }

  async updateEntry(id: number, userId: number, entry: Partial<InsertDailyEntry>): Promise<DailyEntry | undefined> {
    const [updated] = await db
      .update(dailyEntries)
      .set(entry)
      .where(and(eq(dailyEntries.id, id), eq(dailyEntries.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteEntry(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(dailyEntries)
      .where(and(eq(dailyEntries.id, id), eq(dailyEntries.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getEntriesInRange(userId: number, startDate: string, endDate: string): Promise<DailyEntry[]> {
    return db
      .select()
      .from(dailyEntries)
      .where(
        and(
          eq(dailyEntries.userId, userId),
          gte(dailyEntries.date, startDate),
          lte(dailyEntries.date, endDate)
        )
      )
      .orderBy(dailyEntries.date);
  }
}

export const storage = new DatabaseStorage();
