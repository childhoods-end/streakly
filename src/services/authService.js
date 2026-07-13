import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

WebBrowser.maybeCompleteAuthSession();

const LOCAL_SESSION_KEY = "daily-reset-local-session-v1";
const LOCAL_PHONE_KEY = "daily-reset-local-phone-v1";

function localUser(identifier, provider = "email") {
  return {
    id: `local-${provider}-${identifier || "demo"}`.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase(),
    email: provider === "phone" ? null : identifier,
    phone: provider === "phone" ? identifier : null,
    app_metadata: { provider },
    user_metadata: {}
  };
}

async function saveLocalSession(user) {
  const session = { user, access_token: "local-demo-session" };
  await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  return { session, user };
}

export async function getSession() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session: data.session, user: data.session?.user || null };
  }

  const raw = await AsyncStorage.getItem(LOCAL_SESSION_KEY);
  const session = raw ? JSON.parse(raw) : null;
  return { session, user: session?.user || null };
}

export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured) return { unsubscribe: () => {} };
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback({ session, user: session?.user || null });
  });
  return data.subscription;
}

export async function signUpWithEmail(email, password) {
  if (!isSupabaseConfigured) return saveLocalSession(localUser(email, "email"));
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return { session: data.session, user: data.user };
}

export async function signInWithEmail(email, password) {
  if (!isSupabaseConfigured) return saveLocalSession(localUser(email, "email"));
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { session: data.session, user: data.user };
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) return saveLocalSession(localUser("google-user@example.com", "google"));

  const redirectTo = Linking.createURL("auth/callback");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true
    }
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") throw new Error("Google sign-in was cancelled.");

  const parsed = new URL(result.url);
  const code = parsed.searchParams.get("code");
  if (code) {
    const exchanged = await supabase.auth.exchangeCodeForSession(code);
    if (exchanged.error) throw exchanged.error;
    return { session: exchanged.data.session, user: exchanged.data.session?.user || null };
  }

  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    const session = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (session.error) throw session.error;
    return { session: session.data.session, user: session.data.session?.user || null };
  }

  throw new Error("Google sign-in did not return a session.");
}

export async function sendPhoneOtp(phone) {
  if (!isSupabaseConfigured) {
    await AsyncStorage.setItem(LOCAL_PHONE_KEY, JSON.stringify({ phone, code: "123456" }));
    return { localCode: "123456" };
  }
  const { data, error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
  return data;
}

export async function verifyPhoneOtp(phone, token) {
  if (!isSupabaseConfigured) {
    const raw = await AsyncStorage.getItem(LOCAL_PHONE_KEY);
    const pending = raw ? JSON.parse(raw) : null;
    if (!pending || pending.phone !== phone || pending.code !== token) throw new Error("Invalid local verification code.");
    return saveLocalSession(localUser(phone, "phone"));
  }
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) throw error;
  return { session: data.session, user: data.user };
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
  await AsyncStorage.removeItem(LOCAL_SESSION_KEY);
}
