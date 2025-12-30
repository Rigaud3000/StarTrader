import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Play,
  Square,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  X,
  Clock,
  Zap,
} from "lucide-react";
import type { Trade, TradingStatus, Strategy, MT5Config } from "@shared/schema";

const SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "NZDUSD", "USDCHF", "XAUUSD"];

export default function Trading() {
  const { toast } = useToast();
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [manualSymbol, setManualSymbol] = useState("");
  const [manualVolume, setManualVolume] = useState("0.1");
  const [manualType, setManualType] = useState<"BUY" | "SELL">("BUY");

  const { data: mt5Config } = useQuery<MT5Config>({
    queryKey: ["/api/mt5/config"],
    refetchInterval: 5000,
  });

  const { data: tradingStatus, isLoading: statusLoading } = useQuery<TradingStatus>({
    queryKey: ["/api/trading/status"],
    refetchInterval: 2000,
  });

  const { data: openTrades, isLoading: tradesLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades/open"],
    refetchInterval: 2000,
  });

  const { data: strategies } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies"],
  });

  const startTradingMutation = useMutation({
    mutationFn: async (strategyIds: string[]) => {
      return await apiRequest("POST", "/api/trading/start", { strategyIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trading/status"] });
      toast({
        title: "Trading Started",
        description: "Live trading is now active",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stopTradingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/trading/stop");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trading/status"] });
      setShowStopDialog(false);
      toast({
        title: "Trading Stopped",
        description: "All trading activities have been paused",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (order: { symbol: string; type: "BUY" | "SELL"; volume: number }) => {
      return await apiRequest("POST", "/api/trades/place", order);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades/open"] });
      toast({
        title: "Order Placed",
        description: `${manualType} order placed for ${manualSymbol}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const closePositionMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      return await apiRequest("POST", `/api/trades/${tradeId}/close`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades/open"] });
      toast({
        title: "Position Closed",
        description: "The position has been closed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePlaceOrder = () => {
    if (!manualSymbol || !manualVolume) {
      toast({
        title: "Missing Fields",
        description: "Please select a symbol and enter volume",
        variant: "destructive",
      });
      return;
    }
    placeOrderMutation.mutate({
      symbol: manualSymbol,
      type: manualType,
      volume: parseFloat(manualVolume),
    });
  };

  const isConnected = mt5Config?.connected ?? false;
  const isTrading = tradingStatus?.isActive ?? false;
  const activeStrategies = strategies?.filter((s) => s.isActive) || [];

  const totalPnL = openTrades?.reduce((sum, t) => sum + t.profit, 0) ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-trading">
            <Activity className="w-8 h-8" />
            Live Trading
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and control your live trading operations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className="text-sm"
          >
            <span
              className={`w-2 h-2 rounded-full mr-1.5 ${
                isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
              }`}
            />
            MT5: {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          {isTrading ? (
            <Button
              variant="destructive"
              onClick={() => setShowStopDialog(true)}
              data-testid="button-stop-trading"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Trading
            </Button>
          ) : (
            <Button
              onClick={() =>
                startTradingMutation.mutate(activeStrategies.map((s) => s.id))
              }
              disabled={!isConnected || activeStrategies.length === 0}
              data-testid="button-start-trading"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Trading
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Trading Status
              </span>
              <Zap className={`w-5 h-5 ${isTrading ? "text-green-500" : "text-muted-foreground"}`} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isTrading ? "bg-green-500 animate-pulse" : "bg-muted"
                }`}
              />
              <span className="text-xl font-bold" data-testid="status-trading">
                {isTrading ? "Active" : "Inactive"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Open Positions
              </span>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono" data-testid="count-positions">
                {openTrades?.length ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Floating P/L
              </span>
              <DollarSign className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <span
                className={`text-2xl font-bold font-mono ${
                  totalPnL >= 0 ? "text-green-500" : "text-red-500"
                }`}
                data-testid="floating-pnl"
              >
                {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Active Strategies
              </span>
              <Activity className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono" data-testid="count-strategies">
                {activeStrategies.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Open Positions
            </CardTitle>
            <Badge variant="secondary">
              {openTrades?.length ?? 0} positions
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tradesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))
              ) : openTrades?.length ? (
                openTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                    data-testid={`trade-row-${trade.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={trade.type === "BUY" ? "default" : "destructive"}
                      >
                        {trade.type}
                      </Badge>
                      <div>
                        <span className="font-medium">{trade.symbol}</span>
                        <p className="text-sm text-muted-foreground">
                          {trade.volume} lots @ {trade.openPrice.toFixed(5)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold ${
                            trade.profit >= 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {trade.profit >= 0 ? "+" : ""}${trade.profit.toFixed(2)}
                        </span>
                        <p className="text-sm text-muted-foreground font-mono">
                          {trade.currentPrice.toFixed(5)}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => closePositionMutation.mutate(trade.id)}
                        disabled={closePositionMutation.isPending}
                        data-testid={`button-close-${trade.id}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No open positions</p>
                  <p className="text-sm">Your open trades will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Symbol</Label>
              <Select value={manualSymbol} onValueChange={setManualSymbol}>
                <SelectTrigger data-testid="select-manual-symbol">
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
              <Label>Volume (lots)</Label>
              <Input
                type="number"
                value={manualVolume}
                onChange={(e) => setManualVolume(e.target.value)}
                min="0.01"
                step="0.01"
                data-testid="input-manual-volume"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={manualType === "BUY" ? "default" : "outline"}
                onClick={() => setManualType("BUY")}
                className="w-full"
                data-testid="button-type-buy"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                BUY
              </Button>
              <Button
                variant={manualType === "SELL" ? "destructive" : "outline"}
                onClick={() => setManualType("SELL")}
                className="w-full"
                data-testid="button-type-sell"
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                SELL
              </Button>
            </div>

            <Button
              onClick={handlePlaceOrder}
              disabled={!isConnected || placeOrderMutation.isPending}
              className="w-full"
              data-testid="button-place-order"
            >
              {placeOrderMutation.isPending ? "Placing..." : "Place Order"}
            </Button>

            {!isConnected && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Connect to MT5 to place orders</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Active Strategies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {strategies?.length ? (
              strategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  data-testid={`strategy-row-${strategy.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={strategy.isActive}
                      onCheckedChange={(checked) => {
                        apiRequest("PATCH", `/api/strategies/${strategy.id}`, {
                          isActive: checked,
                        }).then(() => {
                          queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
                        });
                      }}
                      data-testid={`switch-strategy-${strategy.id}`}
                    />
                    <div>
                      <span className="font-medium">{strategy.name}</span>
                      <p className="text-sm text-muted-foreground">
                        {strategy.totalTrades} trades | {strategy.winRate.toFixed(1)}% WR
                      </p>
                    </div>
                  </div>
                  <Badge variant={strategy.isActive ? "default" : "secondary"}>
                    {strategy.isActive ? "Running" : "Paused"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No strategies configured</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop All Trading?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop all automated trading activities. Open positions will remain
              open but no new trades will be placed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => stopTradingMutation.mutate()}
              className="bg-destructive text-destructive-foreground"
            >
              Stop Trading
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
