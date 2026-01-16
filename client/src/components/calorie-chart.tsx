import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { DailyEntry, CalculatedMetrics } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

export function CalorieChart() {
  const { data: entries, isLoading: entriesLoading } = useQuery<DailyEntry[]>({
    queryKey: ["/api/entries"],
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<CalculatedMetrics>({
    queryKey: ["/api/metrics"],
  });

  const isLoading = entriesLoading || metricsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calorie Intake</CardTitle>
          <CardDescription>Daily calorie consumption</CardDescription>
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
        .slice(-14)
    : [];

  const maintenanceCalories = metrics?.maintenanceCalories;

  const chartData = sortedEntries.map((entry) => ({
    date: format(parseISO(entry.date), "MMM d"),
    calories: entry.calories,
    fullDate: entry.date,
  }));

  const avgCalories = sortedEntries.length
    ? Math.round(sortedEntries.reduce((sum, e) => sum + e.calories, 0) / sortedEntries.length)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5" />
              Calorie Intake
            </CardTitle>
            <CardDescription>Last 14 days</CardDescription>
          </div>
          {avgCalories > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Avg: </span>
              <span className="font-medium">{avgCalories.toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[250px] text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Flame className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Log entries to see your calorie intake chart
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                width={50}
                tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value.toLocaleString()} cal`, "Calories"]}
              />
              {maintenanceCalories && (
                <ReferenceLine
                  y={maintenanceCalories}
                  stroke="hsl(var(--chart-5))"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: "Maintenance",
                    position: "right",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                  }}
                />
              )}
              <Bar
                dataKey="calories"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
