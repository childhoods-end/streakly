const dayKey = (dateLike) => {
  const date = new Date(dateLike);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const addDays = (date, offset) => {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
};

export function checkInsForHabit(habit, checkIns) {
  return checkIns
    .filter((checkIn) => checkIn.habitId === habit.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function completedDayKeys(habit, checkIns) {
  return new Set(checkInsForHabit(habit, checkIns).map((checkIn) => dayKey(checkIn.date)));
}

export function isCheckedInToday(habit, checkIns) {
  return completedDayKeys(habit, checkIns).has(dayKey(new Date()));
}

export function currentStreak(habit, checkIns) {
  const days = completedDayKeys(habit, checkIns);
  const today = new Date();
  const todayKey = dayKey(today);
  const yesterday = addDays(today, -1);
  const start = days.has(todayKey) ? today : yesterday;

  if (!days.has(dayKey(start))) return 0;

  let count = 0;
  let cursor = start;
  while (days.has(dayKey(cursor))) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function bestStreak(habit, checkIns) {
  const days = Array.from(completedDayKeys(habit, checkIns)).sort();
  if (days.length === 0) return 0;

  let best = 1;
  let current = 1;

  for (let index = 1; index < days.length; index += 1) {
    const previous = new Date(`${days[index - 1]}T12:00:00`);
    const expected = dayKey(addDays(previous, 1));
    if (expected === days[index]) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

export function completionRate(habit, checkIns, days) {
  if (!days) return 0;
  const completed = completedDayKeys(habit, checkIns);
  const today = new Date();
  let count = 0;

  for (let offset = 0; offset < days; offset += 1) {
    if (completed.has(dayKey(addDays(today, -offset)))) count += 1;
  }

  return count / days;
}

export function overallCompletionRate(habits, checkIns, days) {
  const active = habits.filter((habit) => !habit.isArchived);
  if (active.length === 0) return 0;
  return active.reduce((sum, habit) => sum + completionRate(habit, checkIns, days), 0) / active.length;
}

export function generateWeeklyInsight(habits, checkIns) {
  const active = habits.filter((habit) => !habit.isArchived);
  if (active.length === 0) return "Create one small habit to start building consistency this week.";

  const weeklyRate = overallCompletionRate(active, checkIns, 7);
  const messages = [];

  if (weeklyRate >= 0.8) messages.push("Great consistency this week.");
  else if (weeklyRate < 0.5) messages.push("Keep it simple next week. Try reducing your daily target.");
  else messages.push("You are building momentum. Keep the next check-in easy to start.");

  const streakHabit = active.find((habit) => currentStreak(habit, checkIns) >= 7);
  if (streakHabit) messages.push(`You built a 7-day streak on ${streakHabit.title}.`);
  if (active.length > 1 && weeklyRate < 0.5) messages.push("Focus on one habit first.");

  return messages.join(" ");
}

export { dayKey };
