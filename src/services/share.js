import { Platform, Share } from "react-native";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";

export function shareText(definition) {
  return `Achievement Unlocked: ${definition.title}\n${definition.subtitle}\nDaily Reset\nBuild your streak, one day at a time.`;
}

export async function shareBadge(definition, cardRef) {
  if (Platform.OS === "web") {
    if (navigator.share) {
      await navigator.share({ title: definition.title, text: shareText(definition) });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText(definition));
      alert("Badge text copied to clipboard.");
    }
    return true;
  }

  const { captureRef } = await import("react-native-view-shot");
  const uri = await captureRef(cardRef, { format: "png", quality: 1 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  } else {
    await Share.share({ message: shareText(definition), url: uri });
  }
  return true;
}

export async function saveBadge(definition, cardRef) {
  if (Platform.OS === "web") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="1080" height="1350" rx="48" fill="#147AFF"/><text x="540" y="220" text-anchor="middle" font-size="54" fill="white">Achievement Unlocked</text><text x="540" y="520" text-anchor="middle" font-size="150">${definition.icon}</text><text x="540" y="720" text-anchor="middle" font-size="72" font-weight="700" fill="white">${definition.title}</text><text x="540" y="820" text-anchor="middle" font-size="38" fill="white">${definition.subtitle}</text><text x="540" y="1180" text-anchor="middle" font-size="44" font-weight="700" fill="white">Daily Reset</text><text x="540" y="1240" text-anchor="middle" font-size="30" fill="white">Build your streak, one day at a time.</text></svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${definition.code}-daily-reset.svg`;
    link.click();
    URL.revokeObjectURL(url);
    return true;
  }

  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) return false;
  const { captureRef } = await import("react-native-view-shot");
  const uri = await captureRef(cardRef, { format: "png", quality: 1 });
  await MediaLibrary.saveToLibraryAsync(uri);
  return true;
}

export function posterShareText(poster) {
  return `Daily Reset check-in\n${poster.habitTitle}\n${poster.streakDays} day streak\n${poster.themeLabel} poster`;
}

export async function sharePoster(poster, cardRef) {
  if (Platform.OS === "web") {
    if (navigator.share) {
      await navigator.share({ title: "Daily Reset poster", text: posterShareText(poster) });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(posterShareText(poster));
      alert("Poster text copied to clipboard.");
    }
    return true;
  }

  const { captureRef } = await import("react-native-view-shot");
  const uri = await captureRef(cardRef, { format: "png", quality: 1 });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
  else await Share.share({ message: posterShareText(poster), url: uri });
  return true;
}

export async function savePoster(_poster, cardRef) {
  if (Platform.OS === "web") {
    const { captureRef } = await import("react-native-view-shot");
    const uri = await captureRef(cardRef, { format: "png", quality: 1 });
    const link = document.createElement("a");
    link.href = uri;
    link.download = "daily-reset-poster.png";
    link.click();
    return true;
  }

  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) return false;
  const { captureRef } = await import("react-native-view-shot");
  const uri = await captureRef(cardRef, { format: "png", quality: 1 });
  await MediaLibrary.saveToLibraryAsync(uri);
  return true;
}
