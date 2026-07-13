import AsyncStorage from "@react-native-async-storage/async-storage";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

const STORAGE_KEY = "daily-reset-state-v1";

export const initialState = {
  onboardingCompleted: false,
  habits: [],
  checkIns: [],
  userBadges: [],
  posterEvents: [],
  paywallEvents: [],
  isPremium: false
};

function userStateKey(user) {
  return user?.id ? `${STORAGE_KEY}-${user.id}` : STORAGE_KEY;
}

async function loadLocalState(user) {
  const raw = await AsyncStorage.getItem(userStateKey(user));
  if (!raw) return initialState;
  return normalizeState(JSON.parse(raw));
}

async function saveLocalState(state, user) {
  await AsyncStorage.setItem(userStateKey(user), JSON.stringify(normalizeState(state)));
}

export async function loadState(user) {
  const localState = await loadLocalState(user);
  if (!canUseRemote(user)) return localState;

  try {
    const remoteState = await loadRemoteState(user.id);
    if (isEmptyState(remoteState) && !isEmptyState(localState)) {
      await saveRemoteState(localState, user.id);
      return localState;
    }
    await saveLocalState(remoteState, user);
    return remoteState;
  } catch (error) {
    console.warn("Falling back to local state after Supabase load failed.", error.message);
    return localState;
  }
}

export async function saveState(state, user) {
  const normalized = normalizeState(state);
  await saveLocalState(normalized, user);
  if (!canUseRemote(user)) return;

  try {
    await saveRemoteState(normalized, user.id);
  } catch (error) {
    console.warn("Saved locally, but Supabase sync failed.", error.message);
  }
}

export async function resetState(user) {
  await AsyncStorage.removeItem(userStateKey(user));
  if (!canUseRemote(user)) return;

  try {
    await resetRemoteState(user.id);
  } catch (error) {
    console.warn("Local reset completed, but Supabase reset failed.", error.message);
  }
}

export function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function canUseRemote(user) {
  return Boolean(isSupabaseConfigured && user?.id);
}

function normalizeState(state) {
  return {
    ...initialState,
    ...state,
    habits: Array.isArray(state?.habits) ? state.habits : [],
    checkIns: Array.isArray(state?.checkIns) ? state.checkIns : [],
    userBadges: Array.isArray(state?.userBadges) ? state.userBadges : [],
    posterEvents: Array.isArray(state?.posterEvents) ? state.posterEvents : [],
    paywallEvents: Array.isArray(state?.paywallEvents) ? state.paywallEvents : [],
    isPremium: Boolean(state?.isPremium)
  };
}

function isEmptyState(state) {
  const normalized = normalizeState(state);
  return (
    normalized.habits.length === 0 &&
    normalized.checkIns.length === 0 &&
    normalized.userBadges.length === 0 &&
    normalized.posterEvents.length === 0 &&
    normalized.paywallEvents.length === 0 &&
    !normalized.isPremium
  );
}

async function loadRemoteState(userId) {
  const [profileResult, habitsResult, checkInsResult, badgesResult, posterEventsResult, paywallEventsResult] = await Promise.all([
    supabase.from("profiles").select("is_premium").eq("id", userId).maybeSingle(),
    supabase.from("habits").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("check_ins").select("*").eq("user_id", userId).order("check_date", { ascending: false }),
    supabase.from("user_badges").select("*").eq("user_id", userId).order("unlocked_at", { ascending: true }),
    supabase.from("poster_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("paywall_events").select("*").eq("user_id", userId).order("created_at", { ascending: false })
  ]);

  const error = [profileResult, habitsResult, checkInsResult, badgesResult, posterEventsResult, paywallEventsResult].find((result) => result.error)?.error;
  if (error) throw error;

  return normalizeState({
    isPremium: Boolean(profileResult.data?.is_premium),
    habits: (habitsResult.data || []).map(habitFromRow),
    checkIns: (checkInsResult.data || []).map(checkInFromRow),
    userBadges: (badgesResult.data || []).map(userBadgeFromRow),
    posterEvents: (posterEventsResult.data || []).map(posterEventFromRow),
    paywallEvents: (paywallEventsResult.data || []).map(paywallEventFromRow)
  });
}

async function saveRemoteState(state, userId) {
  const normalized = normalizeState(state);

  await resetRemoteState(userId);

  const profileResult = await supabase.from("profiles").upsert(
    {
      id: userId,
      is_premium: normalized.isPremium
    },
    { onConflict: "id" }
  );
  if (profileResult.error) throw profileResult.error;

  if (normalized.habits.length > 0) {
    const { error } = await supabase.from("habits").insert(normalized.habits.map((habit) => habitToRow(habit, userId)));
    if (error) throw error;
  }

  if (normalized.checkIns.length > 0) {
    const { error } = await supabase.from("check_ins").insert(normalized.checkIns.map((checkIn) => checkInToRow(checkIn, userId)));
    if (error) throw error;
  }

  if (normalized.userBadges.length > 0) {
    const { error } = await supabase.from("user_badges").insert(normalized.userBadges.map((badge) => userBadgeToRow(badge, userId)));
    if (error) throw error;
  }

  if (normalized.posterEvents.length > 0) {
    const { error } = await supabase.from("poster_events").upsert(normalized.posterEvents.map((event) => posterEventToRow(event, userId)), { onConflict: "id" });
    if (error) throw error;
  }

  if (normalized.paywallEvents.length > 0) {
    const { error } = await supabase.from("paywall_events").insert(normalized.paywallEvents.map((event) => paywallEventToRow(event, userId)));
    if (error) throw error;
  }
}

async function resetRemoteState(userId) {
  const tables = ["paywall_events", "user_badges", "poster_events", "check_ins", "habits"];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    if (error) throw error;
  }
}

