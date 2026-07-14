import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { categories } from "../data/categories";
import { posterTier } from "../services/posterService";
import { AvatarFigure } from "./AvatarFigure";

export function CheckInPoster({ poster, avatarRecipe, cardRef }) {
  if (!poster) return null;
  const category = categories.find((item) => item.key === poster.theme) || categories[0];
  const tier = posterTier(poster.streakDays);
  const density = tierDensity(tier);

  return (
    <View ref={cardRef} collapsable={false} style={[styles.poster, { backgroundColor: backgroundFor(category.key) }]}>
      <View style={styles.patternLayer}>
        {Array.from({ length: density * 5 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.spark,
              {
                left: `${(index * 23) % 92}%`,
                top: `${10 + ((index * 31) % 72)}%`,
                opacity: 0.08 + density * 0.025,
                transform: [{ rotate: `${index * 21}deg` }]
              }
            ]}
          />
        ))}
      </View>

      <View style={styles.posterHeader}>
        <Text style={styles.brand}>Daily Reset</Text>
        <Text style={styles.tier}>{tier}</Text>
      </View>

      <View style={styles.avatarStage}>
        <AvatarFigure recipe={avatarRecipe} theme={poster.theme} size={260} />
      </View>

      <View style={styles.copy}>
        <Text style={styles.theme}>{category.label}</Text>
        <Text style={styles.title}>{poster.habitTitle}</Text>
        <Text style={styles.streak}>{poster.streakDays} day streak</Text>
        <Text style={styles.meta}>Built one day at a time</Text>
      </View>
    </View>
  );
}

function tierDensity(tier) {
  if (tier === "Mastery") return 5;
  if (tier === "Ritual") return 4;
  if (tier === "Glow") return 3;
  if (tier === "Momentum") return 2;
  return 1;
}

function backgroundFor(theme) {
  if (theme === "fitness") return "#231321";
  if (theme === "reading") return "#0B1B33";
  if (theme === "study") return "#17152F";
  return "#0F261C";
}

const styles = StyleSheet.create({
  poster: {
    width: "100%",
    maxWidth: 432,
    aspectRatio: 0.8,
    alignSelf: "center",
    overflow: "hidden",
    borderRadius: 24,
    padding: 26,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)"
  },
  patternLayer: { ...StyleSheet.absoluteFillObject },
  spark: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FFFFFF"
  },
  posterHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  tier: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.14)",
    color: "#FFFFFF",
    fontWeight: "900"
  },
  avatarStage: { alignItems: "center", justifyContent: "center", flex: 1 },
  copy: { gap: 6 },
  theme: { color: "rgba(255,255,255,0.72)", fontWeight: "900", textTransform: "uppercase", letterSpacing: 0, fontSize: 12 },
  title: { color: "#FFFFFF", fontSize: 36, lineHeight: 40, fontWeight: "900" },
  streak: { color: "#FFFFFF", fontSize: 21, fontWeight: "900" },
  meta: { color: "rgba(255,255,255,0.72)", fontSize: 15, fontWeight: "700" }
});
