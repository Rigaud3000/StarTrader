import { type User, type InsertUser } from "@shared/schema";
import type {
  MT5Config,
  InsertMT5Config,
  Strategy,
  InsertStrategy,
  BacktestResult,
  RunBacktestInput,
  Trade,
  JournalEntry,
  InsertJournalEntry,
  MLInsight,
  DashboardStats,
  TradingStatus,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getMT5Config(): Promise<MT5Config | undefined>;
  updateMT5Config(config: Partial<MT5Config>): Promise<MT5Config>;
  
  getStrategies(): Promise<Strategy[]>;
  getStrategy(id: string): Promise<Strategy | undefined>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  updateStrategy(id: string, updates: Partial<Strategy>): Promise<Strategy | undefined>;
  deleteStrategy(id: string): Promise<boolean>;
  
  getBacktestResults(): Promise<BacktestResult[]>;
  createBacktestResult(result: Omit<BacktestResult, "id" | "createdAt">): Promise<BacktestResult>;
  
  getTrades(): Promise<Trade[]>;
  getOpenTrades(): Promise<Trade[]>;
  getRecentTrades(limit: number): Promise<Trade[]>;
  createTrade(trade: Omit<Trade, "id">): Promise<Trade>;
  updateTrade(id: string, updates: Partial<Trade>): Promise<Trade | undefined>;
  closeTrade(id: string): Promise<Trade | undefined>;
  
  getJournalEntries(): Promise<JournalEntry[]>;
  getRecentJournalEntries(limit: number): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  
  getMLInsights(): Promise<MLInsight[]>;
  createMLInsight(insight: Omit<MLInsight, "id" | "createdAt">): Promise<MLInsight>;
  
  getDashboardStats(): Promise<DashboardStats>;
  getEquityCurve(): Promise<{ time: string; equity: number }[]>;
  
  getTradingStatus(): Promise<TradingStatus>;
  updateTradingStatus(status: Partial<TradingStatus>): Promise<TradingStatus>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private mt5Config: MT5Config | undefined;
  private strategies: Map<string, Strategy>;
  private backtestResults: Map<string, BacktestResult>;
  private trades: Map<string, Trade>;
  private journalEntries: Map<string, JournalEntry>;
  private mlInsights: Map<string, MLInsight>;
  private tradingStatus: TradingStatus;
  private equityCurve: { time: string; equity: number }[];

  constructor() {
    this.users = new Map();
    this.strategies = new Map();
    this.backtestResults = new Map();
    this.trades = new Map();
    this.journalEntries = new Map();
    this.mlInsights = new Map();
    this.equityCurve = [];
    
    this.tradingStatus = {
      isActive: false,
      activeStrategies: [],
      lastUpdate: new Date().toISOString(),
      pendingOrders: 0,
      openPositions: 0,
    };
    
    this.initializeSampleData();
  }

  private initializeSampleData() {
    this.mt5Config = {
      id: randomUUID(),
      login: "",
      password: "",
      server: "",
      connected: false,
      accountBalance: 10000,
      accountEquity: 10000,
      accountProfit: 0,
      lastConnected: null,
    };

    const strategy1: Strategy = {
      id: randomUUID(),
      name: "SMA Crossover",
      description: "Simple Moving Average crossover strategy using 10 and 20 period SMAs",
      filename: "sma_crossover.py",
      content: `# SMA Crossover Strategy
import MetaTrader5 as mt5
import pandas as pd

def execute_strategy(symbol, short_period=10, long_period=20):
    rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_H1, 0, 100)
    df = pd.DataFrame(rates)
    df['sma_short'] = df['close'].rolling(window=short_period).mean()
    df['sma_long'] = df['close'].rolling(window=long_period).mean()
    
    if df['sma_short'].iloc[-1] > df['sma_long'].iloc[-1]:
        return "BUY"
    elif df['sma_short'].iloc[-1] < df['sma_long'].iloc[-1]:
        return "SELL"
    return "HOLD"`,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastRun: new Date(Date.now() - 3600000).toISOString(),
      totalTrades: 45,
      winRate: 62.5,
      totalProfit: 1250.50,
    };

    const strategy2: Strategy = {
      id: randomUUID(),
      name: "RSI Reversal",
      description: "RSI-based mean reversion strategy for oversold/overbought conditions",
      filename: "rsi_reversal.py",
      content: `# RSI Reversal Strategy
import MetaTrader5 as mt5
import pandas as pd

def calculate_rsi(data, period=14):
    delta = data.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def execute_strategy(symbol, rsi_period=14, oversold=30, overbought=70):
    rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_H1, 0, 100)
    df = pd.DataFrame(rates)
    df['rsi'] = calculate_rsi(df['close'], rsi_period)
    
    if df['rsi'].iloc[-1] < oversold:
        return "BUY"
    elif df['rsi'].iloc[-1] > overbought:
        return "SELL"
    return "HOLD"`,
      isActive: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      lastRun: new Date(Date.now() - 7200000).toISOString(),
      totalTrades: 28,
      winRate: 54.2,
      totalProfit: 450.25,
    };

    this.strategies.set(strategy1.id, strategy1);
    this.strategies.set(strategy2.id, strategy2);

    const insight1: MLInsight = {
      id: randomUUID(),
      type: "PATTERN",
      title: "Double Bottom Pattern Detected",
      description: "A double bottom pattern has been identified on EURUSD H4 timeframe, suggesting potential bullish reversal.",
      confidence: 0.78,
      symbol: "EURUSD",
      predictedDirection: "BULLISH",
      predictedChange: 1.25,
      features: { rsi: 35.2, macd: -0.0012, volume_ratio: 1.45 },
      createdAt: new Date().toISOString(),
    };

    const insight2: MLInsight = {
      id: randomUUID(),
      type: "PREDICTION",
      title: "GBPUSD Bearish Momentum",
      description: "Neural network predicts continued bearish momentum for GBPUSD based on recent price action and market sentiment.",
      confidence: 0.65,
      symbol: "GBPUSD",
      predictedDirection: "BEARISH",
      predictedChange: -0.85,
      features: { trend_strength: -0.72, volatility: 0.45, sentiment: -0.3 },
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    };

    const insight3: MLInsight = {
      id: randomUUID(),
      type: "RISK_ALERT",
      title: "High Volatility Warning",
      description: "Unusual market volatility detected across major pairs. Consider reducing position sizes.",
      confidence: 0.92,
      symbol: null,
      predictedDirection: null,
      predictedChange: null,
      features: { vix_equivalent: 28.5, avg_spread_increase: 1.8 },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    };

    this.mlInsights.set(insight1.id, insight1);
    this.mlInsights.set(insight2.id, insight2);
    this.mlInsights.set(insight3.id, insight3);

    const journalEntry1: JournalEntry = {
      id: randomUUID(),
      tradeId: null,
      type: "INSIGHT",
      title: "Market Analysis - Asian Session",
      content: "Observed strong support at 1.0850 on EURUSD. The Asian session showed consolidation with low volume. Expecting breakout during London open.",
      symbol: "EURUSD",
      profit: null,
      tags: ["analysis", "support", "eurusd"],
      createdAt: new Date().toISOString(),
    };

    const journalEntry2: JournalEntry = {
      id: randomUUID(),
      tradeId: null,
      type: "TRADE",
      title: "GBPUSD Short Entry",
      content: "Entered short position after bearish engulfing candle on H4. Stop loss above the high, targeting 1:2 risk-reward.",
      symbol: "GBPUSD",
      profit: 125.50,
      tags: ["trade", "short", "gbpusd"],
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    };

    this.journalEntries.set(journalEntry1.id, journalEntry1);
    this.journalEntries.set(journalEntry2.id, journalEntry2);

    for (let i = 0; i < 30; i++) {
      this.equityCurve.push({
        time: new Date(Date.now() - (30 - i) * 86400000).toLocaleDateString(),
        equity: 10000 + Math.random() * 2000 - 500 + i * 50,
      });
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMT5Config(): Promise<MT5Config | undefined> {
    return this.mt5Config;
  }

  async updateMT5Config(config: Partial<MT5Config>): Promise<MT5Config> {
    this.mt5Config = { ...this.mt5Config!, ...config };
    return this.mt5Config;
  }

  async getStrategies(): Promise<Strategy[]> {
    return Array.from(this.strategies.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getStrategy(id: string): Promise<Strategy | undefined> {
    return this.strategies.get(id);
  }

  async createStrategy(strategy: InsertStrategy): Promise<Strategy> {
    const id = randomUUID();
    const newStrategy: Strategy = {
      ...strategy,
      id,
      description: strategy.description || "",
      isActive: false,
      createdAt: new Date().toISOString(),
      lastRun: null,
      totalTrades: 0,
      winRate: 0,
      totalProfit: 0,
    };
    this.strategies.set(id, newStrategy);
    return newStrategy;
  }

  async updateStrategy(id: string, updates: Partial<Strategy>): Promise<Strategy | undefined> {
    const strategy = this.strategies.get(id);
    if (!strategy) return undefined;
    const updated = { ...strategy, ...updates };
    this.strategies.set(id, updated);
    return updated;
  }

  async deleteStrategy(id: string): Promise<boolean> {
    return this.strategies.delete(id);
  }

  async getBacktestResults(): Promise<BacktestResult[]> {
    return Array.from(this.backtestResults.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createBacktestResult(result: Omit<BacktestResult, "id" | "createdAt">): Promise<BacktestResult> {
    const id = randomUUID();
    const newResult: BacktestResult = {
      ...result,
      id,
      createdAt: new Date().toISOString(),
    };
    this.backtestResults.set(id, newResult);
    return newResult;
  }

  async getTrades(): Promise<Trade[]> {
    return Array.from(this.trades.values()).sort(
      (a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime()
    );
  }

  async getOpenTrades(): Promise<Trade[]> {
    return Array.from(this.trades.values())
      .filter((t) => t.status === "OPEN")
      .sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime());
  }

  async getRecentTrades(limit: number): Promise<Trade[]> {
    return Array.from(this.trades.values())
      .sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime())
      .slice(0, limit);
  }

  async createTrade(trade: Omit<Trade, "id">): Promise<Trade> {
    const id = randomUUID();
    const newTrade: Trade = { ...trade, id };
    this.trades.set(id, newTrade);
    return newTrade;
  }

  async updateTrade(id: string, updates: Partial<Trade>): Promise<Trade | undefined> {
    const trade = this.trades.get(id);
    if (!trade) return undefined;
    const updated = { ...trade, ...updates };
    this.trades.set(id, updated);
    return updated;
  }

  async closeTrade(id: string): Promise<Trade | undefined> {
    const trade = this.trades.get(id);
    if (!trade) return undefined;
    const closed = {
      ...trade,
      status: "CLOSED" as const,
      closeTime: new Date().toISOString(),
    };
    this.trades.set(id, closed);
    return closed;
  }

  async getJournalEntries(): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getRecentJournalEntries(limit: number): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const id = randomUUID();
    const newEntry: JournalEntry = {
      id,
      tradeId: entry.tradeId ?? null,
      type: entry.type,
      title: entry.title,
      content: entry.content,
      symbol: entry.symbol ?? null,
      profit: entry.profit ?? null,
      tags: entry.tags || [],
      createdAt: new Date().toISOString(),
    };
    this.journalEntries.set(id, newEntry);
    return newEntry;
  }

  async getMLInsights(): Promise<MLInsight[]> {
    return Array.from(this.mlInsights.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createMLInsight(insight: Omit<MLInsight, "id" | "createdAt">): Promise<MLInsight> {
    const id = randomUUID();
    const newInsight: MLInsight = {
      ...insight,
      id,
      createdAt: new Date().toISOString(),
    };
    this.mlInsights.set(id, newInsight);
    return newInsight;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const trades = Array.from(this.trades.values());
    const closedTrades = trades.filter((t) => t.status === "CLOSED");
    const openTrades = trades.filter((t) => t.status === "OPEN");
    const activeStrategies = Array.from(this.strategies.values()).filter((s) => s.isActive);

    const totalProfit = closedTrades.reduce((sum, t) => sum + t.profit, 0);
    const winningTrades = closedTrades.filter((t) => t.profit > 0).length;
    const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

    return {
      totalProfit: totalProfit + (this.mt5Config?.accountProfit ?? 0),
      winRate,
      activeStrategies: activeStrategies.length,
      currentDrawdown: Math.random() * 5,
      totalTrades: trades.length,
      openPositions: openTrades.length,
      accountBalance: this.mt5Config?.accountBalance ?? 10000,
      accountEquity: this.mt5Config?.accountEquity ?? 10000,
    };
  }

  async getEquityCurve(): Promise<{ time: string; equity: number }[]> {
    return this.equityCurve;
  }

  async getTradingStatus(): Promise<TradingStatus> {
    const openTrades = await this.getOpenTrades();
    return {
      ...this.tradingStatus,
      openPositions: openTrades.length,
      lastUpdate: new Date().toISOString(),
    };
  }

  async updateTradingStatus(status: Partial<TradingStatus>): Promise<TradingStatus> {
    this.tradingStatus = { ...this.tradingStatus, ...status, lastUpdate: new Date().toISOString() };
    return this.tradingStatus;
  }
}

export const storage = new MemStorage();
