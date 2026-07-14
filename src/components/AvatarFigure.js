import React from "react";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Line, Path, Rect, Stop } from "react-native-svg";
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

export function AvatarFigure({ recipe, theme = "fitness", size = 220 }) {
  const normalized = normalizeAvatarRecipe(recipe);
  const body = avatarPartByKey(bodyTypes, normalized.bodyType);
  const skin = avatarPartByKey(skinTones, normalized.skinTone);
  const hair = avatarPartByKey(hairColors, normalized.hairColor);
  const hairStyle = avatarPartByKey(hairStyles, normalized.hairStyle);
  const accessory = avatarPartByKey(accessories, normalized.accessory);
  const outfit = themeOutfits[theme] || themeOutfits.fitness;

  const torsoWidth = body.width;
  const torsoLeft = 100 - torsoWidth / 2;
  const torsoPath = torsoShape(body.torso, torsoLeft, torsoWidth);
  const armInset = body.torso === "flow" ? 5 : 0;

  return (
    <Svg width={size} height={size} viewBox="0 0 200 240">
      <Defs>
        <LinearGradient id="avatarOutfit" x1="55" y1="112" x2="146" y2="196" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={outfit.primary} />
          <Stop offset="1" stopColor={outfit.secondary} stopOpacity="0.78" />
        </LinearGradient>
        <LinearGradient id="avatarSkin" x1="72" y1="52" x2="129" y2="120" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={skin.color} stopOpacity="1" />
          <Stop offset="1" stopColor={skin.color} stopOpacity="0.82" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="100" cy="225" rx="48" ry="10" fill="rgba(3,7,18,0.28)" />
      <Circle cx="100" cy="126" r="76" fill="rgba(87,166,255,0.10)" />
      <Circle cx="148" cy="56" r="5" fill={outfit.secondary} opacity="0.34" />
      <Circle cx="51" cy="92" r="4" fill={outfit.primary} opacity="0.28" />

      {outfit.prop === "mat" && <Rect x="38" y="211" width="124" height="10" rx="5" fill={outfit.secondary} opacity="0.28" />}
      {outfit.prop === "book" && <Path d="M40 187 C52 180 66 177 82 180 L82 214 C66 209 52 211 40 220 Z M84 180 C100 177 114 180 126 187 L126 220 C114 211 100 209 84 214 Z" fill={outfit.secondary} opacity="0.58" />}
      {outfit.prop === "notes" && <Rect x="126" y="168" width="36" height="46" rx="8" fill="#F6F8FF" opacity="0.95" />}
      {outfit.prop === "lotus" && <Path d="M72 213 C82 196 94 200 100 217 C106 200 118 196 128 213 C114 222 86 222 72 213 Z" fill={outfit.secondary} opacity="0.68" />}

      <G>
        <Line x1={78 - armInset} y1={132} x2={55} y2={180} stroke={skin.color} strokeWidth="15" strokeLinecap="round" />
        <Line x1={122 + armInset} y1={132} x2={145} y2={180} stroke={skin.color} strokeWidth="15" strokeLinecap="round" />
        <Path d={torsoPath} fill="url(#avatarOutfit)" />
        <Path d={`M${torsoLeft + 13} 122 L${torsoLeft + torsoWidth - 13} 122 L${torsoLeft + torsoWidth - 24} 157 L${torsoLeft + 24} 157 Z`} fill="#FFFFFF" opacity="0.16" />
        <Path d={`M${torsoLeft + 10} 118 C83 132 117 132 ${torsoLeft + torsoWidth - 10} 118`} stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.22" fill="none" />
        <Line x1={88} y1={186} x2={80} y2={219} stroke="#25344F" strokeWidth="15" strokeLinecap="round" />
        <Line x1={112} y1={186} x2={120} y2={219} stroke="#25344F" strokeWidth="15" strokeLinecap="round" />
        <Line x1={74} y1={224} x2={93} y2={224} stroke="#0B1120" strokeWidth="8" strokeLinecap="round" />
        <Line x1={107} y1={224} x2={126} y2={224} stroke="#0B1120" strokeWidth="8" strokeLinecap="round" />
      </G>

      <G>
        {hairStyle.key === "long" && <Path d="M61 82 C58 45 80 25 106 29 C133 33 143 58 138 101 C132 130 75 130 64 103 C62 96 61 88 61 82 Z" fill={hair.color} />}
        {hairStyle.key === "bob" && <Path d="M63 79 C62 50 82 33 106 34 C130 35 142 57 135 99 C119 113 80 113 65 99 C64 92 63 85 63 79 Z" fill={hair.color} />}
        {hairStyle.key === "curly" && (
          <G fill={hair.color}>
            {Array.from({ length: 12 }).map((_, index) => (
              <Circle key={index} cx={59 + index * 8} cy={58 + (index % 3) * 8} r="13" />
            ))}
            <Circle cx="72" cy="86" r="15" />
            <Circle cx="130" cy="86" r="15" />
          </G>
        )}
        {hairStyle.key === "short" && <Path d="M65 73 C69 43 92 31 116 40 C130 45 137 57 138 74 C117 61 91 61 65 73 Z" fill={hair.color} />}
        <Circle cx="100" cy="80" r="37" fill="url(#avatarSkin)" />
        <Path d="M66 73 C74 43 96 34 119 45 C130 50 136 60 137 74 C115 63 91 63 66 73 Z" fill={hair.color} opacity={hairStyle.key === "long" ? 0.92 : 1} />
        <Circle cx="87" cy="84" r="3.4" fill="#07101F" />
        <Circle cx="113" cy="84" r="3.4" fill="#07101F" />
        <Path d="M90 101 C97 107 105 107 112 101" stroke="#743523" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <Circle cx="76" cy="91" r="5" fill="#F4A78D" opacity="0.25" />
        <Circle cx="124" cy="91" r="5" fill="#F4A78D" opacity="0.25" />
        {accessory.key === "round_glasses" && (
          <G stroke="#07101F" strokeWidth="2.6" fill="none">
            <Circle cx="87" cy="84" r="10" />
            <Circle cx="113" cy="84" r="10" />
            <Line x1="97" y1="84" x2="103" y2="84" />
          </G>
        )}
        {accessory.key === "visor" && <Path d="M60 67 C84 55 116 55 141 67 L134 78 C113 70 88 70 67 78 Z" fill="#F6F8FF" />}
        {accessory.key === "earrings" && (
          <G fill="#FFD58A">
            <Circle cx="62" cy="91" r="4.5" />
            <Circle cx="138" cy="91" r="4.5" />
          </G>
        )}
      </G>
    </Svg>
  );
}

function torsoShape(kind, left, width) {
  const right = left + width;
  if (kind === "athletic") return `M${left + 11} 116 L${right - 11} 116 C${right - 2} 133 ${right} 157 ${right - 2} 184 C${right - 18} 192 ${left + 18} 192 ${left + 2} 184 C${left} 157 ${left + 2} 133 ${left + 11} 116 Z`;
  if (kind === "tailored") return `M${left + 14} 116 L${right - 14} 116 C${right - 6} 136 ${right - 4} 164 ${right - 7} 187 L${left + 7} 187 C${left + 4} 164 ${left + 6} 136 ${left + 14} 116 Z`;
  if (kind === "flow") return `M${left + 10} 116 L${right - 10} 116 C${right + 10} 145 ${right + 4} 176 ${right - 5} 193 L${left + 5} 193 C${left - 4} 176 ${left - 10} 145 ${left + 10} 116 Z`;
  return `M${left + 12} 116 L${right - 12} 116 C${right + 3} 142 ${right + 5} 168 ${right - 2} 190 L${left + 2} 190 C${left - 5} 168 ${left - 3} 142 ${left + 12} 116 Z`;
}
