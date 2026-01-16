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

  // Weight-based calculations only use entries WITH weight values within the last 7 days (for 7-day weight change)
  const last7DaysWithWeight = last7Days.filter(e => e.weight !== null && e.weight !== undefined);
  
  // All-time weight entries for maintenance/deficit calculations (use ALL data for accuracy)
  const allEntriesWithWeight = sortedEntries.filter(e => e.weight !== null && e.weight !== undefined);

  // Require at least 2 weight entries for weight-based calculations
  let rollingAvgWeight7Day: number | null = null;
  let weightChange7Day: number | null = null;
  let dailyDeficit: number | null = null;
  let maintenanceCalories: number | null = null;

  // Calculate 7-day weight change for the "this week" display
  if (last7DaysWithWeight.length >= 2) {
    rollingAvgWeight7Day = last7DaysWithWeight.reduce((sum, e) => sum + (e.weight as number), 0) / last7DaysWithWeight.length;
    const firstWeight7Day = last7DaysWithWeight[0].weight as number;
    const lastWeight7Day = last7DaysWithWeight[last7DaysWithWeight.length - 1].weight as number;
    weightChange7Day = lastWeight7Day - firstWeight7Day;
  }

  // Calculate maintenance and deficit using ALL available data for better accuracy
  if (allEntriesWithWeight.length >= 2) {
    const firstWeight = allEntriesWithWeight[0].weight as number;
    const lastWeight = allEntriesWithWeight[allEntriesWithWeight.length - 1].weight as number;
    const totalWeightChange = lastWeight - firstWeight;

    const firstDate = new Date(allEntriesWithWeight[0].date);
    const lastDate = new Date(allEntriesWithWeight[allEntriesWithWeight.length - 1].date);
    const totalDays = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Daily Deficit = (weight change × 3500) / days
    // Uses all historical data for more accurate long-term estimate
    dailyDeficit = (totalWeightChange * CALORIES_PER_POUND) / totalDays;

    // Calculate average calories over the entire tracking period
    const entriesInRange = sortedEntries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= firstDate && entryDate <= lastDate;
    });
    const avgCaloriesAllTime = entriesInRange.length > 0
      ? entriesInRange.reduce((sum, e) => sum + e.calories, 0) / entriesInRange.length
      : null;

    // Maintenance = Avg Calories - Daily Deficit
    if (avgCaloriesAllTime !== null) {
      const calculatedMaintenance = avgCaloriesAllTime - dailyDeficit;
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
