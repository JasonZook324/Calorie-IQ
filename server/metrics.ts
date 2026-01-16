import { DailyEntry, CalculatedMetrics } from "@shared/schema";

const CALORIES_PER_POUND = 3500;

export function calculateMetrics(entries: DailyEntry[]): CalculatedMetrics {
  if (entries.length === 0) {
    return {
      maintenanceCalories: null,
      dailyDeficit: null,
      weeklyDeficit: null,
      rollingAvgCalories7Day: null,
      rollingAvgCalories14Day: null,
      rollingAvgDeficit7Day: null,
      rollingAvgWeight7Day: null,
      weightChange7Day: null,
    };
  }

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const last7Days = sortedEntries.slice(-7);
  const last14Days = sortedEntries.slice(-14);

  const rollingAvgCalories7Day = last7Days.length > 0
    ? last7Days.reduce((sum, e) => sum + e.calories, 0) / last7Days.length
    : null;

  const rollingAvgCalories14Day = last14Days.length > 0
    ? last14Days.reduce((sum, e) => sum + e.calories, 0) / last14Days.length
    : null;

  const rollingAvgWeight7Day = last7Days.length > 0
    ? last7Days.reduce((sum, e) => sum + e.weight, 0) / last7Days.length
    : null;

  let weightChange7Day: number | null = null;
  let dailyDeficit: number | null = null;
  let maintenanceCalories: number | null = null;

  if (last7Days.length >= 2) {
    const firstWeight = last7Days[0].weight;
    const lastWeight = last7Days[last7Days.length - 1].weight;
    weightChange7Day = lastWeight - firstWeight;

    const totalCalorieChange = weightChange7Day * CALORIES_PER_POUND;
    
    const daysInRange = last7Days.length - 1;
    if (daysInRange > 0) {
      dailyDeficit = totalCalorieChange / daysInRange;
    }
  }

  if (rollingAvgCalories7Day !== null && dailyDeficit !== null) {
    maintenanceCalories = rollingAvgCalories7Day - dailyDeficit;
  }

  const weeklyDeficit = dailyDeficit !== null ? dailyDeficit * 7 : null;
  const rollingAvgDeficit7Day = dailyDeficit;

  return {
    maintenanceCalories: maintenanceCalories !== null ? Math.round(maintenanceCalories) : null,
    dailyDeficit: dailyDeficit !== null ? Math.round(dailyDeficit) : null,
    weeklyDeficit: weeklyDeficit !== null ? Math.round(weeklyDeficit) : null,
    rollingAvgCalories7Day: rollingAvgCalories7Day !== null ? Math.round(rollingAvgCalories7Day) : null,
    rollingAvgCalories14Day: rollingAvgCalories14Day !== null ? Math.round(rollingAvgCalories14Day) : null,
    rollingAvgDeficit7Day: rollingAvgDeficit7Day !== null ? Math.round(rollingAvgDeficit7Day) : null,
    rollingAvgWeight7Day,
    weightChange7Day,
  };
}
