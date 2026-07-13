import { avatarSignature, ensureAvatarAsset } from "./avatarAssetService";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export function posterTier(streakDays) {
  if (streakDays >= 30) return "Mastery";
  if (streakDays >= 14) return "Ritual";
  if (streakDays >= 7) return "Glow";
  if (streakDays >= 3) return "Momentum";
  return "Begin";
}

export async function createPosterEvent({ user, habit, checkIn, streakDays, avatarRecipe }) {
  const theme = habit.category;
  const asset = await ensureAvatarAsset(avatarRecipe, theme);
  const event = {
    id: `poster_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    userId: user?.id || "local",
    habitId: habit.id,
    checkInId: checkIn.id,
    theme,
    streakDays,
    avatarAssetSignature: asset.signature || avatarSignature(avatarRecipe, theme),
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured && user?.id) {
    await supabase.from("poster_events").insert({
      id: event.id,
      user_id: user.id,
      habit_id: habit.id,
      check_in_id: checkIn.id,
      theme,
      streak_days: streakDays,
      avatar_asset_signature: event.avatarAssetSignature
    });
  }

  return { ...event, asset };
}
