import React from "react";
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";
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

  return (
    <Svg width={size} height={size} viewBox="0 0 200 240">
      <Ellipse cx="100" cy="225" rx="54" ry="10" fill="rgba(17,24,39,0.14)" />
      {outfit.prop === "mat" && <Rect x="42" y="212" width="116" height="10" rx="5" fill={outfit.secondary} opacity="0.32" />}
      {outfit.prop === "book" && <Path d="M44 188 L80 178 L80 210 L44 220 Z M82 178 L118 188 L118 220 L82 210 Z" fill={outfit.secondary} opacity="0.52" />}
      {outfit.prop === "notes" && <Rect x="124" y="172" width="34" height="44" rx="5" fill="#F8FAFC" opacity="0.95" />}
      {outfit.prop === "lotus" && <Path d="M75 213 C82 198 94 200 100 216 C106 200 118 198 125 213 C112 220 88 220 75 213 Z" fill={outfit.secondary} opacity="0.62" />}

      <G>
        <Line x1={78} y1={130} x2={58} y2={178} stroke={skin.color} strokeWidth="13" strokeLinecap="round" />
        <Line x1={122} y1={130} x2={142} y2={178} stroke={skin.color} strokeWidth="13" strokeLinecap="round" />
        <Path d={torsoPath} fill={outfit.primary} />
        <Path d={`M${torsoLeft + 10} 122 L${torsoLeft + torsoWidth - 10} 122 L${torsoLeft + torsoWidth - 20} 154 L${torsoLeft + 20} 154 Z`} fill={outfit.secondary} opacity="0.2" />
        <Line x1={88} y1={184} x2={82} y2={218} stroke="#273449" strokeWidth="14" strokeLinecap="round" />
        <Line x1={112} y1={184} x2={118} y2={218} stroke="#273449" strokeWidth="14" strokeLinecap="round" />
        <Line x1={76} y1={224} x2={92} y2={224} stroke="#111827" strokeWidth="7" strokeLinecap="round" />
        <Line x1={108} y1={224} x2={124} y2={224} stroke="#111827" strokeWidth="7" strokeLinecap="round" />
      </G>

      <G>
        {hairStyle.key === "long" && <Path d="M65 74 C65 42 86 27 106 32 C130 38 139 61 132 98 C127 126 75 126 68 99 C66 91 65 82 65 74 Z" fill={hair.color} />}
        {hairStyle.key === "bob" && <Path d="M66 76 C65 48 84 34 104 35 C128 36 139 58 131 98 C116 109 82 109 68 98 C67 91 66 83 66 76 Z" fill={hair.color} />}
        {hairStyle.key === "curly" && (
          <G fill={hair.color}>
            {Array.from({ length: 11 }).map((_, index) => (
              <Circle key={index} cx={62 + index * 8} cy={58 + (index % 3) * 8} r="13" />
            ))}
          </G>
        )}
        {hairStyle.key === "short" && <Path d="M68 70 C71 42 92 32 113 39 C126 43 134 55 134 73 C116 62 92 61 68 70 Z" fill={hair.color} />}
        <Circle cx="100" cy="78" r="36" fill={skin.color} />
        <Path d="M67 72 C73 42 95 34 118 44 C128 48 135 58 136 72 C116 61 92 61 67 72 Z" fill={hair.color} opacity={hairStyle.key === "long" ? 0.9 : 1} />
        <Circle cx="88" cy="82" r="3.2" fill="#111827" />
        <Circle cx="112" cy="82" r="3.2" fill="#111827" />
        <Path d="M91 99 C97 104 105 104 111 99" stroke="#7F3B2D" strokeWidth="3" strokeLinecap="round" fill="none" />
        {accessory.key === "round_glasses" && (
          <G stroke="#111827" strokeWidth="2.6" fill="none">
            <Circle cx="88" cy="82" r="10" />
            <Circle cx="112" cy="82" r="10" />
            <Line x1="98" y1="82" x2="102" y2="82" />
          </G>
        )}
        {accessory.key === "visor" && <Path d="M62 66 C86 54 115 54 139 66 L132 76 C112 68 88 68 68 76 Z" fill="#F8FAFC" />}
        {accessory.key === "earrings" && (
          <G fill="#FACC15">
            <Circle cx="63" cy="88" r="4" />
            <Circle cx="137" cy="88" r="4" />
          </G>
        )}
      </G>
    </Svg>
  );
}

function torsoShape(kind, left, width) {
  const right = left + width;
  if (kind === "athletic") return `M${left + 10} 116 L${right - 10} 116 L${right} 184 L${left} 184 Z`;
  if (kind === "tailored") return `M${left + 14} 116 L${right - 14} 116 L${right - 4} 184 L${left + 4} 184 Z`;
  if (kind === "flow") return `M${left + 10} 116 L${right - 10} 116 C${right + 8} 146 ${right + 2} 174 ${right - 3} 190 L${left + 3} 190 C${left - 2} 174 ${left - 8} 146 ${left + 10} 116 Z`;
  return `M${left + 12} 116 L${right - 12} 116 C${right} 142 ${right + 4} 166 ${right - 2} 188 L${left + 2} 188 C${left - 4} 166 ${left} 142 ${left + 12} 116 Z`;
}
