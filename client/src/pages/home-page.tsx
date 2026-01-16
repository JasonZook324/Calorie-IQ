import { useQuery } from "@tanstack/react-query";
import { Activity, Flame, Scale, Target, TrendingDown, Calculator, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { CalculatedMetrics, DailyEntry } from "@shared/schema";
import { StatsCard } from "@/components/stats-card";
import { DailyEntryForm } from "@/components/daily-entry-form";
import { EntriesList } from "@/components/entries-list";
import { WeightChart } from "@/components/weight-chart";
import { CalorieChart } from "@/components/calorie-chart";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  const { data: metrics, isLoading: metricsLoading } = useQuery<CalculatedMetrics>({
    queryKey: ["/api/metrics"],
  });

  const { data: entries, isLoading: entriesLoading } = useQuery<DailyEntry[]>({
    queryKey: ["/api/entries"],
  });

  const isLoading = metricsLoading || entriesLoading;

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "—";
    return Math.round(value).toLocaleString();
  };

  const latestWeight = entries && entries.length > 0
    ? [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.weight
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">CalorieIQ</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Welcome, {user?.username}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              {logoutMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title="Maintenance Calories"
                value={formatNumber(metrics?.maintenanceCalories)}
                subtitle="Estimated daily burn"
                icon={Calculator}
                testId="card-maintenance"
              />
              <StatsCard
                title="Daily Deficit"
                value={
                  metrics?.dailyDeficit !== null && metrics?.dailyDeficit !== undefined
                    ? `${metrics.dailyDeficit > 0 ? "+" : ""}${formatNumber(metrics.dailyDeficit)}`
                    : "—"
                }
                subtitle={
                  metrics?.dailyDeficit !== null && metrics?.dailyDeficit !== undefined
                    ? metrics.dailyDeficit > 0
                      ? "Surplus (gaining)"
                      : metrics.dailyDeficit < 0
                      ? "Deficit (losing)"
                      : "Maintaining"
                    : "Need more data"
                }
                icon={Target}
                testId="card-deficit"
              />
              <StatsCard
                title="7-Day Avg Calories"
                value={formatNumber(metrics?.rollingAvgCalories7Day)}
                subtitle="Weekly average"
                icon={Flame}
                testId="card-avg-calories"
              />
              <StatsCard
                title="Current Weight"
                value={latestWeight ? `${latestWeight} lbs` : "—"}
                subtitle={
                  metrics?.weightChange7Day !== null && metrics?.weightChange7Day !== undefined
                    ? `${metrics.weightChange7Day > 0 ? "+" : ""}${metrics.weightChange7Day.toFixed(1)} lbs this week`
                    : "Latest weigh-in"
                }
                icon={Scale}
                testId="card-weight"
              />
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <WeightChart />
              <CalorieChart />
            </div>

            <EntriesList />
          </div>

          <div className="space-y-6">
            <DailyEntryForm />

            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-primary" />
                  Weekly Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">7-Day Avg Deficit</span>
                    <span className="font-medium">
                      {metrics?.rollingAvgDeficit7Day !== null && metrics?.rollingAvgDeficit7Day !== undefined
                        ? `${metrics.rollingAvgDeficit7Day > 0 ? "+" : ""}${formatNumber(metrics.rollingAvgDeficit7Day)} cal`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">14-Day Avg Calories</span>
                    <span className="font-medium">{formatNumber(metrics?.rollingAvgCalories14Day)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">7-Day Avg Weight</span>
                    <span className="font-medium">
                      {metrics?.rollingAvgWeight7Day
                        ? `${metrics.rollingAvgWeight7Day.toFixed(1)} lbs`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Weekly Change</span>
                    <span
                      className={`font-medium ${
                        metrics?.weeklyDeficit !== null && metrics?.weeklyDeficit !== undefined
                          ? metrics.weeklyDeficit < 0
                            ? "text-chart-1"
                            : metrics.weeklyDeficit > 0
                            ? "text-chart-5"
                            : ""
                          : ""
                      }`}
                    >
                      {metrics?.weeklyDeficit !== null && metrics?.weeklyDeficit !== undefined
                        ? `${metrics.weeklyDeficit > 0 ? "+" : ""}${formatNumber(metrics.weeklyDeficit)} cal`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
