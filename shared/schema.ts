import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// MT5 Configuration
export interface MT5Config {
  id: string;
  login: string;
  password: string;
  server: string;
  connected: boolean;
  accountBalance: number;
  accountEquity: number;
  accountProfit: number;
  lastConnected: string | null;
}

export const insertMT5ConfigSchema = z.object({
  login: z.string().min(1, "Login is required"),
  password: z.string().min(1, "Password is required"),
  server: z.string().min(1, "Server is required"),
});

export type InsertMT5Config = z.infer<typeof insertMT5ConfigSchema>;

// Trading Strategy
export interface Strategy {
  id: string;
  name: string;
  description: string;
  filename: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  lastRun: string | null;
  totalTrades: number;
  winRate: number;
  totalProfit: number;
}

export const insertStrategySchema = z.object({
  name: z.string().min(1, "Strategy name is required"),
  description: z.string().optional().default(""),
  filename: z.string().min(1, "Filename is required"),
  content: z.string().min(1, "Strategy content is required"),
});

export type InsertStrategy = z.infer<typeof insertStrategySchema>;

// Backtest Result
export interface BacktestResult {
  id: string;
  strategyId: string;
  strategyName: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  finalBalance: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  equityCurve: number[];
  trades: BacktestTrade[];
  createdAt: string;
}

export interface BacktestTrade {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  openPrice: number;
  closePrice: number;
  volume: number;
  profit: number;
  openTime: string;
  closeTime: string;
}

export const runBacktestSchema = z.object({
  strategyId: z.string().min(1, "Strategy is required"),
  symbol: z.string().min(1, "Symbol is required"),
  timeframe: z.string().min(1, "Timeframe is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  initialBalance: z.number().min(100, "Minimum balance is 100"),
});

export type RunBacktestInput = z.infer<typeof runBacktestSchema>;

// Live Trade
export interface Trade {
  id: string;
  ticket: number;
  symbol: string;
  type: "BUY" | "SELL";
  volume: number;
  openPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  profit: number;
  openTime: string;
  closeTime: string | null;
  status: "OPEN" | "CLOSED" | "PENDING";
  strategyId: string;
  strategyName: string;
}

// Trading Journal Entry
export interface JournalEntry {
  id: string;
  tradeId: string | null;
  type: "TRADE" | "INSIGHT" | "NOTE" | "ALERT";
  title: string;
  content: string;
  symbol: string | null;
  profit: number | null;
  tags: string[];
  createdAt: string;
}

export const insertJournalEntrySchema = z.object({
  tradeId: z.string().nullable().optional(),
  type: z.enum(["TRADE", "INSIGHT", "NOTE", "ALERT"]),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  symbol: z.string().nullable().optional(),
  profit: z.number().nullable().optional(),
  tags: z.array(z.string()).default([]),
});

export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

// ML Insights
export interface MLInsight {
  id: string;
  type: "PATTERN" | "PREDICTION" | "RECOMMENDATION" | "RISK_ALERT";
  title: string;
  description: string;
  confidence: number;
  symbol: string | null;
  predictedDirection: "BULLISH" | "BEARISH" | "NEUTRAL" | null;
  predictedChange: number | null;
  features: Record<string, number>;
  createdAt: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalProfit: number;
  winRate: number;
  activeStrategies: number;
  currentDrawdown: number;
  totalTrades: number;
  openPositions: number;
  accountBalance: number;
  accountEquity: number;
}

// Market Data
export interface MarketTick {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  time: string;
}

export interface OHLC {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Trading Status
export interface TradingStatus {
  isActive: boolean;
  activeStrategies: string[];
  lastUpdate: string;
  pendingOrders: number;
  openPositions: number;
}
