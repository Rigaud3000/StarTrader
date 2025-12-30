import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
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
} from "recharts";
import type { DashboardStats, Trade, JournalEntry } from "@shared/schema";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function MetricCard({ title, value, change, icon, isLoading }: MetricCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-32 mt-2" />
          <Skeleton className="h-4 w-20 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </span>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
            {icon}
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold font-mono" data-testid={`metric-${title.toLowerCase().replace(/\s/g, '-')}`}>
            {value}
          </span>
        </div>
        {change !== undefined && (
          <div className="flex items-center mt-2 gap-1">
            {change >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span
              className={`text-sm font-medium ${
                change >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 5000,
  });

  const { data: recentTrades, isLoading: tradesLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades/recent"],
    refetchInterval: 5000,
  });

  const { data: journalEntries, isLoading: journalLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal/recent"],
    refetchInterval: 10000,
  });

  const { data: equityCurve } = useQuery<{ time: string; equity: number }[]>({
    queryKey: ["/api/dashboard/equity-curve"],
    refetchInterval: 30000,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-dashboard">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of your trading performance
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Last updated: {new Date().toLocaleTimeString()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total P/L"
          value={`$${stats?.totalProfit?.toLocaleString() ?? "0"}`}
          change={stats?.totalProfit ? (stats.totalProfit / 10000) * 100 : 0}
          icon={<DollarSign className="w-4 h-4 text-muted-foreground" />}
          isLoading={statsLoading}
        />
        <MetricCard
          title="Win Rate"
          value={`${stats?.winRate?.toFixed(1) ?? "0"}%`}
          icon={<Target className="w-4 h-4 text-muted-foreground" />}
          isLoading={statsLoading}
        />
        <MetricCard
          title="Active Strategies"
          value={String(stats?.activeStrategies ?? 0)}
          icon={<Activity className="w-4 h-4 text-muted-foreground" />}
          isLoading={statsLoading}
        />
        <MetricCard
          title="Current Drawdown"
          value={`${stats?.currentDrawdown?.toFixed(2) ?? "0"}%`}
          icon={<AlertTriangle className="w-4 h-4 text-muted-foreground" />}
          isLoading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Equity Curve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {equityCurve && equityCurve.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityCurve}>
                    <defs>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#equityGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No equity data available</p>
                    <p className="text-sm">Start trading to see your equity curve</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Open Positions
            </CardTitle>
            <Badge variant="secondary" size="sm">
              {recentTrades?.filter((t) => t.status === "OPEN").length ?? 0}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tradesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))
              ) : recentTrades?.filter((t) => t.status === "OPEN").length ? (
                recentTrades
                  .filter((t) => t.status === "OPEN")
                  .slice(0, 5)
                  .map((trade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      data-testid={`position-${trade.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={trade.type === "BUY" ? "default" : "destructive"}
                          size="sm"
                        >
                          {trade.type}
                        </Badge>
                        <span className="font-medium">{trade.symbol}</span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-medium ${
                            trade.profit >= 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {trade.profit >= 0 ? "+" : ""}
                          ${trade.profit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No open positions</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {journalLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))
            ) : journalEntries?.length ? (
              journalEntries.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover-elevate"
                  data-testid={`journal-entry-${entry.id}`}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                      entry.type === "TRADE"
                        ? "bg-blue-500/10"
                        : entry.type === "INSIGHT"
                        ? "bg-purple-500/10"
                        : entry.type === "ALERT"
                        ? "bg-orange-500/10"
                        : "bg-muted"
                    }`}
                  >
                    {entry.type === "TRADE" ? (
                      <Activity className="w-5 h-5 text-blue-500" />
                    ) : entry.type === "INSIGHT" ? (
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                    ) : entry.type === "ALERT" ? (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    ) : (
                      <DollarSign className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{entry.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {entry.content}
                    </p>
                  </div>
                  <div className="text-right">
                    {entry.profit !== null && (
                      <span
                        className={`font-mono font-medium ${
                          entry.profit >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {entry.profit >= 0 ? "+" : ""}${entry.profit.toFixed(2)}
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
