const formatToJSTDate = (date: string) => {
  const now = new Date(date);
  if (isNaN(now.getTime())) {
    console.error("[ERROR] Invalid date passed, received", date)
    return "2100/01/01";
  }
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
};

export default formatToJSTDate