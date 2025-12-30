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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Plus,
  Activity,
  TrendingUp,
  AlertTriangle,
  FileText,
  Calendar,
  Tag,
  Filter,
  Search,
} from "lucide-react";
import type { JournalEntry, InsertJournalEntry } from "@shared/schema";

const entryTypeConfig = {
  TRADE: {
    icon: Activity,
    color: "bg-blue-500/10 text-blue-500",
    label: "Trade",
  },
  INSIGHT: {
    icon: TrendingUp,
    color: "bg-purple-500/10 text-purple-500",
    label: "Insight",
  },
  ALERT: {
    icon: AlertTriangle,
    color: "bg-orange-500/10 text-orange-500",
    label: "Alert",
  },
  NOTE: {
    icon: FileText,
    color: "bg-muted text-muted-foreground",
    label: "Note",
  },
};

function JournalEntryCard({ entry }: { entry: JournalEntry }) {
  const config = entryTypeConfig[entry.type];
  const Icon = config.icon;

  return (
    <Card data-testid={`journal-card-${entry.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
              <div>
                <h3 className="font-semibold text-lg">{entry.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(entry.createdAt).toLocaleString()}</span>
                  {entry.symbol && (
                    <>
                      <span className="mx-1">|</span>
                      <span className="font-mono">{entry.symbol}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" size="sm">
                  {config.label}
                </Badge>
                {entry.profit !== null && (
                  <Badge
                    variant={entry.profit >= 0 ? "default" : "destructive"}
                    size="sm"
                  >
                    {entry.profit >= 0 ? "+" : ""}${entry.profit.toFixed(2)}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-muted-foreground whitespace-pre-wrap">{entry.content}</p>
            {entry.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Tag className="w-3 h-3 text-muted-foreground" />
                {entry.tags.map((tag) => (
                  <Badge key={tag} variant="outline" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddEntryDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"TRADE" | "INSIGHT" | "NOTE" | "ALERT">("NOTE");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [symbol, setSymbol] = useState("");
  const [profit, setProfit] = useState("");
  const [tags, setTags] = useState("");
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: InsertJournalEntry) => {
      return await apiRequest("POST", "/api/journal", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal/recent"] });
      toast({
        title: "Entry Added",
        description: "Your journal entry has been saved.",
      });
      setOpen(false);
      resetForm();
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

  const resetForm = () => {
    setType("NOTE");
    setTitle("");
    setContent("");
    setSymbol("");
    setProfit("");
    setTags("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    createMutation.mutate({
      type,
      title,
      content,
      symbol: symbol || null,
      profit: profit ? parseFloat(profit) : null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-entry">
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            New Journal Entry
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Entry Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger data-testid="select-entry-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOTE">Note</SelectItem>
                <SelectItem value="TRADE">Trade</SelectItem>
                <SelectItem value="INSIGHT">Insight</SelectItem>
                <SelectItem value="ALERT">Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry title..."
              required
              data-testid="input-entry-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts, observations, or analysis..."
              rows={4}
              required
              data-testid="input-entry-content"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol (optional)</Label>
              <Input
                id="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g., EURUSD"
                data-testid="input-entry-symbol"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profit">P/L (optional)</Label>
              <Input
                id="profit"
                type="number"
                value={profit}
                onChange={(e) => setProfit(e.target.value)}
                placeholder="e.g., 150.50"
                step="0.01"
                data-testid="input-entry-profit"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., analysis, breakout, trend"
              data-testid="input-entry-tags"
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
              data-testid="button-submit-entry"
            >
              {createMutation.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Journal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: entries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal"],
  });

  const filteredEntries = entries?.filter((entry) => {
    const matchesSearch =
      searchQuery === "" ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === "all" || entry.type === filterType;

    return matchesSearch && matchesType;
  });

  const stats = {
    total: entries?.length ?? 0,
    trades: entries?.filter((e) => e.type === "TRADE").length ?? 0,
    insights: entries?.filter((e) => e.type === "INSIGHT").length ?? 0,
    totalProfit:
      entries
        ?.filter((e) => e.profit !== null)
        .reduce((sum, e) => sum + (e.profit ?? 0), 0) ?? 0,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-journal">
            <BookOpen className="w-8 h-8" />
            Trading Journal
          </h1>
          <p className="text-muted-foreground mt-1">
            Record your trades, insights, and learning
          </p>
        </div>
        <AddEntryDialog onSuccess={() => {}} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Entries</div>
            <span className="text-2xl font-bold font-mono">{stats.total}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Trade Logs</div>
            <span className="text-2xl font-bold font-mono">{stats.trades}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Insights</div>
            <span className="text-2xl font-bold font-mono">{stats.insights}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total P/L</div>
            <span
              className={`text-2xl font-bold font-mono ${
                stats.totalProfit >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {stats.totalProfit >= 0 ? "+" : ""}${stats.totalProfit.toFixed(2)}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="pl-9"
            data-testid="input-search-journal"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="TRADE">Trades</SelectItem>
            <SelectItem value="INSIGHT">Insights</SelectItem>
            <SelectItem value="NOTE">Notes</SelectItem>
            <SelectItem value="ALERT">Alerts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredEntries?.length ? (
          filteredEntries.map((entry) => (
            <JournalEntryCard key={entry.id} entry={entry} />
          ))
        ) : (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No journal entries</h3>
                <p className="text-muted-foreground mb-4">
                  Start documenting your trading journey
                </p>
                <AddEntryDialog onSuccess={() => {}} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
