import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  FlaskConical,
  Play,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  BarChart3,
  History,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import type { Strategy, BacktestResult, RunBacktestInput } from "@shared/schema";

const SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "NZDUSD", "USDCHF", "XAUUSD"];
const TIMEFRAMES = [
  { value: "M1", label: "1 Minute" },
  { value: "M5", label: "5 Minutes" },
  { value: "M15", label: "15 Minutes" },
  { value: "M30", label: "30 Minutes" },
  { value: "H1", label: "1 Hour" },
  { value: "H4", label: "4 Hours" },
  { value: "D1", label: "Daily" },
];

interface MetricProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

function MetricBadge({ label, value, icon, trend }: MetricProps) {
  return (
    <div className="p-4 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <span
        className={`text-lg font-bold font-mono ${
          trend === "up"
            ? "text-green-500"
            : trend === "down"
            ? "text-red-500"
            : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function Backtesting() {
  const { toast } = useToast();
  const [strategyId, setStrategyId] = useState("");
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [initialBalance, setInitialBalance] = useState("10000");
  const [activeResult, setActiveResult] = useState<BacktestResult | null>(null);

  const { data: strategies, isLoading: strategiesLoading } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies"],
  });

  const { data: backtestHistory, isLoading: historyLoading } = useQuery<BacktestResult[]>({
    queryKey: ["/api/backtests"],
  });

  const backtestMutation = useMutation({
    mutationFn: async (data: RunBacktestInput) => {
      const response = await apiRequest("POST", "/api/backtests/run", data);
      return response as BacktestResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/backtests"] });
      setActiveResult(result);
      toast({
        title: "Backtest Complete",
        description: `Completed ${result.totalTrades} trades with ${result.winRate.toFixed(1)}% win rate`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Backtest Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRunBacktest = () => {
    if (!strategyId || !symbol || !timeframe || !startDate || !endDate) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    backtestMutation.mutate({
      strategyId,
      symbol,
      timeframe,
      startDate,
      endDate,
      initialBalance: parseFloat(initialBalance) || 10000,
    });
  };

  const equityCurveData = activeResult?.equityCurve?.map((equity, index) => ({
    time: index + 1,
    equity,
  })) || [];

  const tradeDistribution = activeResult ? [
    { name: "Winning", value: activeResult.winningTrades, fill: "hsl(142 76% 36%)" },
    { name: "Losing", value: activeResult.losingTrades, fill: "hsl(0 84% 60%)" },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-backtesting">
            <FlaskConical className="w-8 h-8" />
            Backtesting Lab
          </h1>
          <p className="text-muted-foreground mt-1">
            Test your strategies on historical data
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="strategy">Strategy</Label>
              <Select value={strategyId} onValueChange={setStrategyId}>
                <SelectTrigger data-testid="select-strategy">
                  <SelectValue placeholder="Select a strategy" />
                </SelectTrigger>
                <SelectContent>
                  {strategiesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : strategies?.length ? (
                    strategies.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No strategies available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Select value={symbol} onValueChange={setSymbol}>
                  <SelectTrigger data-testid="select-symbol">
                    <SelectValue placeholder="Select symbol" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYMBOLS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeframe">Timeframe</Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger data-testid="select-timeframe">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAMES.map((tf) => (
                      <SelectItem key={tf.value} value={tf.value}>
                        {tf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-end-date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialBalance">Initial Balance ($)</Label>
              <Input
                id="initialBalance"
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                min="100"
                data-testid="input-initial-balance"
              />
            </div>

            <Button
              onClick={handleRunBacktest}
              disabled={backtestMutation.isPending}
              className="w-full"
              data-testid="button-run-backtest"
            >
              {backtestMutation.isPending ? (
                <>
                  <FlaskConical className="w-4 h-4 mr-2 animate-spin" />
                  Running Backtest...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Backtest
                </>
              )}
            </Button>

            {backtestMutation.isPending && (
              <Progress value={66} className="w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Backtest History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {historyLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))
              ) : backtestHistory?.length ? (
                backtestHistory.map((result) => (
                  <div
                    key={result.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      activeResult?.id === result.id
                        ? "bg-primary/10 border border-primary"
                        : "bg-muted/50 hover-elevate"
                    }`}
                    onClick={() => setActiveResult(result)}
                    data-testid={`backtest-result-${result.id}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{result.strategyName}</span>
                      <Badge
                        variant={result.totalProfit >= 0 ? "default" : "destructive"}
                        size="sm"
                      >
                        {result.totalProfit >= 0 ? "+" : ""}${result.totalProfit.toFixed(0)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{result.symbol}</span>
                      <span>{result.timeframe}</span>
                      <span>{result.winRate.toFixed(1)}% WR</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No backtest history</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {activeResult && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <CardTitle>
              Results: {activeResult.strategyName} on {activeResult.symbol}
            </CardTitle>
            <Button variant="outline" size="sm" data-testid="button-export-results">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="metrics" className="w-full">
              <TabsList>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="chart">Equity Chart</TabsTrigger>
                <TabsTrigger value="trades">Trades</TabsTrigger>
              </TabsList>

              <TabsContent value="metrics" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricBadge
                    label="Total Profit"
                    value={`$${activeResult.totalProfit.toFixed(2)}`}
                    icon={<DollarSign className="w-4 h-4" />}
                    trend={activeResult.totalProfit >= 0 ? "up" : "down"}
                  />
                  <MetricBadge
                    label="Win Rate"
                    value={`${activeResult.winRate.toFixed(1)}%`}
                    icon={<Target className="w-4 h-4" />}
                    trend={activeResult.winRate >= 50 ? "up" : "down"}
                  />
                  <MetricBadge
                    label="Max Drawdown"
                    value={`${activeResult.maxDrawdown.toFixed(2)}%`}
                    icon={<AlertTriangle className="w-4 h-4" />}
                    trend="down"
                  />
                  <MetricBadge
                    label="Profit Factor"
                    value={activeResult.profitFactor.toFixed(2)}
                    icon={<BarChart3 className="w-4 h-4" />}
                    trend={activeResult.profitFactor >= 1 ? "up" : "down"}
                  />
                  <MetricBadge
                    label="Sharpe Ratio"
                    value={activeResult.sharpeRatio.toFixed(2)}
                    icon={<TrendingUp className="w-4 h-4" />}
                    trend={activeResult.sharpeRatio >= 1 ? "up" : "neutral"}
                  />
                  <MetricBadge
                    label="Total Trades"
                    value={String(activeResult.totalTrades)}
                    icon={<TrendingUp className="w-4 h-4" />}
                  />
                  <MetricBadge
                    label="Winning Trades"
                    value={String(activeResult.winningTrades)}
                    icon={<TrendingUp className="w-4 h-4" />}
                    trend="up"
                  />
                  <MetricBadge
                    label="Losing Trades"
                    value={String(activeResult.losingTrades)}
                    icon={<TrendingDown className="w-4 h-4" />}
                    trend="down"
                  />
                </div>
              </TabsContent>

              <TabsContent value="chart" className="mt-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityCurveData}>
                      <defs>
                        <linearGradient id="backtestGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="time"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, "Equity"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="equity"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#backtestGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="trades" className="mt-4">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-card border-b border-border">
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="p-3">Symbol</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Volume</th>
                        <th className="p-3">Open</th>
                        <th className="p-3">Close</th>
                        <th className="p-3 text-right">P/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeResult.trades?.map((trade, index) => (
                        <tr key={trade.id || index} className="border-b border-border/50">
                          <td className="p-3 font-medium">{trade.symbol}</td>
                          <td className="p-3">
                            <Badge
                              variant={trade.type === "BUY" ? "default" : "destructive"}
                              size="sm"
                            >
                              {trade.type}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono">{trade.volume.toFixed(2)}</td>
                          <td className="p-3 font-mono">{trade.openPrice.toFixed(5)}</td>
                          <td className="p-3 font-mono">{trade.closePrice.toFixed(5)}</td>
                          <td
                            className={`p-3 text-right font-mono font-medium ${
                              trade.profit >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {trade.profit >= 0 ? "+" : ""}${trade.profit.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
