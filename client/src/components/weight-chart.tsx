import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { DailyEntry } from "@shared/schema";
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
} from "recharts";

export function WeightChart() {
  const { data: entries, isLoading } = useQuery<DailyEntry[]>({
    queryKey: ["/api/entries"],
  });

  if (isLoading) {
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
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30)
    : [];

  const chartData = sortedEntries.map((entry) => ({
    date: format(parseISO(entry.date), "MMM d"),
    weight: entry.weight,
    fullDate: entry.date,
  }));

  const weights = sortedEntries.map((e) => e.weight);
  const minWeight = weights.length ? Math.floor(Math.min(...weights) - 2) : 150;
  const maxWeight = weights.length ? Math.ceil(Math.max(...weights) + 2) : 200;

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
            <CardDescription>Last 30 days</CardDescription>
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
      </CardHeader>
      <CardContent>
        {chartData.length < 2 ? (
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
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value} lbs`, "Weight"]}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 0, r: 3 }}
                activeDot={{ fill: "hsl(var(--chart-1))", strokeWidth: 0, r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
