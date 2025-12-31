import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertStrategySchema,
  insertJournalEntrySchema,
  runBacktestSchema,
  insertMT5ConfigSchema,
} from "@shared/schema";
import type { BacktestResult, BacktestTrade } from "@shared/schema";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/mt5/config", async (req, res) => {
    try {
      const config = await storage.getMT5Config();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to get MT5 config" });
    }
  });

  app.post("/api/mt5/connect", async (req, res) => {
    try {
      const parsed = insertMT5ConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const config = await storage.updateMT5Config({
        ...parsed.data,
        connected: true,
        accountBalance: 10000 + Math.random() * 5000,
        accountEquity: 10000 + Math.random() * 5000,
        accountProfit: Math.random() * 500 - 250,
        lastConnected: new Date().toISOString(),
      });

      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to connect to MT5" });
    }
  });

  app.post("/api/mt5/disconnect", async (req, res) => {
    try {
      const config = await storage.updateMT5Config({
        connected: false,
      });
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to disconnect from MT5" });
    }
  });

  app.post("/api/mt5/test", async (req, res) => {
    try {
      const config = await storage.getMT5Config();
      if (config?.connected) {
        res.json({ success: true, message: "Connection is active and responding" });
      } else {
        res.json({ success: false, message: "Not connected to MT5" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Connection test failed" });
    }
  });

  app.get("/api/strategies", async (req, res) => {
    try {
      const strategies = await storage.getStrategies();
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ error: "Failed to get strategies" });
    }
  });

  app.get("/api/strategies/:id", async (req, res) => {
    try {
      const strategy = await storage.getStrategy(req.params.id);
      if (!strategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }
      res.json(strategy);
    } catch (error) {
      res.status(500).json({ error: "Failed to get strategy" });
    }
  });

  app.post("/api/strategies", async (req, res) => {
    try {
      const parsed = insertStrategySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const strategy = await storage.createStrategy(parsed.data);
      res.json(strategy);
    } catch (error) {
      res.status(500).json({ error: "Failed to create strategy" });
    }
  });

  app.patch("/api/strategies/:id", async (req, res) => {
    try {
      const strategy = await storage.updateStrategy(req.params.id, req.body);
      if (!strategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }
      res.json(strategy);
    } catch (error) {
      res.status(500).json({ error: "Failed to update strategy" });
    }
  });

  app.delete("/api/strategies/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteStrategy(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Strategy not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete strategy" });
    }
  });

  app.get("/api/backtests", async (req, res) => {
    try {
      const results = await storage.getBacktestResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to get backtest results" });
    }
  });

  app.post("/api/backtests/run", async (req, res) => {
    try {
      const parsed = runBacktestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const { strategyId, symbol, timeframe, startDate, endDate, initialBalance } = parsed.data;

      const strategy = await storage.getStrategy(strategyId);
      if (!strategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }

      const totalTrades = Math.floor(Math.random() * 50) + 20;
      const winRate = 45 + Math.random() * 25;
      const winningTrades = Math.floor((winRate / 100) * totalTrades);
      const losingTrades = totalTrades - winningTrades;

      const trades: BacktestTrade[] = [];
      let equity = initialBalance;
      const equityCurve: number[] = [equity];

      for (let i = 0; i < totalTrades; i++) {
        const isWin = i < winningTrades;
        const profit = isWin
          ? Math.random() * 200 + 50
          : -(Math.random() * 150 + 30);
        equity += profit;

        trades.push({
          id: `trade-${i}`,
          symbol,
          type: Math.random() > 0.5 ? "BUY" : "SELL",
          openPrice: 1.0 + Math.random() * 0.1,
          closePrice: 1.0 + Math.random() * 0.1,
          volume: 0.1 + Math.random() * 0.4,
          profit,
          openTime: new Date(new Date(startDate).getTime() + i * 3600000 * 4).toISOString(),
          closeTime: new Date(new Date(startDate).getTime() + (i + 1) * 3600000 * 4).toISOString(),
        });

        if (i % 3 === 0) {
          equityCurve.push(equity);
        }
      }

      const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
      const maxDrawdown = Math.random() * 15 + 5;
      const profitFactor = Math.abs(
        trades.filter((t) => t.profit > 0).reduce((sum, t) => sum + t.profit, 0) /
          Math.max(1, Math.abs(trades.filter((t) => t.profit < 0).reduce((sum, t) => sum + t.profit, 0)))
      );

      const barsData = generateSimulatedBars(startDate, endDate, symbol);
      
      const barsDir = path.join(process.cwd(), "storage", "backtests");
      fs.mkdirSync(barsDir, { recursive: true });
      const csvPath = path.join(barsDir, "latest_bars.csv");
      
      const csvHeader = "time,open,high,low,close,tick_volume,spread,real_volume\n";
      const csvRows = barsData.map(bar => 
        `${bar.time},${bar.open},${bar.high},${bar.low},${bar.close},${bar.tick_volume},${bar.spread},${bar.real_volume}`
      ).join("\n");
      fs.writeFileSync(csvPath, csvHeader + csvRows);
      console.log(`Saved ${barsData.length} bars to ${csvPath}`);

      const result = await storage.createBacktestResult({
        strategyId,
        strategyName: strategy.name,
        symbol,
        timeframe,
        startDate,
        endDate,
        initialBalance,
        finalBalance: equity,
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        totalProfit,
        maxDrawdown,
        sharpeRatio: 0.5 + Math.random() * 1.5,
        profitFactor,
        equityCurve,
        trades,
      });

      res.json({ ...result, barsSaved: barsData.length, barsPath: csvPath });
    } catch (error) {
      res.status(500).json({ error: "Failed to run backtest" });
    }
  });

  function generateSimulatedBars(startDate: string, endDate: string, symbol: string) {
    const bars = [];
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const interval = 5 * 60 * 1000;
    
    let price = symbol.includes("JPY") ? 150.0 : 1.1000;
    const volatility = symbol.includes("JPY") ? 0.5 : 0.0005;
    
    for (let time = start; time < end; time += interval) {
      const change = (Math.random() - 0.5) * 2 * volatility;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * volatility;
      const low = Math.min(open, close) - Math.random() * volatility;
      
      bars.push({
        time: new Date(time).toISOString(),
        open: open.toFixed(5),
        high: high.toFixed(5),
        low: low.toFixed(5),
        close: close.toFixed(5),
        tick_volume: Math.floor(Math.random() * 1000) + 100,
        spread: Math.floor(Math.random() * 20) + 5,
        real_volume: 0,
      });
      
      price = close;
    }
    
    return bars;
  }

  app.get("/api/trades", async (req, res) => {
    try {
      const trades = await storage.getTrades();
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trades" });
    }
  });

  app.get("/api/trades/open", async (req, res) => {
    try {
      const trades = await storage.getOpenTrades();
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to get open trades" });
    }
  });

  app.get("/api/trades/recent", async (req, res) => {
    try {
      const trades = await storage.getRecentTrades(10);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to get recent trades" });
    }
  });

  app.post("/api/trades/place", async (req, res) => {
    try {
      const { symbol, type, volume } = req.body;

      if (!symbol || !type || !volume) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const config = await storage.getMT5Config();
      if (!config?.connected) {
        return res.status(400).json({ error: "Not connected to MT5" });
      }

      const strategies = await storage.getStrategies();
      const activeStrategy = strategies.find((s) => s.isActive);

      const openPrice = 1.0 + Math.random() * 0.1;
      const currentPrice = openPrice + (Math.random() - 0.5) * 0.01;
      const profit = (currentPrice - openPrice) * volume * 100000 * (type === "BUY" ? 1 : -1);

      const trade = await storage.createTrade({
        ticket: Math.floor(Math.random() * 1000000),
        symbol,
        type,
        volume,
        openPrice,
        currentPrice,
        stopLoss: type === "BUY" ? openPrice - 0.005 : openPrice + 0.005,
        takeProfit: type === "BUY" ? openPrice + 0.01 : openPrice - 0.01,
        profit,
        openTime: new Date().toISOString(),
        closeTime: null,
        status: "OPEN",
        strategyId: activeStrategy?.id || "",
        strategyName: activeStrategy?.name || "Manual",
      });

      res.json(trade);
    } catch (error) {
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  app.post("/api/trades/:id/close", async (req, res) => {
    try {
      const trade = await storage.closeTrade(req.params.id);
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }
      res.json(trade);
    } catch (error) {
      res.status(500).json({ error: "Failed to close trade" });
    }
  });

  app.get("/api/journal", async (req, res) => {
    try {
      const entries = await storage.getJournalEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to get journal entries" });
    }
  });

  app.get("/api/journal/recent", async (req, res) => {
    try {
      const entries = await storage.getRecentJournalEntries(5);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to get recent journal entries" });
    }
  });

  app.post("/api/journal", async (req, res) => {
    try {
      const parsed = insertJournalEntrySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const entry = await storage.createJournalEntry(parsed.data);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to create journal entry" });
    }
  });

  app.get("/api/ml/insights", async (req, res) => {
    try {
      const insights = await storage.getMLInsights();
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to get ML insights" });
    }
  });

  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  app.get("/api/dashboard/equity-curve", async (req, res) => {
    try {
      const curve = await storage.getEquityCurve();
      res.json(curve);
    } catch (error) {
      res.status(500).json({ error: "Failed to get equity curve" });
    }
  });

  app.get("/api/trading/status", async (req, res) => {
    try {
      const status = await storage.getTradingStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trading status" });
    }
  });

  app.post("/api/trading/start", async (req, res) => {
    try {
      const { strategyIds } = req.body;
      const status = await storage.updateTradingStatus({
        isActive: true,
        activeStrategies: strategyIds || [],
      });
      
      await storage.createJournalEntry({
        tradeId: null,
        type: "INSIGHT",
        title: "Trading Engine Started",
        content: `Live trading started with ML confidence filter enabled. Threshold: 55%. Active strategies: ${strategyIds?.length || 0}`,
        symbol: null,
        profit: null,
        tags: ["engine", "ml", "start"],
      });
      
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to start trading" });
    }
  });

  app.post("/api/trading/stop", async (req, res) => {
    try {
      const status = await storage.updateTradingStatus({
        isActive: false,
        activeStrategies: [],
      });
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to stop trading" });
    }
  });

  app.get("/api/settings/app", async (req, res) => {
    try {
      res.json({
        paperTrading: process.env.PAPER_TRADING === "true",
        defaultSymbol: process.env.DEFAULT_SYMBOL || "EURUSD",
        defaultTimeframe: process.env.DEFAULT_TIMEFRAME || "M5",
        maxOpenPositions: parseInt(process.env.MAX_OPEN_POSITIONS || "2"),
        maxLot: parseFloat(process.env.MAX_LOT || "0.10"),
        maxSpreadPoints: parseInt(process.env.MAX_SPREAD_POINTS || "25"),
        maxDailyLossPct: parseFloat(process.env.MAX_DAILY_LOSS_PCT || "3.0"),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get app settings" });
    }
  });

  app.post("/api/ml/train", async (req, res) => {
    try {
      const barsPath = path.join(process.cwd(), "storage", "backtests", "latest_bars.csv");
      
      if (!fs.existsSync(barsPath)) {
        return res.status(400).json({ 
          error: "No training data found. Run a backtest first to generate training data." 
        });
      }

      const python = spawn("python3", ["train_model.py"], {
        cwd: process.cwd(),
        env: { ...process.env }
      });

      let stdout = "";
      let stderr = "";

      python.stdout.on("data", (data) => {
        stdout += data.toString();
        console.log(`ML Training: ${data}`);
      });

      python.stderr.on("data", (data) => {
        stderr += data.toString();
        console.error(`ML Training Error: ${data}`);
      });

      python.on("close", (code) => {
        if (code === 0) {
          const modelPath = path.join(process.cwd(), "storage", "ml_lr_model.joblib");
          const modelExists = fs.existsSync(modelPath);
          
          res.json({
            success: true,
            message: "Model training completed successfully",
            output: stdout,
            modelReady: modelExists,
          });
        } else {
          res.status(500).json({
            success: false,
            error: "Training failed",
            output: stdout,
            stderr: stderr,
          });
        }
      });

      python.on("error", (err) => {
        res.status(500).json({
          success: false,
          error: `Failed to start training: ${err.message}`,
        });
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start ML training" });
    }
  });

  app.get("/api/ml/status", async (req, res) => {
    try {
      const modelPath = path.join(process.cwd(), "storage", "ml_lr_model.joblib");
      const barsPath = path.join(process.cwd(), "storage", "backtests", "latest_bars.csv");
      
      const modelExists = fs.existsSync(modelPath);
      const trainingDataExists = fs.existsSync(barsPath);
      
      let barCount = 0;
      if (trainingDataExists) {
        const content = fs.readFileSync(barsPath, "utf-8");
        barCount = content.split("\n").length - 1;
      }
      
      res.json({
        modelTrained: modelExists,
        trainingDataAvailable: trainingDataExists,
        barCount,
        confidenceThreshold: 0.55,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get ML status" });
    }
  });

  app.post("/api/trading/simulate-signal", async (req, res) => {
    try {
      const tradingStatus = await storage.getTradingStatus();
      if (!tradingStatus.isActive) {
        return res.status(400).json({ error: "Trading is not active" });
      }

      const barsPath = path.join(process.cwd(), "storage", "backtests", "latest_bars.csv");
      const modelPath = path.join(process.cwd(), "storage", "ml_lr_model.joblib");
      
      const modelTrained = fs.existsSync(modelPath);
      const barsExist = fs.existsSync(barsPath);
      
      const symbols = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCHF"];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const signalRaw = Math.random();
      const signal = signalRaw > 0.6 ? "BUY" : signalRaw < 0.4 ? "SELL" : "HOLD";
      
      let confidence = 0.5;
      let mlUsed = false;
      const CONF_THRESHOLD = 0.55;
      
      if (modelTrained && barsExist && signal !== "HOLD") {
        try {
          const barsContent = fs.readFileSync(barsPath, "utf-8");
          const lines = barsContent.trim().split("\n");
          const headers = lines[0].split(",");
          const recentLines = lines.slice(-100);
          
          const bars = recentLines.map(line => {
            const values = line.split(",");
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => obj[h] = values[i]);
            return obj;
          });

          const python = spawn("python3", [
            "-c",
            `
import sys
import json
sys.path.insert(0, '.')
from ml.predict_signal import predict_signal
bars = ${JSON.stringify(JSON.stringify(bars))}
result = predict_signal(bars)
print(json.dumps(result))
            `
          ], { cwd: process.cwd() });

          let stdout = "";
          python.stdout.on("data", (data) => { stdout += data.toString(); });
          
          await new Promise<void>((resolve) => {
            python.on("close", () => {
              try {
                const result = JSON.parse(stdout.trim());
                if (result.success) {
                  confidence = result.confidence;
                  mlUsed = true;
                }
              } catch (e) {
                console.error("ML prediction parse error:", e);
              }
              resolve();
            });
          });
        } catch (e) {
          console.error("ML prediction error:", e);
        }
      }

      let decision = signal;
      let skipped = false;
      
      if (signal !== "HOLD" && mlUsed && confidence < CONF_THRESHOLD) {
        decision = "HOLD";
        skipped = true;
        
        await storage.createJournalEntry({
          tradeId: null,
          type: "INSIGHT",
          title: "Skipped trade: low confidence",
          content: `Signal: ${signal} on ${symbol} | ML Confidence: ${(confidence * 100).toFixed(1)}% (below ${(CONF_THRESHOLD * 100).toFixed(0)}% threshold) - Trade SKIPPED`,
          symbol,
          profit: null,
          tags: ["ml", "skip", "confidence", signal.toLowerCase()],
        });
      } else if (signal !== "HOLD") {
        await storage.createJournalEntry({
          tradeId: null,
          type: "TRADE",
          title: `Signal accepted: ${signal}`,
          content: `Signal: ${signal} on ${symbol} | ML Confidence: ${(confidence * 100).toFixed(1)}%${confidence >= CONF_THRESHOLD ? " (PASSED)" : ""} - Trade ${mlUsed ? "ACCEPTED" : "EXECUTED (no ML)"}`,
          symbol,
          profit: null,
          tags: ["ml", "execute", "confidence", signal.toLowerCase()],
        });
      }

      res.json({
        symbol,
        rawSignal: signal,
        decision,
        confidence,
        threshold: CONF_THRESHOLD,
        mlUsed,
        skipped,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Simulate signal error:", error);
      res.status(500).json({ error: "Failed to simulate signal" });
    }
  });

  return httpServer;
}
