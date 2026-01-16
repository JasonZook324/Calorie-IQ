import { useQuery } from "@tanstack/react-query";
import { format, parseISO, addDays } from "date-fns";
import { DailyEntry, CalculatedMetrics } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, Scale } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  TooltipProps,
} from "recharts";

interface ChartDataPoint {
  date: string;
  weight: number | null;
  projectedWeight: number | null;
  fullDate: string;
  isProjected: boolean;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload as ChartDataPoint;
  const weight = data?.weight ?? data?.projectedWeight;
  
  if (!weight) return null;

  return (
    <div
      style={{
        backgroundColor: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "6px",
        padding: "8px 12px",
        fontSize: "12px",
      }}
    >
      <p style={{ color: "hsl(var(--foreground))", marginBottom: "4px" }}>{label}</p>
      <p style={{ 
        color: data?.isProjected ? "hsl(var(--chart-4))" : "hsl(var(--chart-1))",
        fontWeight: 500 
      }}>
        {weight.toFixed(1)} lbs
      </p>
      <p style={{ 
        color: "hsl(var(--muted-foreground))", 
        fontSize: "11px",
        marginTop: "2px" 
      }}>
        {data?.isProjected ? "Projected based on trend" : "Actual weight"}
      </p>
    </div>
  );
}

export function WeightChart() {
  const { data: entries, isLoading: entriesLoading } = useQuery<DailyEntry[]>({
    queryKey: ["/api/entries"],
  });

  const { data: metrics } = useQuery<CalculatedMetrics>({
    queryKey: ["/api/metrics"],
  });

  if (entriesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weight Trend</CardTitle>
          <CardDescription>Your weight over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const sortedEntries = entries
    ? [...entries]
        .filter(e => e.weight !== null && e.weight !== undefined)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30)
    : [];

  const actualData: ChartDataPoint[] = sortedEntries.map((entry) => ({
    date: format(parseISO(entry.date), "MMM d"),
    weight: entry.weight,
    projectedWeight: null,
    fullDate: entry.date,
    isProjected: false,
  }));

  const projectedData: ChartDataPoint[] = [];
  
  if (sortedEntries.length >= 2 && metrics?.dailyDeficit !== null && metrics?.dailyDeficit !== undefined) {
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    const lastWeight = lastEntry.weight as number;
    const lastDate = parseISO(lastEntry.date);
    
    const dailyWeightChange = metrics.dailyDeficit / 3500;
    
    for (let i = 1; i <= 14; i++) {
      const projectedDate = addDays(lastDate, i);
      const projectedWeight = lastWeight + (dailyWeightChange * i);
      
      projectedData.push({
        date: format(projectedDate, "MMM d"),
        weight: null,
        projectedWeight: Math.round(projectedWeight * 10) / 10,
        fullDate: format(projectedDate, "yyyy-MM-dd"),
        isProjected: true,
      });
    }
  }

  const bridgePoint: ChartDataPoint | null = sortedEntries.length >= 2 && metrics?.dailyDeficit !== null ? {
    date: actualData[actualData.length - 1].date,
    weight: null,
    projectedWeight: actualData[actualData.length - 1].weight,
    fullDate: actualData[actualData.length - 1].fullDate,
    isProjected: false,
  } : null;

  const chartData: ChartDataPoint[] = [
    ...actualData,
    ...(bridgePoint ? [bridgePoint] : []),
    ...projectedData,
  ].filter((item, index, arr) => {
    if (index === 0) return true;
    return item.fullDate !== arr[index - 1].fullDate || item.isProjected !== arr[index - 1].isProjected;
  });

  const allWeights = [
    ...sortedEntries.map((e) => e.weight as number),
    ...projectedData.map((p) => p.projectedWeight as number),
  ].filter(Boolean);
  
  const minWeight = allWeights.length ? Math.floor(Math.min(...allWeights) - 2) : 150;
  const maxWeight = allWeights.length ? Math.ceil(Math.max(...allWeights) + 2) : 200;

  const firstWeight = sortedEntries[0]?.weight;
  const lastWeight = sortedEntries[sortedEntries.length - 1]?.weight;
  const weightChange = firstWeight && lastWeight ? lastWeight - firstWeight : 0;
  const isLosing = weightChange < 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Weight Trend
            </CardTitle>
            <CardDescription>Last 30 days + 2-week projection</CardDescription>
          </div>
          {sortedEntries.length >= 2 && (
            <div className={`flex items-center gap-1 text-sm font-medium ${isLosing ? "text-chart-1" : "text-chart-5"}`}>
              {isLosing ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              {Math.abs(weightChange).toFixed(1)} lbs
            </div>
          )}
        </div>
        {sortedEntries.length >= 2 && projectedData.length > 0 && (
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-chart-1" />
              <span>Actual weight</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-chart-4" />
              <span>Projected (based on trend)</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {actualData.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-[250px] text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Scale className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Log at least 2 entries to see your weight trend
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                domain={[minWeight, maxWeight]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 0, r: 3 }}
                activeDot={{ fill: "hsl(var(--chart-1))", strokeWidth: 0, r: 5 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="projectedWeight"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "hsl(var(--chart-4))", strokeWidth: 0, r: 3 }}
                activeDot={{ fill: "hsl(var(--chart-4))", strokeWidth: 0, r: 5 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
