"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { mtgSync } from "@/lib/services/mtg-sync";

interface MTGCard {
  id: string;
  name: string;
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  colors: string[];
  color_identity: string[];
  rarity: string;
  image_url?: string;
  set_id: string;
  mtg_sets?: {
    name: string;
    code: string;
  };
}

const colorMap: Record<string, string> = {
  W: "bg-white text-black",
  U: "bg-blue-500 text-white",
  B: "bg-black text-white",
  R: "bg-red-500 text-white",
  G: "bg-green-500 text-white",
};

const rarityMap: Record<string, string> = {
  common: "bg-gray-500 text-white",
  uncommon: "bg-blue-600 text-white",
  rare: "bg-yellow-500 text-black",
  mythic: "bg-orange-500 text-white",
};

export default function CardsPage() {
  const [cards, setCards] = useState<MTGCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCards, setTotalCards] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    loadCardCount();
  }, []);

  const loadCardCount = async () => {
    try {
      const { count } = await supabase
        .from("mtg_cards")
        .select("*", { count: "exact", head: true });
      setTotalCards(count || 0);
    } catch (error) {
      console.error("Error loading card count:", error);
    }
  };

  const startDataSync = async () => {
    if (syncing) {
      return;
    }

    setSyncing(true);
    try {
      toast.info(
        "Starting sync of 20 most recent sets... This may take several minutes."
      );

      const result = await mtgSync.syncRecentSets(20);

      if (result.success) {
        toast.success(
          `Sync completed! Added ${result.totalCards} cards from recent sets.`
        );
        await loadCardCount();
        // Load some sample cards after sync
        await searchCards("creature");
      } else {
        toast.error(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Failed to sync data from MTG API");
    } finally {
      setSyncing(false);
    }
  };

  const searchCards = async (
    query: string,
    page: number = 1
  ): Promise<number> => {
    if (!query.trim()) {
      return 0;
    }

    setLoading(true);
    try {
      const pageSize = 50;
      const offset = (page - 1) * pageSize;

      // First, get the total count for pagination
      let countQuery = supabase
        .from("mtg_cards")
        .select("*", { count: "exact", head: true });

      // Apply the same filters to count query
      const queryParts = query.split(" ");
      let hasFilters = false;

      for (const part of queryParts) {
        if (part.startsWith("c:")) {
          const colors = part.substring(2).split("");
          countQuery = countQuery.overlaps("colors", colors);
          hasFilters = true;
        } else if (part.startsWith("t:")) {
          const type = part.substring(2);
          countQuery = countQuery.ilike("type_line", `%${type}%`);
          hasFilters = true;
        } else if (part.startsWith("r:")) {
          const rarity = part.substring(2);
          countQuery = countQuery.eq("rarity", rarity);
          hasFilters = true;
        } else if (part.startsWith("cmc:")) {
          const cmcFilter = part.substring(4);
          if (cmcFilter.startsWith("<=")) {
            const value = parseInt(cmcFilter.substring(2));
            countQuery = countQuery.lte("cmc", value);
          } else if (cmcFilter.startsWith(">=")) {
            const value = parseInt(cmcFilter.substring(2));
            countQuery = countQuery.gte("cmc", value);
          } else if (cmcFilter.startsWith("<")) {
            const value = parseInt(cmcFilter.substring(1));
            countQuery = countQuery.lt("cmc", value);
          } else if (cmcFilter.startsWith(">")) {
            const value = parseInt(cmcFilter.substring(1));
            countQuery = countQuery.gt("cmc", value);
          } else {
            const value = parseInt(cmcFilter);
            countQuery = countQuery.eq("cmc", value);
          }
          hasFilters = true;
        }
      }

      if (!hasFilters) {
        countQuery = countQuery.ilike("name", `%${query}%`);
      }

      const { count: totalCount } = await countQuery;
      const total = totalCount || 0;
      setTotalResults(total);
      setTotalPages(Math.ceil(total / pageSize));

      // Now get the actual data with pagination
      let supabaseQuery = supabase
        .from("mtg_cards")
        .select(
          `
          *,
          mtg_sets(name, code)
        `
        )
        .range(offset, offset + pageSize - 1);

      // Apply the same filters to data query
      for (const part of queryParts) {
        if (part.startsWith("c:")) {
          const colors = part.substring(2).split("");
          supabaseQuery = supabaseQuery.overlaps("colors", colors);
        } else if (part.startsWith("t:")) {
          const type = part.substring(2);
          supabaseQuery = supabaseQuery.ilike("type_line", `%${type}%`);
        } else if (part.startsWith("r:")) {
          const rarity = part.substring(2);
          supabaseQuery = supabaseQuery.eq("rarity", rarity);
        } else if (part.startsWith("cmc:")) {
          const cmcFilter = part.substring(4);
          if (cmcFilter.startsWith("<=")) {
            const value = parseInt(cmcFilter.substring(2));
            supabaseQuery = supabaseQuery.lte("cmc", value);
          } else if (cmcFilter.startsWith(">=")) {
            const value = parseInt(cmcFilter.substring(2));
            supabaseQuery = supabaseQuery.gte("cmc", value);
          } else if (cmcFilter.startsWith("<")) {
            const value = parseInt(cmcFilter.substring(1));
            supabaseQuery = supabaseQuery.lt("cmc", value);
          } else if (cmcFilter.startsWith(">")) {
            const value = parseInt(cmcFilter.substring(1));
            supabaseQuery = supabaseQuery.gt("cmc", value);
          } else {
            const value = parseInt(cmcFilter);
            supabaseQuery = supabaseQuery.eq("cmc", value);
          }
        }
      }

      if (!hasFilters) {
        supabaseQuery = supabaseQuery.ilike("name", `%${query}%`);
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      setCards(data || []);

      if (!data || data.length === 0) {
        return 0;
      } else {
        toast.success(
          `Found ${total} cards (showing ${data.length} on page ${page})`
        );
        return data.length;
      }
    } catch (error) {
      console.error("Search error:", error);
      setCards([]);
      return 0;
    } finally {
      setLoading(false);
    }
  };

  const translateNaturalLanguage = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    const parts: string[] = [];

    // Color mapping
    const colorMap: { [key: string]: string } = {
      red: "R",
      blue: "U",
      green: "G",
      white: "W",
      black: "B",
    };
    const foundColors = Object.keys(colorMap).filter((color) =>
      lowerQuery.includes(color)
    );
    if (foundColors.length > 0) {
      const colorCodes = foundColors.map((color) => colorMap[color]).join("");
      parts.push(`c:${colorCodes}`);
    }

    // Type mapping
    const typeMap: { [key: string]: string } = {
      creature: "creature",
      creatures: "creature",
      instant: "instant",
      instants: "instant",
      sorcery: "sorcery",
      sorceries: "sorcery",
      artifact: "artifact",
      artifacts: "artifact",
      enchantment: "enchantment",
      enchantments: "enchantment",
      planeswalker: "planeswalker",
      planeswalkers: "planeswalker",
      land: "land",
      lands: "land",
    };
    const foundTypes = Object.keys(typeMap).filter((type) =>
      lowerQuery.includes(type)
    );
    if (foundTypes.length > 0) {
      const typeCode = typeMap[foundTypes[0]];
      parts.push(`t:${typeCode}`);
    }

    // CMC patterns
    const cmcPatterns = [
      { pattern: /(\d+) mana/, replacement: "cmc:$1" },
      { pattern: /costs (\d+)/, replacement: "cmc:$1" },
      { pattern: /(\d+) or less/, replacement: "cmc:<=$1" },
      { pattern: /(\d+) or more/, replacement: "cmc:>=$1" },
    ];
    for (const { pattern, replacement } of cmcPatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        const cmcQuery = replacement.replace("$1", match[1]);
        parts.push(cmcQuery);
        break;
      }
    }

    // If no patterns found, try to extract potential card names
    if (parts.length === 0) {
      const words = lowerQuery.split(" ");
      const nameWords = words.filter(
        (word) =>
          word.length > 2 &&
          ![
            "that",
            "are",
            "have",
            "with",
            "the",
            "a",
            "an",
            "and",
            "or",
            "but",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "by",
          ].includes(word) &&
          ![
            "red",
            "blue",
            "green",
            "white",
            "black",
            "creature",
            "creatures",
            "instant",
            "instants",
            "sorcery",
            "sorceries",
            "artifact",
            "artifacts",
            "enchantment",
            "enchantments",
            "land",
            "lands",
          ].includes(word)
      );
      if (nameWords.length > 0) {
        return nameWords.join(" ");
      }
    }

    return parts.join(" ") || query;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }
    setCurrentPage(1);

    // Check if the query looks like natural language (doesn't contain query syntax)
    const hasQuerySyntax = /[crt]:|cmc:|in:/.test(searchQuery);

    let processedQuery = searchQuery;
    if (!hasQuerySyntax) {
      // Try to translate natural language to Scryfall syntax
      processedQuery = translateNaturalLanguage(searchQuery);
    }

    await searchCards(processedQuery, 1);
  };

  const handlePageChange = async (page: number) => {
    if (!searchQuery.trim()) {
      return;
    }
    setCurrentPage(page);
    await searchCards(searchQuery, page);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getColorBadges = (colors: string[]) => {
    if (!colors || colors.length === 0) {
      return <Badge variant="outline">Colorless</Badge>;
    }
    return colors.map((color) => (
      <Badge
        key={color}
        className={`${colorMap[color] || "bg-gray-500 text-white"} text-xs`}
      >
        {color}
      </Badge>
    ));
  };

  const getRarityBadge = (rarity: string) => {
    return (
      <Badge
        className={`${rarityMap[rarity] || "bg-gray-500 text-white"} text-xs`}
      >
        {rarity}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MTG Card Search</h1>
          <p className="text-muted-foreground">
            Search through {totalCards.toLocaleString()} cards using
            Scryfall-style syntax
          </p>
        </div>
        <Button
          onClick={startDataSync}
          disabled={syncing}
          className="flex items-center gap-2"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Sync 20 Recent Sets
        </Button>
      </div>

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Search Cards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, natural language, or use scryfall syntax"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <div className="mt-2">
              <p className="font-medium text-foreground mb-1">
                Search Examples:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>
                      <code>red creatures that cost 3 mana</code>
                    </li>
                    <li>
                      <code>blue instants</code>
                    </li>
                    <li>
                      <code>rare white cards</code>
                    </li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                You can also search by card name: <code>Lightning Bolt</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {cards.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * 50 + 1} to{" "}
              {Math.min(currentPage * 50, totalResults)} of{" "}
              {totalResults.toLocaleString()} cards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cards.map((card) => (
              <Card key={card.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Card Image */}
                    {card.image_url && (
                      <div className="flex justify-center">
                        <img
                          src={card.image_url}
                          alt={card.name}
                          className="w-full h-full object-cover object-center rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-sm leading-tight">
                        {card.name}
                      </h3>
                      <div className="flex gap-1">
                        {getColorBadges(card.colors)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {getRarityBadge(card.rarity)}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {card.type_line}
                    </p>

                    {card.power && card.toughness && (
                      <div className="text-xs text-muted-foreground">
                        {card.power}/{card.toughness}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{card.mtg_sets?.name}</span>
                      <span>CMC: {card.cmc}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {cards.length === 0 && !loading && totalCards > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No cards found. Try adjusting your search terms.
            </p>
          </CardContent>
        </Card>
      )}

      {totalCards === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No cards in database. Click "Sync 20 Recent Sets" to get started.
            </p>
            <Button onClick={startDataSync} disabled={syncing}>
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Sync Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
