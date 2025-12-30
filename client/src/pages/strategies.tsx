import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Plus,
  Play,
  Pause,
  Trash2,
  TrendingUp,
  Clock,
  Target,
  DollarSign,
  FileCode,
  Upload,
} from "lucide-react";
import type { Strategy, InsertStrategy } from "@shared/schema";

function StrategyCard({
  strategy,
  onToggle,
  onDelete,
}: {
  strategy: Strategy;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <Card className="overflow-visible" data-testid={`card-strategy-${strategy.id}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold text-lg truncate">{strategy.name}</h3>
                <Badge
                  variant={strategy.isActive ? "default" : "secondary"}
                  size="sm"
                >
                  {strategy.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {strategy.description || "No description provided"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onToggle(strategy.id, !strategy.isActive)}
                data-testid={`button-toggle-${strategy.id}`}
              >
                {strategy.isActive ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowDeleteDialog(true)}
                data-testid={`button-delete-${strategy.id}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Target className="w-3 h-3" />
                <span className="text-xs uppercase tracking-wide">Win Rate</span>
              </div>
              <span className="font-mono font-semibold">
                {strategy.winRate.toFixed(1)}%
              </span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs uppercase tracking-wide">Trades</span>
              </div>
              <span className="font-mono font-semibold">{strategy.totalTrades}</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <DollarSign className="w-3 h-3" />
                <span className="text-xs uppercase tracking-wide">Profit</span>
              </div>
              <span
                className={`font-mono font-semibold ${
                  strategy.totalProfit >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                ${strategy.totalProfit.toFixed(0)}
              </span>
            </div>
          </div>

          {strategy.lastRun && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Last run: {new Date(strategy.lastRun).toLocaleString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Strategy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{strategy.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(strategy.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function UploadStrategyDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: InsertStrategy) => {
      return await apiRequest("POST", "/api/strategies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      toast({
        title: "Strategy Created",
        description: "Your strategy has been uploaded successfully.",
      });
      setOpen(false);
      setName("");
      setDescription("");
      setContent("");
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    createMutation.mutate({
      name,
      description,
      filename: `${name.toLowerCase().replace(/\s+/g, "_")}.py`,
      content,
    });
  };

  const sampleStrategy = `# Simple Moving Average Crossover Strategy
import MetaTrader5 as mt5
import pandas as pd

def calculate_sma(data, period):
    """Calculate Simple Moving Average"""
    return data.rolling(window=period).mean()

def execute_strategy(symbol, short_period=10, long_period=20):
    """
    Execute SMA crossover strategy
    BUY when short SMA crosses above long SMA
    SELL when short SMA crosses below long SMA
    """
    # Get historical data
    rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_H1, 0, 100)
    df = pd.DataFrame(rates)
    
    # Calculate SMAs
    df['sma_short'] = calculate_sma(df['close'], short_period)
    df['sma_long'] = calculate_sma(df['close'], long_period)
    
    # Generate signals
    if df['sma_short'].iloc[-1] > df['sma_long'].iloc[-1]:
        return "BUY"
    elif df['sma_short'].iloc[-1] < df['sma_long'].iloc[-1]:
        return "SELL"
    
    return "HOLD"
`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-upload-strategy">
          <Plus className="w-4 h-4 mr-2" />
          Upload Strategy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload New Strategy
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Strategy Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., SMA Crossover Strategy"
              required
              data-testid="input-strategy-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe how your strategy works..."
              rows={2}
              data-testid="input-strategy-description"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Strategy Code (Python)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setContent(sampleStrategy)}
              >
                <FileCode className="w-4 h-4 mr-1" />
                Load Sample
              </Button>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your Python strategy code here..."
              className="font-mono text-sm"
              rows={12}
              required
              data-testid="input-strategy-content"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-submit-strategy"
            >
              {createMutation.isPending ? "Uploading..." : "Upload Strategy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Strategies() {
  const { toast } = useToast();

  const { data: strategies, isLoading } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies"],
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/strategies/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/strategies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      toast({
        title: "Strategy Deleted",
        description: "The strategy has been removed.",
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-strategies">
            Strategy Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage your trading strategies
          </p>
        </div>
        <UploadStrategyDialog onSuccess={() => {}} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : strategies?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategies.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <FileCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No strategies yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first trading strategy to get started
              </p>
              <UploadStrategyDialog onSuccess={() => {}} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
