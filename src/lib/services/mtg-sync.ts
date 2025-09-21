import { createClient } from "@/lib/supabase/client";

interface MTGSet {
  code: string;
  name: string;
  releaseDate: string;
  type: string;
}

interface MTGCard {
  id: string;
  name: string;
  manaCost?: string;
  cmc: number;
  type: string;
  text?: string;
  power?: string;
  toughness?: string;
  colors: string[];
  colorIdentity: string[];
  rarity: string;
  imageUrl?: string;
  multiverseid?: number;
}

class MTGSyncService {
  private isSyncing = false;
  private readonly API_BASE = "https://api.magicthegathering.io/v1";

  async syncRecentSets(maxSets = 20): Promise<{
    success: boolean;
    totalCards: number;
    error?: string;
  }> {
    if (this.isSyncing) {
      return {
        success: false,
        totalCards: 0,
        error: "Sync already in progress",
      };
    }

    this.isSyncing = true;
    try {
      console.log("Starting sync of recent MTG sets...");

      // Get recent sets from MTG API
      const setsResponse = await fetch(`${this.API_BASE}/sets`);
      if (!setsResponse.ok) {
        throw new Error(`Failed to fetch sets: ${setsResponse.status}`);
      }

      const setsData = await setsResponse.json();
      const sets = setsData.sets || [];

      // Filter for recent paper sets and sort by release date
      const recentSets = sets
        .filter(
          (set: any) =>
            set.type !== "token" &&
            set.type !== "memorabilia" &&
            set.releaseDate
        )
        .sort(
          (a: any, b: any) =>
            new Date(b.releaseDate).getTime() -
            new Date(a.releaseDate).getTime()
        );

      console.log(`Found ${recentSets.length} recent sets to evaluate`);

      let totalCards = 0;
      let syncedSets = 0;
      const supabase = createClient();

      // Check each set and only sync those with at least 100 cards
      for (const set of recentSets) {
        if (syncedSets >= maxSets) {
          break;
        }

        // Check if this set has at least 100 cards by fetching the first page
        const cardCountResponse = await fetch(
          `${this.API_BASE}/cards?set=${set.code}&page=1&pageSize=100`
        );

        if (!cardCountResponse.ok) {
          console.log(`Skipping set ${set.code} - API error`);
          continue;
        }

        const cardCountData = await cardCountResponse.json();
        const cards = cardCountData.cards || [];

        // If we get less than 100 cards on the first page, this set is too small
        if (cards.length < 100) {
          console.log(
            `Skipping set ${set.code} - only ${cards.length} cards (need at least 100)`
          );
          continue;
        }

        console.log(
          `Set ${set.code} has at least ${cards.length} cards - syncing...`
        );
        console.log(`Syncing set: ${set.name} (${set.code})`);

        // First, upsert the set (only for sets that meet our criteria)
        const { error: setError } = await supabase.from("mtg_sets").upsert(
          {
            code: set.code,
            name: set.name,
            release_date: set.releaseDate,
            type: set.type,
          },
          { onConflict: "code" }
        );

        if (setError) {
          console.error(`Error syncing set ${set.code}:`, setError);
          continue;
        }

        // Get the set ID from our database
        const { data: setData } = await supabase
          .from("mtg_sets")
          .select("id")
          .eq("code", set.code)
          .single();

        if (!setData) {
          console.error(`Could not find set ${set.code} in database`);
          continue;
        }

        // Sync cards from this set
        const cardsResult = await this.syncCardsFromSet(set.code, setData.id);

        if (cardsResult.success) {
          totalCards += cardsResult.count;
          syncedSets++;
          console.log(`Synced ${cardsResult.count} cards from ${set.code}`);
        } else {
          console.error(
            `Failed to sync cards from ${set.code}:`,
            cardsResult.error
          );
        }

        // Rate limiting - be nice to MTG API
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      console.log(
        `Sync completed. Synced ${syncedSets} sets with ${totalCards} total cards`
      );

      // Automatically clean up duplicates and cards without images
      console.log("Starting automatic cleanup...");
      const cleanupResult = await this.fullCleanup();

      if (cleanupResult.success) {
        console.log(
          `Cleanup completed: Removed ${cleanupResult.duplicatesRemoved} duplicates and ${cleanupResult.noImageRemoved} cards without images`
        );
      } else {
        console.error("Cleanup failed:", cleanupResult.error);
      }

      return { success: true, totalCards };
    } catch (error) {
      console.error("Sync error:", error);
      return {
        success: false,
        totalCards: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncCardsFromSet(
    setCode: string,
    setId: string
  ): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const supabase = createClient();
      let totalCards = 0;
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        // Fetch cards from MTG API with pagination
        const response = await fetch(
          `${this.API_BASE}/cards?set=${setCode}&page=${page}&pageSize=100`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch cards: ${response.status}`);
        }

        const data = await response.json();
        const cards = data.cards || [];

        if (cards.length === 0) {
          hasMore = false;
          break;
        }

        // Transform cards for our database
        const cardsToInsert = cards.map((card: any) => ({
          set_id: setId,
          name: card.name,
          mana_cost: card.manaCost,
          cmc: card.cmc || 0,
          type_line: card.type,
          oracle_text: card.text,
          power: card.power,
          toughness: card.toughness,
          colors: card.colors || [],
          color_identity: card.colorIdentity || [],
          rarity: card.rarity,
          image_url: card.imageUrl,
          multiverse_id: card.multiverseid,
          scryfall_id: `${setCode}-${card.id}`, // Create unique ID by combining set code and card ID
        }));

        // Upsert cards to database
        const { error } = await supabase
          .from("mtg_cards")
          .upsert(cardsToInsert, { onConflict: "scryfall_id" });

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        totalCards += cardsToInsert.length;

        // Check if there are more pages
        hasMore = cards.length === 100;
        page++;

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return { success: true, count: totalCards };
    } catch (error) {
      console.error("Cards sync error:", error);
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getSyncStatus(): Promise<{
    sets: number;
    cards: number;
    lastSync?: string;
  }> {
    try {
      const supabase = createClient();

      const { count: setsCount } = await supabase
        .from("mtg_sets")
        .select("*", { count: "exact", head: true });

      const { count: cardsCount } = await supabase
        .from("mtg_cards")
        .select("*", { count: "exact", head: true });

      return {
        sets: setsCount || 0,
        cards: cardsCount || 0,
      };
    } catch (error) {
      console.error("Error getting sync status:", error);
      return { sets: 0, cards: 0 };
    }
  }

  async cleanupDuplicateCards(): Promise<{
    success: boolean;
    removed: number;
    error?: string;
  }> {
    try {
      const supabase = createClient();

      // Find and remove duplicate cards based on name and set_id
      const { data: duplicates, error: findError } = await supabase
        .from("mtg_cards")
        .select("name, set_id, id")
        .order("name")
        .order("set_id");

      if (findError) {
        throw new Error(`Error finding duplicates: ${findError.message}`);
      }

      if (!duplicates) {
        return { success: true, removed: 0 };
      }

      // Group by name and set_id to find duplicates (same name + same set)
      const groupedByNameAndSet = duplicates.reduce((acc: any, card: any) => {
        const key = `${card.name}-${card.set_id}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(card);
        return acc;
      }, {});

      // Group by name only to find duplicates (same name across different sets)
      const groupedByNameOnly = duplicates.reduce((acc: any, card: any) => {
        if (!acc[card.name]) {
          acc[card.name] = [];
        }
        acc[card.name].push(card);
        return acc;
      }, {});

      let removedCount = 0;

      // Remove duplicates with same name and set_id
      const duplicateGroupsByNameAndSet = Object.values(
        groupedByNameAndSet
      ).filter((group: any) => group.length > 1);

      for (const group of duplicateGroupsByNameAndSet) {
        // Keep the first one, remove the rest
        const toRemove = (group as any[]).slice(1);
        const idsToRemove = toRemove.map((card) => card.id);

        const { error: deleteError } = await supabase
          .from("mtg_cards")
          .delete()
          .in("id", idsToRemove);

        if (deleteError) {
          console.error(
            "Error removing duplicates by name and set:",
            deleteError
          );
        } else {
          removedCount += idsToRemove.length;
        }
      }

      // Remove duplicates with same name (across different sets)
      const duplicateGroupsByNameOnly = Object.values(groupedByNameOnly).filter(
        (group: any) => group.length > 1
      );

      for (const group of duplicateGroupsByNameOnly) {
        // Keep the first one (lowest ID), remove the rest
        const sortedGroup = (group as any[]).sort((a, b) =>
          a.id.localeCompare(b.id)
        );
        const toRemove = sortedGroup.slice(1);
        const idsToRemove = toRemove.map((card) => card.id);

        const { error: deleteError } = await supabase
          .from("mtg_cards")
          .delete()
          .in("id", idsToRemove);

        if (deleteError) {
          console.error("Error removing duplicates by name only:", deleteError);
        } else {
          removedCount += idsToRemove.length;
        }
      }

      console.log(
        `Cleaned up ${removedCount} duplicate cards (by name+set and by name only)`
      );
      return { success: true, removed: removedCount };
    } catch (error) {
      console.error("Error cleaning up duplicates:", error);
      return {
        success: false,
        removed: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async cleanupCardsWithoutImages(): Promise<{
    success: boolean;
    removed: number;
    error?: string;
  }> {
    try {
      const supabase = createClient();

      // Find cards without images (null or empty string)
      const { data: nullImages, error: nullError } = await supabase
        .from("mtg_cards")
        .select("id")
        .is("image_url", null);

      if (nullError) {
        throw new Error(
          `Error finding cards with null images: ${nullError.message}`
        );
      }

      const { data: emptyImages, error: emptyError } = await supabase
        .from("mtg_cards")
        .select("id")
        .eq("image_url", "");

      if (emptyError) {
        throw new Error(
          `Error finding cards with empty images: ${emptyError.message}`
        );
      }

      console.log(`Found ${nullImages?.length || 0} cards with null images`);
      console.log(`Found ${emptyImages?.length || 0} cards with empty images`);

      // Combine both results
      const cardsWithoutImages = [
        ...(nullImages || []),
        ...(emptyImages || []),
      ];

      if (!cardsWithoutImages || cardsWithoutImages.length === 0) {
        return { success: true, removed: 0 };
      }

      const idsToRemove = cardsWithoutImages.map((card) => card.id);

      // Delete in batches to avoid overwhelming the database
      const batchSize = 100;
      let removedCount = 0;

      for (let i = 0; i < idsToRemove.length; i += batchSize) {
        const batch = idsToRemove.slice(i, i + batchSize);

        const { error: deleteError } = await supabase
          .from("mtg_cards")
          .delete()
          .in("id", batch);

        if (deleteError) {
          console.error(
            `Error removing batch ${i}-${i + batchSize}:`,
            deleteError
          );
          // Continue with next batch instead of failing completely
        } else {
          removedCount += batch.length;
        }
      }

      console.log(`Cleaned up ${removedCount} cards without images`);
      return { success: true, removed: removedCount };
    } catch (error) {
      console.error("Error cleaning up cards without images:", error);
      return {
        success: false,
        removed: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async fullCleanup(): Promise<{
    success: boolean;
    duplicatesRemoved: number;
    noImageRemoved: number;
    error?: string;
  }> {
    try {
      // First clean up duplicates
      const duplicateResult = await this.cleanupDuplicateCards();
      if (!duplicateResult.success) {
        return {
          success: false,
          duplicatesRemoved: 0,
          noImageRemoved: 0,
          error: duplicateResult.error,
        };
      }

      // Then clean up cards without images
      const noImageResult = await this.cleanupCardsWithoutImages();
      if (!noImageResult.success) {
        return {
          success: false,
          duplicatesRemoved: duplicateResult.removed,
          noImageRemoved: 0,
          error: noImageResult.error,
        };
      }

      console.log(
        `Full cleanup completed: ${duplicateResult.removed} duplicates and ${noImageResult.removed} cards without images removed`
      );
      return {
        success: true,
        duplicatesRemoved: duplicateResult.removed,
        noImageRemoved: noImageResult.removed,
      };
    } catch (error) {
      console.error("Error in full cleanup:", error);
      return {
        success: false,
        duplicatesRemoved: 0,
        noImageRemoved: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const mtgSync = new MTGSyncService();
