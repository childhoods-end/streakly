import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { AvatarFigure } from "./components/AvatarFigure";
import { CheckInPoster } from "./components/CheckInPoster";
import {
  accessories,
  bodyTypes,
  defaultAvatarRecipe,
  hairColors,
  hairStyles,
  normalizeAvatarRecipe,
  skinTones,
  visualReferenceNote
} from "./data/avatarParts";
import { badgeDefinitions, levelColors } from "./data/badges";
import { categories, units } from "./data/categories";
import { evaluateBadges, progressText, userBadgeFor } from "./services/badgeEngine";
import {
  getSession,
  onAuthStateChange,
  sendPhoneOtp,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  verifyPhoneOtp
} from "./services/authService";
import { isSupabaseConfigured } from "./services/supabaseClient";
import { cancelReminder, requestNotificationPermission, scheduleDailyReminder } from "./services/notifications";
import { createPosterEvent } from "./services/posterService";
import { loadProfile, saveProfile } from "./services/profileService";
import { saveBadge, savePoster, shareBadge, sharePoster } from "./services/share";
import { initialState, loadState, makeId, resetState, saveState } from "./services/storage";
import {
  bestStreak,
  checkInsForHabit,
  completionRate,
  currentStreak,
  generateWeeklyInsight,
  isCheckedInToday,
  overallCompletionRate
} from "./services/streak";

const tabs = [
  ["today", "Today"],
  ["progress", "Progress"],
  ["habits", "Habits"],
  ["achievements", "Awards"],
  ["settings", "Settings"]
];

const emptyHabit = {
  title: "",
  category: "fitness",
  unit: "minutes",
  targetValue: "10",
  reminderEnabled: false,
  reminderHour: "21",
  reminderMinute: "0"
};

