import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon,
  Server,
  Shield,
  Brain,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import type { MT5Config, InsertMT5Config } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { data: mt5Config, isLoading: configLoading } = useQuery<MT5Config>({
    queryKey: ["/api/mt5/config"],
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (mt5Config) {
      setLogin(mt5Config.login || "");
      setServer(mt5Config.server || "");
    }
  }, [mt5Config]);

  const connectMutation = useMutation({
    mutationFn: async (data: InsertMT5Config) => {
      return await apiRequest("POST", "/api/mt5/connect", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mt5/config"] });
      toast({
        title: "Connection Successful",
        description: "Successfully connected to MT5 terminal",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/mt5/disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mt5/config"] });
      toast({
        title: "Disconnected",
        description: "Disconnected from MT5 terminal",
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

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/mt5/test");
    },
    onSuccess: (data: { success: boolean; message: string }) => {
      toast({
        title: data.success ? "Connection OK" : "Connection Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login || !password || !server) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all credentials",
        variant: "destructive",
      });
      return;
    }
    connectMutation.mutate({ login, password, server });
  };

  const isConnected = mt5Config?.connected ?? false;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-settings">
          <SettingsIcon className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure your MT5 connection and trading parameters
        </p>
      </div>

      <Tabs defaultValue="mt5" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mt5">
            <Server className="w-4 h-4 mr-2" />
            MT5 Config
          </TabsTrigger>
          <TabsTrigger value="risk">
            <Shield className="w-4 h-4 mr-2" />
            Risk
          </TabsTrigger>
          <TabsTrigger value="ml">
            <Brain className="w-4 h-4 mr-2" />
            ML Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mt5" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>MT5 Connection</CardTitle>
                  <CardDescription>
                    Enter your MetaTrader 5 terminal credentials
                  </CardDescription>
                </div>
                <Badge
                  variant={isConnected ? "default" : "destructive"}
                  className="text-sm"
                  data-testid="badge-connection-status"
                >
                  {isConnected ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-1" />
                      Disconnected
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login">Login / Account Number</Label>
                  <Input
                    id="login"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="e.g., 12345678"
                    disabled={isConnected}
                    data-testid="input-mt5-login"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your MT5 password"
                      disabled={isConnected}
                      data-testid="input-mt5-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="server">Server</Label>
                  <Input
                    id="server"
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                    placeholder="e.g., MetaQuotes-Demo"
                    disabled={isConnected}
                    data-testid="input-mt5-server"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  {isConnected ? (
                    <>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => disconnectMutation.mutate()}
                        disabled={disconnectMutation.isPending}
                        data-testid="button-disconnect"
                      >
                        {disconnectMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Disconnect
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => testConnectionMutation.mutate()}
                        disabled={testConnectionMutation.isPending}
                        data-testid="button-test-connection"
                      >
                        {testConnectionMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Test Connection
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="submit"
                      disabled={connectMutation.isPending}
                      data-testid="button-connect"
                    >
                      {connectMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Connect
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {isConnected && mt5Config && (
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Balance</div>
                    <span className="text-xl font-bold font-mono">
                      ${mt5Config.accountBalance?.toLocaleString() ?? "0"}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Equity</div>
                    <span className="text-xl font-bold font-mono">
                      ${mt5Config.accountEquity?.toLocaleString() ?? "0"}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Profit</div>
                    <span
                      className={`text-xl font-bold font-mono ${
                        (mt5Config.accountProfit ?? 0) >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {(mt5Config.accountProfit ?? 0) >= 0 ? "+" : ""}$
                      {mt5Config.accountProfit?.toFixed(2) ?? "0"}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Last Connected</div>
                    <span className="text-sm">
                      {mt5Config.lastConnected
                        ? new Date(mt5Config.lastConnected).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="risk" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>
                Configure risk parameters for your trading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxRisk">Max Risk Per Trade (%)</Label>
                  <Input
                    id="maxRisk"
                    type="number"
                    defaultValue="2"
                    min="0.1"
                    max="10"
                    step="0.1"
                    data-testid="input-max-risk"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDrawdown">Max Daily Drawdown (%)</Label>
                  <Input
                    id="maxDrawdown"
                    type="number"
                    defaultValue="5"
                    min="1"
                    max="20"
                    step="0.5"
                    data-testid="input-max-drawdown"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPositions">Max Open Positions</Label>
                  <Input
                    id="maxPositions"
                    type="number"
                    defaultValue="5"
                    min="1"
                    max="20"
                    data-testid="input-max-positions"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultLotSize">Default Lot Size</Label>
                  <Input
                    id="defaultLotSize"
                    type="number"
                    defaultValue="0.1"
                    min="0.01"
                    max="10"
                    step="0.01"
                    data-testid="input-lot-size"
                  />
                </div>
              </div>
              <Button className="mt-4" data-testid="button-save-risk">
                Save Risk Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ml" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Machine Learning Settings</CardTitle>
              <CardDescription>
                Configure the ML module parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="learningRate">Learning Rate</Label>
                  <Input
                    id="learningRate"
                    type="number"
                    defaultValue="0.001"
                    min="0.0001"
                    max="0.1"
                    step="0.0001"
                    data-testid="input-learning-rate"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="epochs">Training Epochs</Label>
                  <Input
                    id="epochs"
                    type="number"
                    defaultValue="100"
                    min="10"
                    max="1000"
                    data-testid="input-epochs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minConfidence">Min Confidence Threshold</Label>
                  <Input
                    id="minConfidence"
                    type="number"
                    defaultValue="0.7"
                    min="0.5"
                    max="0.99"
                    step="0.01"
                    data-testid="input-min-confidence"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lookbackPeriod">Lookback Period (bars)</Label>
                  <Input
                    id="lookbackPeriod"
                    type="number"
                    defaultValue="100"
                    min="10"
                    max="500"
                    data-testid="input-lookback"
                  />
                </div>
              </div>
              <Button className="mt-4" data-testid="button-save-ml">
                Save ML Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
