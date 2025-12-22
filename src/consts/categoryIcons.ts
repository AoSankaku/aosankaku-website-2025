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
  return categoryIcons[cat] || "mdi:tag-outline";
};

export default categoryIcons;