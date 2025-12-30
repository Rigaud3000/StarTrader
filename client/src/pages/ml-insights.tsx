import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  BarChart3,
  Minus,
} from "lucide-react";
import type { MLInsight } from "@shared/schema";

const insightTypeConfig = {
  PATTERN: {
    icon: BarChart3,
    color: "bg-blue-500/10 text-blue-500",
    label: "Pattern",
  },
  PREDICTION: {
    icon: Target,
    color: "bg-purple-500/10 text-purple-500",
    label: "Prediction",
  },
  RECOMMENDATION: {
    icon: Lightbulb,
    color: "bg-green-500/10 text-green-500",
    label: "Recommendation",
  },
  RISK_ALERT: {
    icon: AlertTriangle,
    color: "bg-orange-500/10 text-orange-500",
    label: "Risk Alert",
  },
};

function InsightCard({ insight }: { insight: MLInsight }) {
  const config = insightTypeConfig[insight.type];
  const Icon = config.icon;

  const DirectionIcon =
    insight.predictedDirection === "BULLISH"
      ? TrendingUp
      : insight.predictedDirection === "BEARISH"
      ? TrendingDown
      : Minus;

  const directionColor =
    insight.predictedDirection === "BULLISH"
      ? "text-green-500"
      : insight.predictedDirection === "BEARISH"
      ? "text-red-500"
      : "text-muted-foreground";

  return (
    <Card data-testid={`insight-card-${insight.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${config.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" size="sm">
                    {config.label}
                  </Badge>
                  {insight.symbol && (
                    <Badge variant="outline" size="sm" className="font-mono">
                      {insight.symbol}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-lg">{insight.title}</h3>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">Confidence</div>
                <div className="flex items-center gap-2">
                  <Progress value={insight.confidence * 100} className="w-16 h-2" />
                  <span className="font-mono font-medium text-sm">
                    {(insight.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground mb-4">{insight.description}</p>

            {insight.predictedDirection && (
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <DirectionIcon className={`w-5 h-5 ${directionColor}`} />
                  <span className={`font-medium ${directionColor}`}>
                    {insight.predictedDirection}
                  </span>
                </div>
                {insight.predictedChange !== null && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Expected move: </span>
                    <span className={`font-mono font-medium ${directionColor}`}>
                      {insight.predictedChange >= 0 ? "+" : ""}
                      {insight.predictedChange.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {Object.keys(insight.features).length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground mb-2">Key Features</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(insight.features).map(([key, value]) => (
                    <Badge key={key} variant="outline" size="sm">
                      {key}: <span className="font-mono ml-1">{value.toFixed(2)}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground mt-4">
              Generated: {new Date(insight.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MLInsights() {
  const { data: insights, isLoading } = useQuery<MLInsight[]>({
    queryKey: ["/api/ml/insights"],
    refetchInterval: 30000,
  });

  const stats = {
    total: insights?.length ?? 0,
    patterns: insights?.filter((i) => i.type === "PATTERN").length ?? 0,
    predictions: insights?.filter((i) => i.type === "PREDICTION").length ?? 0,
    alerts: insights?.filter((i) => i.type === "RISK_ALERT").length ?? 0,
    avgConfidence: insights?.length
      ? insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length
      : 0,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-ml-insights">
            <Brain className="w-8 h-8" />
            ML Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            Machine learning analysis and predictions
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Auto-refresh every 30s
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Insights</div>
            <span className="text-2xl font-bold font-mono">{stats.total}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Patterns</div>
            <span className="text-2xl font-bold font-mono">{stats.patterns}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Predictions</div>
            <span className="text-2xl font-bold font-mono">{stats.predictions}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Risk Alerts</div>
            <span className="text-2xl font-bold font-mono">{stats.alerts}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Avg Confidence</div>
            <span className="text-2xl font-bold font-mono">
              {(stats.avgConfidence * 100).toFixed(0)}%
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-lg font-medium">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">1</span>
                </div>
                Data Collection
              </div>
              <p className="text-sm text-muted-foreground">
                The ML module collects trading data, price history, and market indicators
                to build a comprehensive dataset for analysis.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-lg font-medium">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">2</span>
                </div>
                Pattern Recognition
              </div>
              <p className="text-sm text-muted-foreground">
                Using PyTorch neural networks, the system identifies patterns and trends
                in historical data to predict future market movements.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-lg font-medium">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">3</span>
                </div>
                Adaptive Learning
              </div>
              <p className="text-sm text-muted-foreground">
                The model continuously learns from new trades and market data, improving
                its predictions and adapting to changing market conditions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Insights</h2>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : insights?.length ? (
          insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))
        ) : (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No insights yet</h3>
                <p className="text-muted-foreground">
                  The ML module will generate insights as trading data is collected.
                  Start trading to enable machine learning analysis.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