export default function App() {
  const [state, setState] = useState(initialState);
  const [ready, setReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("today");
  const [authError, setAuthError] = useState("");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [draft, setDraft] = useState({ ...emptyHabit, title: "Move for 10 minutes", reminderEnabled: true });
  const [avatarDraft, setAvatarDraft] = useState(defaultAvatarRecipe);
  const [habitEditor, setHabitEditor] = useState(null);
  const [avatarEditorVisible, setAvatarEditorVisible] = useState(false);
  const [checkInHabit, setCheckInHabit] = useState(null);
  const [checkInValue, setCheckInValue] = useState("1");
  const [unlockedBadge, setUnlockedBadge] = useState(null);
  const [pendingBadge, setPendingBadge] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [poster, setPoster] = useState(null);
  const [busy, setBusy] = useState(false);
  const shareCardRef = useRef(null);
  const posterCardRef = useRef(null);

  useEffect(() => {
    let alive = true;
    async function bootstrap() {
      try {
        const sessionResult = await getSession();
        const loadedState = await loadState(sessionResult.user);
        if (!alive) return;
        setState(loadedState);
        setUser(sessionResult.user);
        if (sessionResult.user) {
          const loadedProfile = await loadProfile(sessionResult.user);
          if (!alive) return;
          setProfile(loadedProfile);
          setAvatarDraft(normalizeAvatarRecipe(loadedProfile.avatarRecipe));
        }
      } catch (error) {
        setAuthError(error.message);
      } finally {
        if (alive) {
          setReady(true);
          setAuthReady(true);
        }
      }
    }
    bootstrap();
    const subscription = onAuthStateChange(async ({ user: nextUser }) => {
      setUser(nextUser);
      if (nextUser) {
        const [loadedProfile, loadedState] = await Promise.all([loadProfile(nextUser), loadState(nextUser)]);
        setProfile(loadedProfile);
        setState(loadedState);
        setAvatarDraft(normalizeAvatarRecipe(loadedProfile.avatarRecipe));
      } else {
        setProfile(null);
        setState(initialState);
      }
    });
    return () => {
      alive = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  async function commit(updater) {
    const next = typeof updater === "function" ? updater(state) : updater;
    setState(next);
    await saveState(next, user);
  }

  const activeHabits = useMemo(() => state.habits.filter((habit) => !habit.isArchived), [state.habits]);
  const avatarRecipe = normalizeAvatarRecipe(profile?.avatarRecipe || avatarDraft);

  if (!ready || !authReady) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loading}>Daily Reset</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="default" />
        <AuthScreen
          error={authError}
          setError={setAuthError}
          onAuthenticated={async (result) => {
            setUser(result.user);
            const loadedProfile = await loadProfile(result.user);
            setProfile(loadedProfile);
            setAvatarDraft(normalizeAvatarRecipe(loadedProfile.avatarRecipe));
          }}
        />
      </SafeAreaView>
    );
  }

  if (!profile || !profile.onboardingCompleted) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="default" />
        <Onboarding
          step={onboardingStep}
          setStep={setOnboardingStep}
          draft={draft}
          setDraft={setDraft}
          avatarDraft={avatarDraft}
          setAvatarDraft={setAvatarDraft}
          onFinish={finishOnboarding}
          busy={busy}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="default" />
      <View style={styles.shell}>
        <ScrollView contentContainerStyle={styles.screen}>
          {tab === "today" && (
            <TodayScreen
              habits={activeHabits}
              checkIns={state.checkIns}
              avatarRecipe={avatarRecipe}
              onCheckIn={(habit) => beginCheckIn(habit)}
              onCreate={() => openHabitEditor()}
            />
          )}
          {tab === "progress" && <ProgressScreen habits={activeHabits} checkIns={state.checkIns} />}
          {tab === "habits" && (
            <HabitsScreen
              habits={activeHabits}
              checkIns={state.checkIns}
              onCreate={() => openHabitEditor()}
              onEdit={(habit) => openHabitEditor(habit)}
              onArchive={(habit) => archiveHabit(habit)}
              onDelete={(habit) => deleteHabit(habit)}
            />
          )}
          {tab === "achievements" && (
            <AchievementsScreen
              habits={activeHabits}
              checkIns={state.checkIns}
              userBadges={state.userBadges}
              onSelect={setSelectedBadge}
            />
          )}
          {tab === "settings" && (
            <SettingsScreen
              profile={profile}
              avatarRecipe={avatarRecipe}
              onEditAvatar={() => setAvatarEditorVisible(true)}
              onReset={() => resetAll()}
              onSignOut={handleSignOut}
            />
          )}
        </ScrollView>

        <View style={styles.tabBar}>
          {tabs.map(([key, label]) => (
            <Pressable key={key} onPress={() => setTab(key)} style={[styles.tabItem, tab === key && styles.tabActive]}>
              <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <HabitEditorModal
        visible={Boolean(habitEditor)}
        initial={habitEditor?.habit}
        onClose={() => setHabitEditor(null)}
        onSave={(savedDraft) => saveHabit(savedDraft, habitEditor?.habit)}
      />

      <AvatarEditorModal
        visible={avatarEditorVisible}
        initial={avatarRecipe}
        onClose={() => setAvatarEditorVisible(false)}
        onSave={saveAvatarRecipe}
      />

      <CheckInModal
        habit={checkInHabit}
        value={checkInValue}
        setValue={setCheckInValue}
        onClose={() => setCheckInHabit(null)}
        onSave={() => completeCheckIn()}
      />

      <PosterModal
        poster={poster}
        avatarRecipe={avatarRecipe}
        cardRef={posterCardRef}
        onClose={() => {
          setPoster(null);
          if (pendingBadge) {
            setUnlockedBadge(pendingBadge);
            setPendingBadge(null);
          }
        }}
      />

      <BadgeModal
        definition={unlockedBadge || selectedBadge}
        userBadge={(unlockedBadge || selectedBadge) ? userBadgeFor(unlockedBadge || selectedBadge, state.userBadges) : null}
        currentStreak={Math.max(0, ...activeHabits.map((habit) => currentStreak(habit, state.checkIns)))}
        cardRef={shareCardRef}
        onClose={() => {
          setUnlockedBadge(null);
          setSelectedBadge(null);
        }}
      />
    </SafeAreaView>
  );

  async function finishOnboarding() {
    if (busy || !draft.title.trim()) return;
    setBusy(true);
    try {
      const habit = buildHabit(draft);
      await commit({ ...state, onboardingCompleted: true, habits: [habit] });
      const nextProfile = await saveProfile(user, {
        ...profile,
        onboardingCompleted: true,
        avatarRecipe: avatarDraft
      });
      setProfile(nextProfile);
      if (habit.reminderEnabled) scheduleDailyReminder(habit);
    } finally {
      setBusy(false);
    }
  }

  function openHabitEditor(habit = null) {
    setHabitEditor({ habit });
  }

  async function saveHabit(savedDraft, existingHabit) {
    const habit = buildHabit(savedDraft, existingHabit);
    const habits = existingHabit ? state.habits.map((item) => (item.id === existingHabit.id ? habit : item)) : [...state.habits, habit];
    await commit({ ...state, habits });
    setHabitEditor(null);
    if (habit.reminderEnabled) scheduleDailyReminder(habit);
    else cancelReminder(habit);
  }

  async function saveAvatarRecipe(recipe) {
    const nextProfile = await saveProfile(user, { ...profile, avatarRecipe: recipe });
    setProfile(nextProfile);
    setAvatarEditorVisible(false);
  }

  function archiveHabit(habit) {
    commit({ ...state, habits: state.habits.map((item) => (item.id === habit.id ? { ...item, isArchived: true } : item)) });
    cancelReminder(habit);
  }

  function deleteHabit(habit) {
    confirmAction("Delete habit?", "This removes the habit and its check-ins from your account.", () => {
      commit({
        ...state,
        habits: state.habits.filter((item) => item.id !== habit.id),
        checkIns: state.checkIns.filter((checkIn) => checkIn.habitId !== habit.id)
      });
      cancelReminder(habit);
    });
  }

  function beginCheckIn(habit) {
    if (isCheckedInToday(habit, state.checkIns)) return;
    if (unitFor(habit.unit).needsValue) {
      setCheckInValue(String(habit.targetValue || 1));
      setCheckInHabit(habit);
    } else {
      completeCheckIn(habit, null);
    }
  }

  async function completeCheckIn(habitArg = checkInHabit, valueArg = Number(checkInValue)) {
    if (!habitArg || isCheckedInToday(habitArg, state.checkIns)) return;
    const checkIn = {
      id: makeId("checkin"),
      habitId: habitArg.id,
      date: new Date().toISOString(),
      value: unitFor(habitArg.unit).needsValue ? Number(valueArg || habitArg.targetValue || 1) : null,
      note: "",
      createdAt: new Date().toISOString()
    };
    const nextCheckIns = [checkIn, ...state.checkIns];
    const newlyUnlocked = evaluateBadges(habitArg, state.habits, nextCheckIns, state.userBadges);
    const nextUserBadges = [
      ...state.userBadges,
      ...newlyUnlocked.map((definition) => ({
        id: makeId("badge"),
        badgeCode: definition.code,
        habitId: habitArg.id,
        unlockedAt: new Date().toISOString(),
        shareCount: 0
      }))
    ];
    const streakDays = currentStreak(habitArg, nextCheckIns);
    let posterEvent = null;

    try {
      posterEvent = await createPosterEvent({
        user,
        habit: habitArg,
        checkIn,
        streakDays,
        avatarRecipe
      });
    } catch (error) {
      posterEvent = {
        id: makeId("poster"),
        userId: user.id,
        habitId: habitArg.id,
        checkInId: checkIn.id,
        theme: habitArg.category,
        streakDays,
        avatarAssetSignature: "local",
        createdAt: new Date().toISOString(),
        error: error.message
      };
    }

    await commit({
      ...state,
      checkIns: nextCheckIns,
      userBadges: nextUserBadges,
      posterEvents: [posterEvent, ...(state.posterEvents || [])]
    });
    setCheckInHabit(null);
    setPoster({
      ...posterEvent,
      habitTitle: habitArg.title,
      themeLabel: categoryFor(habitArg.category).label
    });
    if (newlyUnlocked[0]) setPendingBadge(newlyUnlocked[0]);
  }

  async function resetAll() {
    confirmAction("Reset all data?", "This deletes habits, check-ins, badges, and poster events from your account.", async () => {
      for (const habit of state.habits) await cancelReminder(habit);
      await resetState(user);
      setState(initialState);
      setTab("today");
    });
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setProfile(null);
    setState(initialState);
    setTab("today");
  }
}

function AuthScreen({ error, setError, onAuthenticated }) {
  const [mode, setMode] = useState("email");
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      const result = await action();
      if (result?.user) await onAuthenticated(result);
    } catch (authError) {
      setError(authError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.authScreen}>
      <Text style={styles.appName}>Daily Reset</Text>
      <Text style={styles.slogan}>Build your streak, one day at a time.</Text>
      {!isSupabaseConfigured && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>Supabase env vars are not set. Local demo auth is enabled; phone code is 123456.</Text>
        </View>
      )}
      <View style={styles.segment}>
        <SegmentButton label="Email" active={mode === "email"} onPress={() => setMode("email")} />
        <SegmentButton label="Google" active={mode === "google"} onPress={() => setMode("google")} />
        <SegmentButton label="Phone" active={mode === "phone"} onPress={() => setMode("phone")} />
      </View>

      {mode === "email" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isRegistering ? "Create account" : "Welcome back"}</Text>
          <TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} />
          <Pressable
            style={[styles.primaryButton, busy && styles.disabledButton]}
            disabled={busy}
            onPress={() => run(() => (isRegistering ? signUpWithEmail(email.trim(), password) : signInWithEmail(email.trim(), password)))}
          >
            <Text style={styles.primaryButtonText}>{isRegistering ? "Sign Up" : "Sign In"}</Text>
          </Pressable>
          <Pressable style={styles.linkButton} onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={styles.linkText}>{isRegistering ? "Use an existing account" : "Create a new account"}</Text>
          </Pressable>
        </View>
      )}

      {mode === "google" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Continue with Google</Text>
          <Text style={styles.muted}>Google uses Supabase OAuth and the app scheme deep link configured in Expo.</Text>
          <Pressable style={[styles.primaryButton, busy && styles.disabledButton]} disabled={busy} onPress={() => run(signInWithGoogle)}>
            <Text style={styles.primaryButtonText}>Sign In With Google</Text>
          </Pressable>
        </View>
      )}

      {mode === "phone" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Phone verification</Text>
          <TextInput style={styles.input} keyboardType="phone-pad" placeholder="+15551234567" value={phone} onChangeText={setPhone} />
          {otpSent && <TextInput style={styles.input} keyboardType="number-pad" placeholder="Verification code" value={otp} onChangeText={setOtp} />}
          <Pressable
            style={[styles.primaryButton, busy && styles.disabledButton]}
            disabled={busy}
            onPress={() =>
              run(async () => {
                if (!otpSent) {
                  await sendPhoneOtp(phone.trim());
                  setOtpSent(true);
                  return null;
                }
                return verifyPhoneOtp(phone.trim(), otp.trim());
              })
            }
          >
            <Text style={styles.primaryButtonText}>{otpSent ? "Verify Code" : "Send Code"}</Text>
          </Pressable>
        </View>
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </ScrollView>
  );
}

