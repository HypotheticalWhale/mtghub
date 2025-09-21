"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { mtgSync } from "@/lib/services/mtg-sync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Users,
  TrendingUp,
  Database,
  Download,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Tables } from "@/types/supabase";
import { toast } from "sonner";

type DraftSession = Tables<"mtg_draft_sessions">;
type MtgCard = Tables<"mtg_cards">;

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCards: 0,
    totalSets: 0,
    activeDrafts: 0,
    totalDrafts: 0,
  });
  const [recentDrafts, setRecentDrafts] = useState<DraftSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [fullCleaning, setFullCleaning] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadDashboardData();
  }, [supabase]);

  const startDataSync = async () => {
    if (importing) {
      return;
    }

    setImporting(true);
    try {
      toast.info(
        "Starting sync of 20 most recent sets with 100+ cards (ALL cards + auto-cleanup)... This may take several minutes."
      );

      const result = await mtgSync.syncRecentSets(20);

      if (result.success) {
        toast.success(
          `Sync completed! Added ${result.totalCards} cards from recent sets with automatic cleanup.`
        );
        // Reload dashboard data
        await loadDashboardData();
      } else {
        toast.error(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Failed to sync data from Scryfall");
    } finally {
      setImporting(false);
    }
  };

  const cleanupDuplicates = async () => {
    if (cleaning) {
      return;
    }

    setCleaning(true);
    try {
      toast.info("Cleaning up duplicate cards...");

      const result = await mtgSync.cleanupDuplicateCards();

      if (result.success) {
        toast.success(
          `Cleanup completed! Removed ${result.removed} duplicate cards.`
        );
        // Reload dashboard data
        await loadDashboardData();
      } else {
        toast.error(`Cleanup failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Cleanup error:", error);
      toast.error("Failed to cleanup duplicate cards");
    } finally {
      setCleaning(false);
    }
  };

  const fullCleanup = async () => {
    if (fullCleaning) {
      return;
    }

    setFullCleaning(true);
    try {
      toast.info(
        "Performing full cleanup (duplicates + cards without images)..."
      );

      // First check how many cards without images exist
      const { count: nullCount } = await supabase
        .from("mtg_cards")
        .select("*", { count: "exact", head: true })
        .is("image_url", null);

      const { count: emptyCount } = await supabase
        .from("mtg_cards")
        .select("*", { count: "exact", head: true })
        .eq("image_url", "");

      console.log(
        `Cards without images: ${(nullCount || 0) + (emptyCount || 0)}`
      );

      const result = await mtgSync.fullCleanup();

      if (result.success) {
        toast.success(
          `Full cleanup completed! Removed ${result.duplicatesRemoved} duplicates and ${result.noImageRemoved} cards without images.`
        );
        // Reload dashboard data
        await loadDashboardData();
      } else {
        toast.error(`Full cleanup failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Full cleanup error:", error);
      toast.error("Failed to perform full cleanup");
    } finally {
      setFullCleaning(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Get sync status from the sync service
      const syncStatus = await mtgSync.getSyncStatus();

      // Load card count
      const { count: cardCount } = await supabase
        .from("mtg_cards")
        .select("*", { count: "exact", head: true });

      // Load set count
      const { count: setCount } = await supabase
        .from("mtg_sets")
        .select("*", { count: "exact", head: true });

      // Load draft stats
      const { count: totalDrafts } = await supabase
        .from("mtg_draft_sessions")
        .select("*", { count: "exact", head: true });

      const { count: activeDrafts } = await supabase
        .from("mtg_draft_sessions")
        .select("*", { count: "exact", head: true })
        .in("status", ["waiting", "in_progress"]);

      // Load recent drafts
      const { data: draftsData } = await supabase
        .from("mtg_draft_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        totalCards: cardCount || 0,
        totalSets: setCount || 0,
        activeDrafts: activeDrafts || 0,
        totalDrafts: totalDrafts || 0,
      });

      setRecentDrafts(draftsData || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Magic: The Gathering Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your MTG card database and draft simulator
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCards.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Cards in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSets}</div>
            <p className="text-xs text-muted-foreground">MTG sets available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drafts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDrafts}</div>
            <p className="text-xs text-muted-foreground">Drafts in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drafts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDrafts}</div>
            <p className="text-xs text-muted-foreground">All time drafts</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import MTG Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Import Magic: The Gathering card data to get started with your
            application.
          </p>
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={startDataSync}
              disabled={importing}
              className="flex-1"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Sync All Cards (20 Sets, 100+ Cards)
            </Button>
            <Button
              variant="outline"
              onClick={cleanupDuplicates}
              disabled={cleaning || stats.totalCards === 0}
              className="flex-1"
            >
              {cleaning ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Clean Duplicates
            </Button>
            <Button
              variant="destructive"
              onClick={fullCleanup}
              disabled={fullCleaning || stats.totalCards === 0}
              className="flex-1"
            >
              {fullCleaning ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Full Cleanup
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>
              <strong>Sync:</strong> Import all cards from 20 most recent sets
              with 100+ cards (auto-cleanup)
            </p>
            <p>
              <strong>Clean Duplicates:</strong> Remove duplicate cards (same
              name + set, and same name across sets)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Card Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Search through thousands of Magic: The Gathering cards with
              AI-powered query translation. Find cards by name, type, mana cost,
              or use natural language queries.
            </p>
            <Link href="/dashboard/cards">
              <Button className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Search Cards
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Draft Simulator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create and participate in Magic: The Gathering draft sessions.
              Simulate booster drafts with friends or practice solo.
            </p>
            <Link href="/dashboard/draft">
              <Button className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Draft Simulator
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Drafts */}
      {recentDrafts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Draft Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{draft.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Draft • {draft.set_code} • 2 players
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        draft.status === "waiting" ? "default" : "secondary"
                      }
                    >
                      {draft.status}
                    </Badge>
                    <Link href={`/dashboard/draft?draftId=${draft.id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {stats.totalCards === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              It looks like you haven't imported any MTG card data yet. To get
              started:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>Sample Data:</strong> Quick import of 3 test cards
                (Lightning Bolt, Counterspell, Giant Growth)
              </li>
              <li>
                <strong>Scryfall Import:</strong> Import real MTG data from
                Scryfall API (all sets + cards from first 10 sets)
              </li>
              <li>Create your first draft session with imported data</li>
              <li>Start searching for cards with AI-powered queries</li>
            </ol>
            <div className="space-y-3">
              <div className="flex justify-center">
                <Button
                  variant="default"
                  onClick={startDataSync}
                  disabled={importing}
                  className="px-8"
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Sync All Cards (20 Sets, 100+ Cards)
                </Button>
              </div>
              <div className="flex gap-2">
                <Link href="/dashboard/draft" className="flex-1">
                  <Button className="w-full">Create Draft</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