function habitFromRow(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    unit: row.unit,
    targetValue: row.target_value === null ? null : Number(row.target_value),
    reminderEnabled: Boolean(row.reminder_enabled),
    reminderHour: Number(row.reminder_hour ?? 21),
    reminderMinute: Number(row.reminder_minute ?? 0),
    createdAt: row.created_at,
    isArchived: Boolean(row.is_archived)
  };
}

function habitToRow(habit, userId) {
  return {
    id: habit.id,
    user_id: userId,
    title: habit.title,
    category: habit.category,
    unit: habit.unit,
    target_value: habit.targetValue,
    reminder_enabled: Boolean(habit.reminderEnabled),
    reminder_hour: Number(habit.reminderHour ?? 21),
    reminder_minute: Number(habit.reminderMinute ?? 0),
    is_archived: Boolean(habit.isArchived),
    created_at: habit.createdAt || new Date().toISOString()
  };
}

function checkInFromRow(row) {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.check_date,
    value: row.value === null ? null : Number(row.value),
    note: row.note || "",
    createdAt: row.created_at
  };
}

function checkInToRow(checkIn, userId) {
  return {
    id: checkIn.id,
    user_id: userId,
    habit_id: checkIn.habitId,
    check_date: checkIn.date,
    value: checkIn.value,
    note: checkIn.note || null,
    created_at: checkIn.createdAt || checkIn.date || new Date().toISOString()
  };
}

function userBadgeFromRow(row) {
  return {
    id: row.id,
    badgeCode: row.badge_code,
    habitId: row.habit_id,
    unlockedAt: row.unlocked_at,
    shareCount: Number(row.share_count || 0)
  };
}

function userBadgeToRow(badge, userId) {
  return {
    id: badge.id,
    user_id: userId,
    badge_code: badge.badgeCode,
    habit_id: badge.habitId || null,
    unlocked_at: badge.unlockedAt || new Date().toISOString(),
    share_count: Number(badge.shareCount || 0)
  };
}

function posterEventFromRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    habitId: row.habit_id,
    checkInId: row.check_in_id,
    theme: row.theme,
    streakDays: Number(row.streak_days || 1),
    avatarAssetSignature: row.avatar_asset_signature,
    createdAt: row.created_at
  };
}

function posterEventToRow(event, userId) {
  return {
    id: event.id,
    user_id: userId,
    habit_id: event.habitId,
    check_in_id: event.checkInId,
    theme: event.theme,
    streak_days: Number(event.streakDays || 1),
    avatar_asset_signature: event.avatarAssetSignature === "local" ? null : event.avatarAssetSignature || null,
    created_at: event.createdAt || new Date().toISOString()
  };
}

function paywallEventFromRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    eventType: row.event_type,
    payload: row.payload || {},
    createdAt: row.created_at
  };
}

function paywallEventToRow(event, userId) {
  return {
    id: event.id,
    user_id: userId,
    event_type: event.eventType || event.type || "unknown",
    payload: event.payload || {},
    created_at: event.createdAt || new Date().toISOString()
  };
}