function Onboarding({ step, setStep, draft, setDraft, avatarDraft, setAvatarDraft, onFinish, busy }) {
  const canContinue = step !== 2 || draft.title.trim().length > 0;
  const progress = ((step + 1) / 4) * 100;

  return (
    <ScrollView contentContainerStyle={styles.onboarding}>
      <Text style={styles.appName}>Create your ritual</Text>
      <Text style={styles.slogan}>Design an original character, then start one daily theme.</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>

      {step === 0 && (
        <View>
          <Header title="Choose a base body" subtitle="Original silhouettes inspired by personality illustration language." />
          <Text style={styles.muted}>{visualReferenceNote}</Text>
          <View style={styles.avatarPreview}><AvatarFigure recipe={avatarDraft} theme={draft.category} size={210} /></View>
          <OptionGrid
            options={bodyTypes}
            selected={avatarDraft.bodyType}
            onSelect={(bodyType) => setAvatarDraft({ ...avatarDraft, bodyType })}
          />
        </View>
      )}
      {step === 1 && (
        <View>
          <Header title="Customize the look" subtitle="Skin tone, hair, color, and accessories remain editable later." />
          <View style={styles.avatarPreview}><AvatarFigure recipe={avatarDraft} theme={draft.category} size={220} /></View>
          <Text style={styles.sectionTitle}>Skin Tone</Text>
          <OptionGrid options={skinTones} selected={avatarDraft.skinTone} onSelect={(skinTone) => setAvatarDraft({ ...avatarDraft, skinTone })} swatches />
          <Text style={styles.sectionTitle}>Hair Style</Text>
          <OptionGrid options={hairStyles} selected={avatarDraft.hairStyle} onSelect={(hairStyle) => setAvatarDraft({ ...avatarDraft, hairStyle })} />
          <Text style={styles.sectionTitle}>Hair Color</Text>
          <OptionGrid options={hairColors} selected={avatarDraft.hairColor} onSelect={(hairColor) => setAvatarDraft({ ...avatarDraft, hairColor })} swatches />
          <Text style={styles.sectionTitle}>Accessory</Text>
          <OptionGrid options={accessories} selected={avatarDraft.accessory} onSelect={(accessory) => setAvatarDraft({ ...avatarDraft, accessory })} />
        </View>
      )}
      {step === 2 && (
        <View>
          <Header title="Pick a check-in theme" subtitle="Four themes drive outfits, poster scenes, and progress badges." />
          <HabitFields draft={draft} setDraft={setDraft} includeTitle />
        </View>
      )}
      {step === 3 && (
        <View>
          <Header title="Set the daily target" subtitle="Keep the target repeatable." />
          <TargetFields draft={draft} setDraft={setDraft} />
          <ReminderFields draft={draft} setDraft={setDraft} />
        </View>
      )}

      <View style={styles.row}>
        {step > 0 && <Pressable style={styles.secondaryButton} onPress={() => setStep(step - 1)}><Text style={styles.secondaryButtonText}>Back</Text></Pressable>}
        <Pressable
          style={[styles.primaryButton, (!canContinue || busy) && styles.disabledButton]}
          disabled={!canContinue || busy}
          onPress={() => (step < 3 ? setStep(step + 1) : onFinish())}
        >
          <Text style={styles.primaryButtonText}>{step < 3 ? "Next" : "Start"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function TodayScreen({ habits, checkIns, avatarRecipe, onCheckIn, onCreate }) {
  const completedToday = habits.filter((habit) => isCheckedInToday(habit, checkIns)).length;
  const longest = Math.max(0, ...habits.map((habit) => currentStreak(habit, checkIns)));
  const featuredTheme = habits[0]?.category || "fitness";

  return (
    <View>
      <Header title="Today" subtitle={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} />
      <View style={styles.heroPanel}>
        <View style={styles.flex}>
          <Text style={styles.heroTitle}>{completedToday}/{habits.length || 0} done</Text>
          <Text style={styles.muted}>Longest active streak: {longest} days</Text>
        </View>
        <AvatarFigure recipe={avatarRecipe} theme={featuredTheme} size={132} />
      </View>
      {habits.length === 0 ? (
        <Empty title="No habits yet" message="Create one themed habit to start your streak." action="Create Habit" onPress={onCreate} />
      ) : (
        habits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} checkIns={checkIns} onCheckIn={() => onCheckIn(habit)} />
        ))
      )}
    </View>
  );
}

