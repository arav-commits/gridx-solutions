

export const getISTTime = (): Date => {

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


  const minutesToNext = 30 - (minutes % 30);
  
  
  return (minutesToNext * 60) - seconds;
};

export const isTimeExpired = (timeRange: string): boolean => {
  
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
