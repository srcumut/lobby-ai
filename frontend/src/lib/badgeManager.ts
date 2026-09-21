// ============================================================================
// TARGET_DESTINATION: frontend/src/lib/badgeManager.ts
// PURPOSE: Instant badge unlocker with real-time DB persistence & celebration notification
// ============================================================================

import { apiClient } from "./api/client";
import { toast } from "@/components/ui/toast";
import { getBadgeById } from "@/data/badges";

export async function unlockBadge(badgeId: string): Promise<boolean> {
  const badgeDef = getBadgeById(badgeId);
  try {
    const res = await apiClient.post<any>("/users/badges/unlock", { badge: badgeId });
    const user = res.data;

    // Trigger local event so UI components refresh badge counts and coin balances immediately
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("lobby:badge_unlocked", {
          detail: { badgeId, badge: badgeDef, coins: user.coins },
        })
      );
    }

    if (badgeDef) {
      toast.add({
        title: `🏆 BAŞARIM AÇILDI: ${badgeDef.name}!`,
        description: `${badgeDef.icon} ${badgeDef.description} (+${badgeDef.coinReward} 🪙 Kazanıldı)`,
        type: "success",
      });
    }

    return true;
  } catch {
    // If already unlocked or error, ignore quietly
    return false;
  }
}

export async function awardCoins(amount: number, reason?: string): Promise<number> {
  try {
    const res = await apiClient.post<{ coins: number }>("/users/coins/add", { amount });
    const newCoins = res.data.coins;

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("lobby:coins_updated", {
          detail: { coins: newCoins, amount },
        })
      );
    }

    toast.add({
      title: `+${amount} 🪙 Lobby Coin!`,
      description: reason || "Tebrikler, görev tamamlandı ve ödülün cüzdanına eklendi.",
      type: "success",
    });

    return newCoins;
  } catch {
    return 0;
  }
}