function ProgressScreen({ habits, checkIns }) {
  const longest = Math.max(0, ...habits.map((habit) => currentStreak(habit, checkIns)));
  const allTime = Math.max(0, ...habits.map((habit) => bestStreak(habit, checkIns)));

  return (
    <View>
      <Header title="Progress" subtitle="Your overall consistency." />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly Insight</Text>
        <Text style={styles.muted}>{generateWeeklyInsight(habits, checkIns)}</Text>
      </View>
      <View style={styles.grid}>
        <Metric label="Active habits" value={String(habits.length)} />
        <Metric label="Today" value={percent(overallCompletionRate(habits, checkIns, 1))} />
        <Metric label="This week" value={percent(overallCompletionRate(habits, checkIns, 7))} />
        <Metric label="This month" value={percent(overallCompletionRate(habits, checkIns, 30))} />
        <Metric label="Check-ins" value={String(checkIns.length)} />
        <Metric label="Current best" value={String(longest)} />
        <Metric label="All-time best" value={String(allTime)} />
      </View>
      {habits.map((habit) => (
        <View key={habit.id} style={styles.card}>
          <Text style={styles.cardTitle}>{habit.title}</Text>
          <Text style={styles.muted}>{categoryFor(habit.category).label}</Text>
          <View style={styles.statRow}>
            <Metric label="Current" value={String(currentStreak(habit, checkIns))} compact />
            <Metric label="Best" value={String(bestStreak(habit, checkIns))} compact />
            <Metric label="7 days" value={percent(completionRate(habit, checkIns, 7))} compact />
          </View>
        </View>
      ))}
    </View>
  );
}

