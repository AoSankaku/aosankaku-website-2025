// @/consts/categoryIcons.ts
const categoryIcons: Record<string, string> = {
  "Tech": "mdi:code",
  "Minecraft": "mdi:minecraft",
  "Works": "mdi:creation-outline",
  "YouTube": "mdi:youtube",
  "Misc": "mdi:scatter-plot",
  "Uncategorized": "mdi:warning",
};

export const getIcon = (cat: string) => {
  if (!cat) return "mdi:tag-outline";

  // Normalize the input
  const normalizedInput = cat.trim().toLowerCase();

  // Find the key in the object that matches the lowercase version
  const matchingKey = Object.keys(categoryIcons).find(
    (key) => key.toLowerCase() === normalizedInput
  );

  // Return the icon if found, otherwise the fallback
  return matchingKey ? categoryIcons[matchingKey] : "mdi:tag-outline";
};

export default categoryIcons;