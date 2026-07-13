import AsyncStorage from "@react-native-async-storage/async-storage";
import { defaultAvatarRecipe, normalizeAvatarRecipe, recipeToDatabase } from "../data/avatarParts";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

const LOCAL_PROFILE_KEY = "daily-reset-profile-v1";

export function emptyProfile(user) {
  return {
    id: user?.id || "local-profile",
    email: user?.email || "",
    phone: user?.phone || "",
    displayName: "",
    onboardingCompleted: false,
    avatarRecipe: defaultAvatarRecipe
  };
}

async function loadLocalProfile(user) {
  const raw = await AsyncStorage.getItem(`${LOCAL_PROFILE_KEY}-${user?.id || "local"}`);
  return raw ? { ...emptyProfile(user), ...JSON.parse(raw) } : emptyProfile(user);
}

async function saveLocalProfile(user, profile) {
  const normalized = {
    ...emptyProfile(user),
    ...profile,
    avatarRecipe: normalizeAvatarRecipe(profile.avatarRecipe)
  };
  await AsyncStorage.setItem(`${LOCAL_PROFILE_KEY}-${user?.id || "local"}`, JSON.stringify(normalized));
  return normalized;
}

export async function loadProfile(user) {
  if (!user) return emptyProfile(user);
  if (!isSupabaseConfigured) return loadLocalProfile(user);

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    if (!profile) {
      const next = emptyProfile(user);
      await saveProfile(user, next);
      return next;
    }

    const { data: recipe, error: recipeError } = await supabase
      .from("avatar_recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recipeError) throw recipeError;

    return {
      id: profile.id,
      email: profile.email || user.email || "",
      phone: profile.phone || user.phone || "",
      displayName: profile.display_name || "",
      onboardingCompleted: Boolean(profile.onboarding_completed),
      avatarRecipe: normalizeAvatarRecipe(recipe || defaultAvatarRecipe)
    };
  } catch (_error) {
    return loadLocalProfile(user);
  }
}

export async function saveProfile(user, profile) {
  if (!user) return profile;
  const normalized = {
    ...emptyProfile(user),
    ...profile,
    avatarRecipe: normalizeAvatarRecipe(profile.avatarRecipe)
  };

  if (!isSupabaseConfigured) return saveLocalProfile(user, normalized);

  try {
    const recipePayload = {
      user_id: user.id,
      ...recipeToDatabase(normalized.avatarRecipe)
    };
    const { data: recipe, error: recipeError } = await supabase
      .from("avatar_recipes")
      .upsert(recipePayload, { onConflict: "user_id" })
      .select()
      .single();
    if (recipeError) throw recipeError;

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email || normalized.email || null,
        phone: user.phone || normalized.phone || null,
        display_name: normalized.displayName || null,
        onboarding_completed: Boolean(normalized.onboardingCompleted),
        avatar_recipe_id: recipe?.id || null
      },
      { onConflict: "id" }
    );
    if (profileError) throw profileError;

    return normalized;
  } catch (_error) {
    return saveLocalProfile(user, normalized);
  }
}
