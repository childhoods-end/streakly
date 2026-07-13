import { badgeDefinitions } from "../data/badges";
import { bestStreak, completedDayKeys, currentStreak, dayKey } from "./streak";

function uniqueCheckIns(checkIns) {
  return new Set(checkIns.map((checkIn) => `${checkIn.habitId}-${dayKey(checkIn.date)}`));
}

function categoryProgress(definition, habits, checkIns) {
  const categoryHabits = habits.filter((habit) => habit.category === definition.category);

  if (definition.type === "category_streak") {
    return Math.max(0, ...categoryHabits.map((habit) => currentStreak(habit, checkIns)));
  }

  if (definition.code === "meditation_14_days") {
    return categoryHabits.reduce((sum, habit) => sum + completedDayKeys(habit, checkIns).size, 0);
  }

  return categoryHabits.reduce((sum, habit) => {
    const total = checkIns
      .filter((checkIn) => checkIn.habitId === habit.id)
      .reduce((partial, checkIn) => partial + Number(checkIn.value ?? habit.targetValue ?? 1), 0);
    return sum + total;
  }, 0);
}

function specialProgress(definition, habits, checkIns) {
  if (definition.code === "first_checkin") return checkIns.length > 0 ? 1 : 0;

  if (definition.code === "three_habits_one_day") {
    const byDay = {};
    checkIns.forEach((checkIn) => {
      const key = dayKey(checkIn.date);
      byDay[key] = byDay[key] || new Set();
      byDay[key].add(checkIn.habitId);
    });
    return Math.max(0, ...Object.values(byDay).map((set) => set.size));
  }

  return 0;
}

export function badgeProgress(definition, habits, checkIns) {
  if (definition.type === "streak") {
    return Math.max(0, ...habits.map((habit) => currentStreak(habit, checkIns)));
  }
  if (definition.type === "total") return uniqueCheckIns(checkIns).size;
  if (definition.type === "category") return categoryProgress(definition, habits, checkIns);
  if (definition.type === "special") return specialProgress(definition, habits, checkIns);
  return 0;
}

export function progressText(definition, habits, checkIns) {
  const remaining = Math.max(0, Math.ceil(definition.threshold - badgeProgress(definition, habits, checkIns)));
  if (definition.code.includes("pages")) return `${remaining} pages left`;
  if (definition.code.includes("minutes")) return `${remaining} minutes left`;
  if (definition.type === "streak" || definition.type === "category_streak") return `${remaining} days away`;
  return `${remaining} check-ins left`;
}

export function evaluateBadges(habit, habits, checkIns, userBadges) {
  const existing = new Set(userBadges.map((badge) => badge.badgeCode));

  return badgeDefinitions.filter((definition) => {
    if (existing.has(definition.code)) return false;
    if (definition.type === "streak") return currentStreak(habit, checkIns) >= definition.threshold;
    return badgeProgress(definition, habits, checkIns) >= definition.threshold;
  });
}

export function userBadgeFor(definition, userBadges) {
  return userBadges.find((badge) => badge.badgeCode === definition.code);
}

export { bestStreak };