function HabitsScreen({ habits, checkIns, onCreate, onEdit, onArchive, onDelete }) {
  return (
    <View>
      <Header title="Habits" subtitle="Create, edit, archive, or delete habits." rightLabel="Add" onRight={onCreate} />
      {habits.length === 0 ? (
        <Empty title="No active habits" message="Start with one habit you can repeat today." action="Create Habit" onPress={onCreate} />
      ) : (
        habits.map((habit) => (
          <View key={habit.id} style={styles.card}>
            <Text style={styles.cardTitle}>{habit.title}</Text>
            <Text style={styles.muted}>{categoryFor(habit.category).label} - {targetDescription(habit)}</Text>
            <CalendarPreview habit={habit} checkIns={checkIns} />
            <View style={styles.rowWrap}>
              <SmallButton label="Edit" onPress={() => onEdit(habit)} />
              <SmallButton label="Archive" onPress={() => onArchive(habit)} />
              <SmallButton label="Delete" danger onPress={() => onDelete(habit)} />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function AchievementsScreen({ habits, checkIns, userBadges, onSelect }) {
  const unlocked = badgeDefinitions.filter((definition) => userBadgeFor(definition, userBadges));
  const locked = badgeDefinitions.filter((definition) => !userBadgeFor(definition, userBadges));

  return (
    <View>
      <Header title="Achievements" subtitle="Unlock badges as your habits compound." />
      <Text style={styles.sectionTitle}>Unlocked</Text>
      {unlocked.length === 0 && <Text style={styles.muted}>Your first badge will appear after a check-in.</Text>}
      {unlocked.map((definition) => <BadgeRow key={definition.code} definition={definition} userBadge={userBadgeFor(definition, userBadges)} onPress={() => onSelect(definition)} />)}
      <Text style={styles.sectionTitle}>Locked</Text>
      {locked.map((definition) => (
        <BadgeRow
          key={definition.code}
          definition={definition}
          detail={progressText(definition, habits, checkIns)}
          onPress={() => onSelect(definition)}
        />
      ))}
    </View>
  );
}

function SettingsScreen({ profile, avatarRecipe, onEditAvatar, onReset, onSignOut }) {
  const [notificationStatus, setNotificationStatus] = useState(Platform.OS === "web" ? "Web fallback" : "Not requested");

  return (
    <View>
      <Header title="Settings" subtitle="Account, character, and device controls." />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.muted}>{profile.email || profile.phone || "Signed in"}</Text>
        <SmallButton label="Sign Out" onPress={onSignOut} />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Character</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.muted}>Edit the reusable avatar recipe used in your posters.</Text>
          <AvatarFigure recipe={avatarRecipe} theme="meditation" size={118} />
        </View>
        <SmallButton label="Edit Character" onPress={onEditAvatar} />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notifications</Text>
        <Text style={styles.muted}>Permission: {notificationStatus}</Text>
        <SmallButton label="Request Permission" onPress={async () => setNotificationStatus(await requestNotificationPermission())} />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Backend</Text>
        <Text style={styles.muted}>{isSupabaseConfigured ? "Supabase is configured." : "Supabase env vars are missing; local demo mode is active."}</Text>
      </View>
      <Pressable style={styles.dangerButton} onPress={onReset}><Text style={styles.dangerButtonText}>Reset Account Data</Text></Pressable>
    </View>
  );
}

function HabitEditorModal({ visible, initial, onClose, onSave }) {
  const [localDraft, setLocalDraft] = useState(emptyHabit);

  useEffect(() => {
    setLocalDraft(initial ? { ...initial, targetValue: String(initial.targetValue || 1), reminderHour: String(initial.reminderHour), reminderMinute: String(initial.reminderMinute) } : emptyHabit);
  }, [initial, visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.screen}>
          <Header title={initial ? "Edit Habit" : "New Habit"} subtitle="Choose one of the four poster themes." />
          <HabitFields draft={localDraft} setDraft={setLocalDraft} includeTitle />
          <TargetFields draft={localDraft} setDraft={setLocalDraft} />
          <ReminderFields draft={localDraft} setDraft={setLocalDraft} />
          <View style={styles.row}>
            <Pressable style={styles.secondaryButton} onPress={onClose}><Text style={styles.secondaryButtonText}>Cancel</Text></Pressable>
            <Pressable
              style={[styles.primaryButton, !localDraft.title.trim() && styles.disabledButton]}
              disabled={!localDraft.title.trim()}
              onPress={() => onSave(localDraft)}
            >
              <Text style={styles.primaryButtonText}>Save</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function AvatarEditorModal({ visible, initial, onClose, onSave }) {
  const [localRecipe, setLocalRecipe] = useState(defaultAvatarRecipe);

  useEffect(() => {
    setLocalRecipe(normalizeAvatarRecipe(initial));
  }, [initial, visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.screen}>
          <Header title="Edit Character" subtitle="The same recipe can be reused across users through its stable asset signature." />
          <View style={styles.avatarPreview}><AvatarFigure recipe={localRecipe} theme="fitness" size={230} /></View>
          <Text style={styles.sectionTitle}>Base Body</Text>
          <OptionGrid options={bodyTypes} selected={localRecipe.bodyType} onSelect={(bodyType) => setLocalRecipe({ ...localRecipe, bodyType })} />
          <Text style={styles.sectionTitle}>Skin Tone</Text>
          <OptionGrid options={skinTones} selected={localRecipe.skinTone} onSelect={(skinTone) => setLocalRecipe({ ...localRecipe, skinTone })} swatches />
          <Text style={styles.sectionTitle}>Hair Style</Text>
          <OptionGrid options={hairStyles} selected={localRecipe.hairStyle} onSelect={(hairStyle) => setLocalRecipe({ ...localRecipe, hairStyle })} />
          <Text style={styles.sectionTitle}>Hair Color</Text>
          <OptionGrid options={hairColors} selected={localRecipe.hairColor} onSelect={(hairColor) => setLocalRecipe({ ...localRecipe, hairColor })} swatches />
          <Text style={styles.sectionTitle}>Accessory</Text>
          <OptionGrid options={accessories} selected={localRecipe.accessory} onSelect={(accessory) => setLocalRecipe({ ...localRecipe, accessory })} />
          <View style={styles.row}>
            <Pressable style={styles.secondaryButton} onPress={onClose}><Text style={styles.secondaryButtonText}>Cancel</Text></Pressable>
            <Pressable style={styles.primaryButton} onPress={() => onSave(localRecipe)}><Text style={styles.primaryButtonText}>Save</Text></Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function CheckInModal({ habit, value, setValue, onClose, onSave }) {
  return (
    <Modal visible={Boolean(habit)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.h2}>Check In</Text>
          <Text style={styles.muted}>{habit?.title}</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={value} onChangeText={setValue} />
          <View style={styles.row}>
            <Pressable style={styles.secondaryButton} onPress={onClose}><Text style={styles.secondaryButtonText}>Cancel</Text></Pressable>
            <Pressable style={styles.primaryButton} onPress={onSave}><Text style={styles.primaryButtonText}>Save</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PosterModal({ poster, avatarRecipe, cardRef, onClose }) {
  if (!poster) return null;
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.screen}>
          <Header title="Daily Poster" subtitle="Your character changes outfit by theme and background by streak." />
          <CheckInPoster poster={poster} avatarRecipe={avatarRecipe} cardRef={cardRef} />
          {!!poster.avatarAssetSignature && <Text style={styles.assetText}>Asset signature: {poster.avatarAssetSignature}</Text>}
          <View style={styles.row}>
            <Pressable style={styles.primaryButton} onPress={() => sharePoster(poster, cardRef)}><Text style={styles.primaryButtonText}>Share</Text></Pressable>
            <Pressable style={styles.secondaryButton} onPress={async () => Alert.alert((await savePoster(poster, cardRef)) ? "Saved" : "Not saved")}><Text style={styles.secondaryButtonText}>Save</Text></Pressable>
          </View>
          <Pressable style={styles.secondaryButton} onPress={onClose}><Text style={styles.secondaryButtonText}>Done</Text></Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function BadgeModal({ definition, userBadge, currentStreak, cardRef, onClose }) {
  if (!definition) return null;
  const unlocked = Boolean(userBadge);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.screen}>
          <Header title={unlocked ? "Achievement Unlocked" : "Badge Detail"} subtitle={definition.subtitle} />
          <View ref={cardRef} collapsable={false} style={[styles.shareCard, { backgroundColor: levelColors[definition.level]?.[0] || "#147AFF" }]}>
            <Text style={styles.shareEyebrow}>Achievement Unlocked</Text>
            <Text style={styles.shareIcon}>{definition.icon}</Text>
            <Text style={styles.shareTitle}>{definition.title}</Text>
            <Text style={styles.shareSubtitle}>{definition.subtitle}</Text>
            <Text style={styles.shareMeta}>{definition.level.toUpperCase()} - {currentStreak} day streak</Text>
            <Text style={styles.shareBrand}>Daily Reset</Text>
            <Text style={styles.shareSlogan}>Build your streak, one day at a time.</Text>
          </View>
          <View style={styles.row}>
            <Pressable style={styles.primaryButton} onPress={() => shareBadge(definition, cardRef)}><Text style={styles.primaryButtonText}>Share</Text></Pressable>
            <Pressable style={styles.secondaryButton} onPress={async () => Alert.alert((await saveBadge(definition, cardRef)) ? "Saved" : "Not saved")}><Text style={styles.secondaryButtonText}>Save</Text></Pressable>
          </View>
          <Pressable style={styles.secondaryButton} onPress={onClose}><Text style={styles.secondaryButtonText}>Done</Text></Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function HabitFields({ draft, setDraft, includeTitle }) {
  return (
    <View>
      {includeTitle && (
        <TextInput style={styles.input} placeholder="Read 20 pages" value={draft.title} onChangeText={(title) => setDraft({ ...draft, title })} />
      )}
      <Text style={styles.sectionTitle}>Theme</Text>
      <View style={styles.grid}>
        {categories.map((category) => (
          <ChoiceCard
            key={category.key}
            selected={draft.category === category.key}
            title={category.label}
            detail={category.shortLabel}
            accent={category.accent}
            onPress={() => setDraft({ ...draft, category: category.key, unit: category.defaultUnit, targetValue: defaultTarget(category.defaultUnit) })}
          />
        ))}
      </View>
    </View>
  );
}

function TargetFields({ draft, setDraft }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Daily Target</Text>
      <View style={styles.rowWrap}>
        {units.map((unit) => <SmallButton key={unit.key} label={unit.label} active={draft.unit === unit.key} onPress={() => setDraft({ ...draft, unit: unit.key, targetValue: defaultTarget(unit.key) })} />)}
      </View>
      {unitFor(draft.unit).needsValue && (
        <TextInput style={styles.input} keyboardType="numeric" value={String(draft.targetValue)} onChangeText={(targetValue) => setDraft({ ...draft, targetValue })} />
      )}
    </View>
  );
}

function ReminderFields({ draft, setDraft }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Reminder</Text>
      <SmallButton
        label={draft.reminderEnabled ? "Reminder On" : "Reminder Off"}
        active={draft.reminderEnabled}
        onPress={() => setDraft({ ...draft, reminderEnabled: !draft.reminderEnabled })}
      />
      {draft.reminderEnabled && (
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.timeInput]} keyboardType="numeric" value={String(draft.reminderHour)} onChangeText={(reminderHour) => setDraft({ ...draft, reminderHour })} />
          <Text style={styles.h2}>:</Text>
          <TextInput style={[styles.input, styles.timeInput]} keyboardType="numeric" value={String(draft.reminderMinute)} onChangeText={(reminderMinute) => setDraft({ ...draft, reminderMinute })} />
        </View>
      )}
    </View>
  );
}

function OptionGrid({ options, selected, onSelect, swatches }) {
  return (
    <View style={styles.grid}>
      {options.map((option) => (
        <Pressable key={option.key} style={[styles.option, selected === option.key && styles.optionSelected]} onPress={() => onSelect(option.key)}>
          {swatches && <View style={[styles.swatch, { backgroundColor: option.color }]} />}
          <Text style={[styles.optionText, selected === option.key && styles.optionTextSelected]}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function HabitCard({ habit, checkIns, onCheckIn }) {
  const completed = isCheckedInToday(habit, checkIns);
  const category = categoryFor(habit.category);
  return (
    <View style={[styles.card, { borderLeftWidth: 5, borderLeftColor: category.accent }]}>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{habit.title}</Text>
          <Text style={styles.muted}>{category.label} - {targetDescription(habit)}</Text>
        </View>
        <Text style={styles.streak}>{currentStreak(habit, checkIns)}d</Text>
      </View>
      <Pressable style={[styles.primaryButton, completed && styles.completedButton]} disabled={completed} onPress={onCheckIn}>
        <Text style={styles.primaryButtonText}>{completed ? "Completed" : "Check In"}</Text>
      </Pressable>
    </View>
  );
}

function CalendarPreview({ habit, checkIns }) {
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
  const habitChecks = checkInsForHabit(habit, checkIns);
  return (
    <View style={styles.calendarRow}>
      {days.map((date) => {
        const done = habitChecks.some((checkIn) => new Date(checkIn.date).toDateString() === date.toDateString());
        return <View key={date.toISOString()} style={[styles.dayDot, done && styles.dayDone]}><Text style={styles.dayText}>{date.getDate()}</Text></View>;
      })}
    </View>
  );
}

function BadgeRow({ definition, userBadge, detail, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.rowBetween}>
        <Text style={styles.badgeIcon}>{definition.icon}</Text>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{definition.title}</Text>
          <Text style={styles.muted}>{definition.subtitle}</Text>
          <Text style={styles.badgeLevel}>{userBadge ? `Unlocked ${new Date(userBadge.unlockedAt).toLocaleDateString()}` : detail}</Text>
        </View>
        <Text style={styles.muted}>{userBadge ? "Done" : "Locked"}</Text>
      </View>
    </Pressable>
  );
}

function Header({ title, subtitle, rightLabel, onRight }) {
  return (
    <View style={styles.header}>
      <View style={styles.flex}>
        <Text style={styles.h1}>{title}</Text>
        {!!subtitle && <Text style={styles.muted}>{subtitle}</Text>}
      </View>
      {!!rightLabel && <SmallButton label={rightLabel} onPress={onRight} />}
    </View>
  );
}

function Metric({ label, value, compact }) {
  return (
    <View style={[styles.metric, compact && styles.metricCompact]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Empty({ title, message, action, onPress }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.h2}>{title}</Text>
      <Text style={styles.muted}>{message}</Text>
      {!!action && <Pressable style={styles.primaryButton} onPress={onPress}><Text style={styles.primaryButtonText}>{action}</Text></Pressable>}
    </View>
  );
}

function ChoiceCard({ title, detail, selected, accent, onPress }) {
  return (
    <Pressable style={[styles.choice, selected && { backgroundColor: accent, borderColor: accent }]} onPress={onPress}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{title}</Text>
      <Text style={[styles.choiceDetail, selected && styles.choiceTextSelected]}>{detail}</Text>
    </Pressable>
  );
}

function SegmentButton({ label, active, onPress }) {
  return (
    <Pressable style={[styles.segmentButton, active && styles.segmentButtonActive]} onPress={onPress}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SmallButton({ label, onPress, active, danger }) {
  return (
    <Pressable style={[styles.smallButton, active && styles.smallButtonActive, danger && styles.smallButtonDanger]} onPress={onPress}>
      <Text style={[styles.smallButtonText, (active || danger) && styles.smallButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function buildHabit(draft, existing) {
  const normalizedCategory = categories.some((category) => category.key === draft.category) ? draft.category : "fitness";
  const normalizedUnit = units.some((unit) => unit.key === draft.unit) ? draft.unit : categoryFor(normalizedCategory).defaultUnit;
  return {
    id: existing?.id || makeId("habit"),
    title: draft.title.trim(),
    category: normalizedCategory,
    unit: normalizedUnit,
    targetValue: unitFor(normalizedUnit).needsValue ? Number(draft.targetValue || 1) : null,
    reminderEnabled: Boolean(draft.reminderEnabled),
    reminderHour: clamp(Number(draft.reminderHour || 21), 0, 23),
    reminderMinute: clamp(Number(draft.reminderMinute || 0), 0, 59),
    createdAt: existing?.createdAt || new Date().toISOString(),
    isArchived: existing?.isArchived || false
  };
}

function categoryFor(key) {
  return categories.find((category) => category.key === key) || categories[0];
}

function unitFor(key) {
  return units.find((unit) => unit.key === key) || units[0];
}

function targetDescription(habit) {
  const unit = unitFor(habit.unit);
  if (!unit.needsValue) return "Daily check-in";
  return `${habit.targetValue || 1} ${unit.short}`;
}

function defaultTarget(unit) {
  if (unit === "pages") return "20";
  if (unit === "minutes") return "10";
  return "1";
}

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function confirmAction(title, message, onConfirm) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: "Confirm", style: "destructive", onPress: onConfirm }
  ]);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F8FA" },
  shell: { flex: 1 },
  screen: { padding: 18, paddingBottom: 108, gap: 14 },
  authScreen: { padding: 20, paddingBottom: 60, gap: 16 },
  loading: { marginTop: 80, textAlign: "center", fontSize: 28, fontWeight: "800", color: "#111827" },
  onboarding: { padding: 20, paddingBottom: 60, gap: 18 },
  appName: { marginTop: 18, fontSize: 34, fontWeight: "900", color: "#111827" },
  slogan: { fontSize: 16, color: "#6B7280", lineHeight: 22 },
  notice: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#F59E0B", backgroundColor: "#FFFBEB" },
  noticeText: { color: "#92400E", fontWeight: "700", lineHeight: 20 },
  progressTrack: { height: 8, backgroundColor: "#E5E7EB", borderRadius: 999, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: "#147AFF" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 12 },
  h1: { fontSize: 30, lineHeight: 34, fontWeight: "900", color: "#111827" },
  h2: { fontSize: 22, fontWeight: "800", color: "#111827" },
  muted: { color: "#6B7280", lineHeight: 21 },
  errorText: { color: "#B91C1C", fontWeight: "800", lineHeight: 20 },
  sectionTitle: { marginTop: 12, marginBottom: 8, fontSize: 17, fontWeight: "800", color: "#111827" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  segment: { flexDirection: "row", padding: 4, borderRadius: 10, backgroundColor: "#E5E7EB", gap: 4 },
  segmentButton: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  segmentButtonActive: { backgroundColor: "#FFFFFF" },
  segmentText: { color: "#6B7280", fontWeight: "900" },
  segmentTextActive: { color: "#111827" },
  avatarPreview: { alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 8, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB", marginVertical: 12 },
  option: { width: "47.8%", minHeight: 58, justifyContent: "center", alignItems: "center", gap: 6, padding: 10, borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, backgroundColor: "#FFFFFF" },
  optionSelected: { backgroundColor: "#111827", borderColor: "#111827" },
  optionText: { textAlign: "center", fontWeight: "800", color: "#111827" },
  optionTextSelected: { color: "#FFFFFF" },
  swatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: "rgba(17,24,39,0.18)" },
  choice: { width: "47.8%", minHeight: 82, justifyContent: "center", padding: 12, borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, backgroundColor: "#FFFFFF" },
  choiceText: { textAlign: "center", fontWeight: "900", color: "#111827" },
  choiceDetail: { marginTop: 4, textAlign: "center", color: "#6B7280", fontSize: 12, fontWeight: "800" },
  choiceTextSelected: { color: "#FFFFFF" },
  input: { marginVertical: 8, borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "#FFFFFF", fontSize: 16 },
  timeInput: { width: 86, textAlign: "center" },
  heroPanel: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, marginBottom: 12, borderRadius: 8, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB" },
  heroTitle: { fontSize: 32, fontWeight: "900", color: "#111827" },
  card: { padding: 16, marginBottom: 12, borderRadius: 8, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB", gap: 10 },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  statRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  metric: { flex: 1, minWidth: 126, padding: 14, borderRadius: 8, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB" },
  metricCompact: { padding: 10, minWidth: 0 },
  metricLabel: { color: "#6B7280", fontSize: 12, fontWeight: "700" },
  metricValue: { marginTop: 5, fontSize: 24, fontWeight: "900", color: "#111827" },
  primaryButton: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 46, paddingHorizontal: 16, borderRadius: 8, backgroundColor: "#147AFF" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800" },
  completedButton: { backgroundColor: "#2FB344" },
  disabledButton: { opacity: 0.45 },
  secondaryButton: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 46, paddingHorizontal: 16, borderRadius: 8, backgroundColor: "#E5E7EB" },
  secondaryButtonText: { color: "#111827", fontWeight: "800" },
  smallButton: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#E5E7EB" },
  smallButtonActive: { backgroundColor: "#147AFF" },
  smallButtonDanger: { backgroundColor: "#DC2626" },
  smallButtonText: { color: "#111827", fontWeight: "800", fontSize: 13 },
  smallButtonTextActive: { color: "#FFFFFF" },
  dangerButton: { alignItems: "center", padding: 14, borderRadius: 8, backgroundColor: "#FEE2E2" },
  dangerButtonText: { color: "#B91C1C", fontWeight: "900" },
  linkButton: { alignItems: "center", padding: 12 },
  linkText: { color: "#147AFF", fontWeight: "900" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  flex: { flex: 1 },
  streak: { fontWeight: "900", color: "#D97706" },
  empty: { alignItems: "center", padding: 24, borderRadius: 8, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB", gap: 12 },
  tabBar: { position: "absolute", left: 12, right: 12, bottom: 12, flexDirection: "row", padding: 8, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12 },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 42, paddingVertical: 8, borderRadius: 12 },
  tabActive: { backgroundColor: "#EAF2FF" },
  tabLabel: { color: "#6B7280", fontSize: 11, fontWeight: "800" },
  tabLabelActive: { color: "#147AFF" },
  calendarRow: { flexDirection: "row", gap: 6, marginTop: 10 },
  dayDot: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6" },
  dayDone: { backgroundColor: "#2FB344" },
  dayText: { fontSize: 12, fontWeight: "800", color: "#111827" },
  badgeIcon: { width: 48, fontSize: 20, fontWeight: "900", textAlign: "center", color: "#111827" },
  badgeLevel: { marginTop: 4, color: "#147AFF", fontSize: 12, fontWeight: "800" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(17,24,39,0.45)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 420, padding: 18, borderRadius: 8, backgroundColor: "#FFFFFF", gap: 10 },
  shareCard: { minHeight: 450, borderRadius: 18, padding: 28, justifyContent: "space-between", alignItems: "center" },
  shareEyebrow: { color: "#FFFFFF", fontWeight: "800", fontSize: 18 },
  shareIcon: { color: "#FFFFFF", fontSize: 76, fontWeight: "900" },
  shareTitle: { color: "#FFFFFF", fontSize: 34, fontWeight: "900", textAlign: "center" },
  shareSubtitle: { color: "#FFFFFF", fontSize: 17, textAlign: "center", opacity: 0.9 },
  shareMeta: { color: "#FFFFFF", fontWeight: "800" },
  shareBrand: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  shareSlogan: { color: "#FFFFFF", opacity: 0.9 },
  assetText: { color: "#6B7280", textAlign: "center", fontSize: 12, fontWeight: "700" }
});
