import {
  accessories,
  avatarPartByKey,
  bodyTypes,
  hairColors,
  hairStyles,
  normalizeAvatarRecipe,
  skinTones,
  themeOutfits
} from "../data/avatarParts";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

const BUCKET = "avatar-assets";

export function avatarSignature(recipe, theme) {
  const normalized = normalizeAvatarRecipe(recipe);
  const raw = `avatar_v1:${normalized.bodyType}:${normalized.skinTone}:${normalized.hairStyle}:${normalized.hairColor}:${normalized.accessory}:${theme}`;
  return `av_${stableHash(raw)}`;
}

export async function ensureAvatarAsset(recipe, theme) {
  const normalized = normalizeAvatarRecipe(recipe);
  const signature = avatarSignature(normalized, theme);
  if (!isSupabaseConfigured) {
    return { signature, publicUrl: null, storagePath: `${signature}.svg`, reused: true };
  }

  const existing = await supabase.from("avatar_assets").select("*").eq("signature", signature).maybeSingle();
  if (!existing.error && existing.data) {
    return {
      signature,
      publicUrl: existing.data.public_url,
      storagePath: existing.data.storage_path,
      reused: true
    };
  }

  const storagePath = `${signature}.svg`;
  const svg = avatarSvgMarkup(normalized, theme);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const uploaded = await supabase.storage.from(BUCKET).upload(storagePath, blob, {
    contentType: "image/svg+xml",
    upsert: false
  });
  if (uploaded.error && uploaded.error.statusCode !== "409") throw uploaded.error;

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const publicUrl = publicData?.publicUrl || null;
  const upserted = await supabase
    .from("avatar_assets")
    .upsert(
      {
        signature,
        storage_path: storagePath,
        public_url: publicUrl,
        recipe_json: { ...normalized, theme }
      },
      { onConflict: "signature" }
    )
    .select()
    .single();
  if (upserted.error) throw upserted.error;

  return { signature, publicUrl, storagePath, reused: false };
}

export function avatarSvgMarkup(recipe, theme) {
  const normalized = normalizeAvatarRecipe(recipe);
  const skin = avatarPartByKey(skinTones, normalized.skinTone);
  const hair = avatarPartByKey(hairColors, normalized.hairColor);
  const hairStyle = avatarPartByKey(hairStyles, normalized.hairStyle);
  const body = avatarPartByKey(bodyTypes, normalized.bodyType);
  const accessory = avatarPartByKey(accessories, normalized.accessory);
  const outfit = themeOutfits[theme] || themeOutfits.fitness;
  const bodyWidth = body.width;
  const left = 100 - bodyWidth / 2;
  const right = 100 + bodyWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
    <rect width="200" height="240" rx="28" fill="#F8FAFC"/>
    <ellipse cx="100" cy="225" rx="54" ry="10" fill="#CBD5E1"/>
    <line x1="78" y1="130" x2="58" y2="178" stroke="${skin.color}" stroke-width="13" stroke-linecap="round"/>
    <line x1="122" y1="130" x2="142" y2="178" stroke="${skin.color}" stroke-width="13" stroke-linecap="round"/>
    <path d="M${left + 10} 116 L${right - 10} 116 L${right} 184 L${left} 184 Z" fill="${outfit.primary}"/>
    <line x1="88" y1="184" x2="82" y2="218" stroke="#273449" stroke-width="14" stroke-linecap="round"/>
    <line x1="112" y1="184" x2="118" y2="218" stroke="#273449" stroke-width="14" stroke-linecap="round"/>
    ${hairStyle.key === "long" ? `<path d="M65 74 C65 42 86 27 106 32 C130 38 139 61 132 98 C127 126 75 126 68 99 C66 91 65 82 65 74 Z" fill="${hair.color}"/>` : ""}
    <circle cx="100" cy="78" r="36" fill="${skin.color}"/>
    <path d="M68 70 C71 42 92 32 113 39 C126 43 134 55 134 73 C116 62 92 61 68 70 Z" fill="${hair.color}"/>
    <circle cx="88" cy="82" r="3.2" fill="#111827"/>
    <circle cx="112" cy="82" r="3.2" fill="#111827"/>
    <path d="M91 99 C97 104 105 104 111 99" stroke="#7F3B2D" stroke-width="3" stroke-linecap="round" fill="none"/>
    ${accessory.key === "round_glasses" ? `<circle cx="88" cy="82" r="10" stroke="#111827" stroke-width="2.6" fill="none"/><circle cx="112" cy="82" r="10" stroke="#111827" stroke-width="2.6" fill="none"/><line x1="98" y1="82" x2="102" y2="82" stroke="#111827" stroke-width="2.6"/>` : ""}
    ${accessory.key === "visor" ? `<path d="M62 66 C86 54 115 54 139 66 L132 76 C112 68 88 68 68 76 Z" fill="#F8FAFC"/>` : ""}
    ${accessory.key === "earrings" ? `<circle cx="63" cy="88" r="4" fill="#FACC15"/><circle cx="137" cy="88" r="4" fill="#FACC15"/>` : ""}
  </svg>`;
}

function stableHash(value) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}
