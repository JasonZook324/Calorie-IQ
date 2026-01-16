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

  // Get the most recent entry date as reference point
  const mostRecentDate = sortedEntries.length > 0 
    ? new Date(sortedEntries[sortedEntries.length - 1].date)
    : new Date();
  
  // Filter entries by actual calendar days (not just last N entries)
  const sevenDaysAgo = new Date(mostRecentDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const fourteenDaysAgo = new Date(mostRecentDate);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const last7Days = sortedEntries.filter(e => new Date(e.date) >= sevenDaysAgo);
  const last14Days = sortedEntries.filter(e => new Date(e.date) >= fourteenDaysAgo);

  // Calorie averages use all entries within the date range
  const rollingAvgCalories7Day = last7Days.length > 0
    ? last7Days.reduce((sum, e) => sum + e.calories, 0) / last7Days.length
    : null;

  const rollingAvgCalories14Day = last14Days.length > 0
    ? last14Days.reduce((sum, e) => sum + e.calories, 0) / last14Days.length
    : null;

  // Weight-based calculations only use entries WITH weight values within the last 7 days
  const last7DaysWithWeight = last7Days.filter(e => e.weight !== null && e.weight !== undefined);

  // Require at least 2 weight entries for weight-based calculations
  let rollingAvgWeight7Day: number | null = null;
  let weightChange7Day: number | null = null;
  let dailyDeficit: number | null = null;
  let maintenanceCalories: number | null = null;

  if (last7DaysWithWeight.length >= 2) {
    // Calculate rolling average weight
    rollingAvgWeight7Day = last7DaysWithWeight.reduce((sum, e) => sum + (e.weight as number), 0) / last7DaysWithWeight.length;

    // Calculate weight change between first and last weight entry
    const firstWeight = last7DaysWithWeight[0].weight as number;
    const lastWeight = last7DaysWithWeight[last7DaysWithWeight.length - 1].weight as number;
    weightChange7Day = lastWeight - firstWeight;

    // Calculate days between first and last weight entry (use ceiling to avoid inflated per-day values)
    const firstDate = new Date(last7DaysWithWeight[0].date);
    const lastDate = new Date(last7DaysWithWeight[last7DaysWithWeight.length - 1].date);
    const daysInRange = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate daily deficit using the formula from spec:
    // Daily Deficit = (weight change × 3500) / days
    // Negative value = deficit (weight loss), Positive value = surplus (weight gain)
    dailyDeficit = (weightChange7Day * CALORIES_PER_POUND) / daysInRange;

    // Calculate maintenance calories using the formula from spec:
    // Maintenance = Avg Calories - Daily Deficit
    // For weight loss: deficit is negative, so maintenance = avg - (-deficit) = avg + |deficit|
    // For weight gain: deficit is positive (surplus), so maintenance = avg - surplus
    if (rollingAvgCalories7Day !== null) {
      const calculatedMaintenance = rollingAvgCalories7Day - dailyDeficit;
      // Only set maintenance if it's a realistic positive value (min 800 cal/day)
      // Very low values indicate unrealistic data (e.g., large weight changes over short periods)
      if (calculatedMaintenance >= 800) {
        maintenanceCalories = calculatedMaintenance;
      }
    }
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
