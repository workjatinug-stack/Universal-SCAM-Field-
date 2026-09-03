import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing Manus OAuth and JWT-signed session flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const scamScans = mysqlTable("scamScans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sourceType: varchar("sourceType", { length: 32 }).notNull(),
  contentPreview: text("contentPreview").notNull(),
  riskScore: int("riskScore").notNull(),
  riskBand: varchar("riskBand", { length: 32 }).notNull(),
  scamType: varchar("scamType", { length: 96 }).notNull(),
  reasonsJson: text("reasonsJson").notNull(),
  recommendation: text("recommendation").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const communityReports = mysqlTable("communityReports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  category: varchar("category", { length: 64 }).notNull(),
  description: text("description").notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  status: mysqlEnum("status", ["reviewing", "verified", "resolved"]).default("reviewing").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ScamScan = typeof scamScans.$inferSelect;
export type InsertScamScan = typeof scamScans.$inferInsert;
export type CommunityReport = typeof communityReports.$inferSelect;
export type InsertCommunityReport = typeof communityReports.$inferInsert;
