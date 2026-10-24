import { desc, eq } from "drizzle-orm";
import { communityReports, InsertCommunityReport, InsertScamScan, scamScans, users, InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getDb as getPooledDb } from "./_core/database";

// In-memory storage for development without database
const inMemoryScans: any[] = [];
const inMemoryReports: any[] = [];
let scanIdCounter = 1;
let reportIdCounter = 1;

export async function getDb() {
  try {
    return await getPooledDb();
  } catch (error) {
    // Database not available - return null for in-memory fallback
    return null;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function createScamScan(scan: InsertScamScan) {
  const db = await getDb();
  if (!db) {
    // In-memory fallback for development
    const scanWithId = { id: scanIdCounter++, ...scan, createdAt: new Date() };
    inMemoryScans.unshift(scanWithId);
    if (inMemoryScans.length > 50) inMemoryScans.pop();
    return scanWithId;
  }
  const result = await db.insert(scamScans).values(scan);
  return { id: Number(result[0].insertId), ...scan };
}

export async function getRecentScans(userId?: number) {
  const db = await getDb();
  if (!db) {
    // Return in-memory scans or demo data
    if (inMemoryScans.length > 0) {
      return inMemoryScans.slice(0, 20);
    }
    return [];
  }
  const query = userId ? db.select().from(scamScans).where(eq(scamScans.userId, userId)) : db.select().from(scamScans);
  return query.orderBy(desc(scamScans.createdAt)).limit(20);
}

export async function createCommunityReport(report: InsertCommunityReport) {
  const db = await getDb();
  if (!db) {
    // In-memory fallback for development
    const reportWithId = { id: reportIdCounter++, ...report, createdAt: new Date(), status: "reviewing" };
    inMemoryReports.unshift(reportWithId);
    if (inMemoryReports.length > 50) inMemoryReports.pop();
    return reportWithId;
  }
  const result = await db.insert(communityReports).values(report);
  return { id: Number(result[0].insertId), ...report };
}

export async function getCommunityReports() {
  const db = await getDb();
  if (!db) {
    // Return in-memory reports or demo data
    if (inMemoryReports.length > 0) {
      return inMemoryReports.slice(0, 50);
    }
    return [];
  }
  return db.select().from(communityReports).orderBy(desc(communityReports.createdAt)).limit(50);
}
