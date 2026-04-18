/**
 * Utility to handle IST (India Standard Time) logic
 */

export const getISTTime = (): Date => {
  // Returns a Date object adjusted to IST
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
};

export const formatTimeIST = (date: Date): string => {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

export const getSecondsUntilNextInterval = (): number => {
  const now = getISTTime();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Next interval is either the top of the hour or the 30-minute mark
  const minutesToNext = 30 - (minutes % 30);
  
  // Convert minutes to seconds and subtract existing seconds
  return (minutesToNext * 60) - seconds;
};

export const isTimeExpired = (timeRange: string): boolean => {
  // Example: "6:00 - 6:30"
  try {
    const [startStr, endStr] = timeRange.split(" - ");
    const now = getISTTime();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [endHours, endMinutes] = endStr.split(":").map(Number);
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    return currentMinutes >= endTotalMinutes;
  } catch (e) {
    return false;
  }
};
