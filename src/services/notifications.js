import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export async function requestNotificationPermission() {
  if (Platform.OS === "web") return "web-fallback";
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return "granted";
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted ? "granted" : "denied";
}

export async function scheduleDailyReminder(habit) {
  if (Platform.OS === "web" || !habit.reminderEnabled) return null;
  await cancelReminder(habit);
  const permission = await requestNotificationPermission();
  if (permission !== "granted") return null;

  return Notifications.scheduleNotificationAsync({
    identifier: habit.id,
    content: {
      title: `Time to check in: ${habit.title}`,
      body: "Keep your streak alive today."
    },
    trigger: {
      hour: habit.reminderHour,
      minute: habit.reminderMinute,
      repeats: true
    }
  });
}

export async function cancelReminder(habit) {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(habit.id).catch(() => {});
}
