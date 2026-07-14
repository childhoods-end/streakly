export const defaultAvatarRecipe = {
  bodyType: "active",
  skinTone: "warm",
  hairStyle: "short",
  hairColor: "dark",
  accessory: "none"
};

export const bodyTypes = [
  {
    key: "active",
    label: "Active",
    description: "Upright stance with energetic shoulders.",
    width: 76,
    torso: "athletic"
  },
  {
    key: "focused",
    label: "Focused",
    description: "Compact silhouette with a thoughtful posture.",
    width: 68,
    torso: "tailored"
  },
  {
    key: "open",
    label: "Open",
    description: "Relaxed shape with an expressive presence.",
    width: 82,
    torso: "soft"
  },
  {
    key: "calm",
    label: "Calm",
    description: "Grounded stance with gentle proportions.",
    width: 72,
    torso: "flow"
  }
];

export const skinTones = [
  { key: "porcelain", label: "Porcelain", color: "#F2C9B4" },
  { key: "warm", label: "Warm", color: "#C9855D" },
  { key: "golden", label: "Golden", color: "#A9653E" },
  { key: "deep", label: "Deep", color: "#6E3F31" }
];

export const hairStyles = [
  { key: "short", label: "Short" },
  { key: "bob", label: "Bob" },
  { key: "curly", label: "Curly" },
  { key: "long", label: "Long" }
];

export const hairColors = [
  { key: "dark", label: "Dark", color: "#211A1D" },
  { key: "brown", label: "Brown", color: "#6F432A" },
  { key: "auburn", label: "Auburn", color: "#9B3F2F" },
  { key: "silver", label: "Silver", color: "#C9CED6" }
];

export const accessories = [
  { key: "none", label: "None" },
  { key: "round_glasses", label: "Round Glasses" },
  { key: "visor", label: "Visor" },
  { key: "earrings", label: "Earrings" }
];

export const themeOutfits = {
  fitness: { label: "Training set", primary: "#F97316", secondary: "#111827", prop: "mat" },
  reading: { label: "Reading cardigan", primary: "#2563EB", secondary: "#FACC15", prop: "book" },
  study: { label: "Study jacket", primary: "#7C3AED", secondary: "#38BDF8", prop: "notes" },
  meditation: { label: "Meditation robe", primary: "#059669", secondary: "#A7F3D0", prop: "lotus" }
};

export const posterBackgrounds = [
  { min: 1, label: "Begin", density: 1 },
  { min: 3, label: "Momentum", density: 2 },
  { min: 7, label: "Glow", density: 3 },
  { min: 14, label: "Ritual", density: 4 },
  { min: 30, label: "Mastery", density: 5 }
];

export const visualReferenceNote =
  "The companions are original Streakly mascots built from soft shapes, theme outfits, and reusable avatar recipes.";

export function avatarPartByKey(parts, key) {
  return parts.find((part) => part.key === key) || parts[0];
}

export function normalizeAvatarRecipe(recipe = {}) {
  return {
    bodyType: recipe.bodyType || recipe.body_type || defaultAvatarRecipe.bodyType,
    skinTone: recipe.skinTone || recipe.skin_tone || defaultAvatarRecipe.skinTone,
    hairStyle: recipe.hairStyle || recipe.hair_style || defaultAvatarRecipe.hairStyle,
    hairColor: recipe.hairColor || recipe.hair_color || defaultAvatarRecipe.hairColor,
    accessory: recipe.accessory || defaultAvatarRecipe.accessory
  };
}

export function recipeToDatabase(recipe) {
  const normalized = normalizeAvatarRecipe(recipe);
  return {
    body_type: normalized.bodyType,
    skin_tone: normalized.skinTone,
    hair_style: normalized.hairStyle,
    hair_color: normalized.hairColor,
    accessory: normalized.accessory
  };
}
