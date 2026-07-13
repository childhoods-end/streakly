export const badgeDefinitions = [
  { code: "streak_3", title: "First Spark", subtitle: "Complete a 3-day streak.", category: "streak", type: "streak", threshold: 3, level: "bronze", icon: "*" },
  { code: "streak_7", title: "One Week Strong", subtitle: "Complete a 7-day streak.", category: "streak", type: "streak", threshold: 7, level: "bronze", icon: "7" },
  { code: "streak_14", title: "Rising Momentum", subtitle: "Complete a 14-day streak.", category: "streak", type: "streak", threshold: 14, level: "silver", icon: "14" },
  { code: "streak_30", title: "Monthly Master", subtitle: "Complete a 30-day streak.", category: "streak", type: "streak", threshold: 30, level: "gold", icon: "30" },
  { code: "streak_100", title: "Centurion", subtitle: "Complete a 100-day streak.", category: "streak", type: "streak", threshold: 100, level: "platinum", icon: "100" },
  { code: "total_10", title: "Getting Started", subtitle: "Complete 10 total check-ins.", category: "total", type: "total", threshold: 10, level: "bronze", icon: "+" },
  { code: "total_30", title: "Habit Explorer", subtitle: "Complete 30 total check-ins.", category: "total", type: "total", threshold: 30, level: "silver", icon: "++" },
  { code: "total_100", title: "Habit Builder", subtitle: "Complete 100 total check-ins.", category: "total", type: "total", threshold: 100, level: "gold", icon: "+++" },
  { code: "reading_500_pages", title: "Book Wanderer", subtitle: "Read 500 total pages.", category: "reading", type: "category", threshold: 500, level: "silver", icon: "RD" },
  { code: "fitness_600_minutes", title: "Motion Maker", subtitle: "Log 600 fitness minutes.", category: "fitness", type: "category", threshold: 600, level: "silver", icon: "FT" },
  { code: "study_3000_minutes", title: "Deep Learner", subtitle: "Log 3000 study minutes.", category: "study", type: "category", threshold: 3000, level: "gold", icon: "ST" },
  { code: "meditation_14_days", title: "Still Mind", subtitle: "Complete 14 meditation check-in days.", category: "meditation", type: "category", threshold: 14, level: "silver", icon: "MD" },
  { code: "meditation_7_streak", title: "Clear Center", subtitle: "Build a 7-day meditation streak.", category: "meditation", type: "category_streak", threshold: 7, level: "bronze", icon: "ZEN" },
  { code: "first_checkin", title: "First Step", subtitle: "Complete your first check-in.", category: "special", type: "special", threshold: 1, level: "bronze", icon: "1" },
  { code: "three_habits_one_day", title: "Triple Win", subtitle: "Complete 3 habits in one day.", category: "special", type: "special", threshold: 3, level: "silver", icon: "3" }
];

export const levelColors = {
  bronze: ["#A96532", "#D39058"],
  silver: ["#758195", "#B8C0CC"],
  gold: ["#D99919", "#F5C85A"],
  platinum: ["#41AFC4", "#A7E3EF"],
  diamond: ["#6072F0", "#A9B5FF"]
};
