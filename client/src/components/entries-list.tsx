import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Trash2, Loader2, Scale, Flame, Beef, Wheat, Droplet } from "lucide-react";
import { DailyEntry } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function EntriesList() {
  const { toast } = useToast();
  
  const { data: entries, isLoading } = useQuery<DailyEntry[]>({
    queryKey: ["/api/entries"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Entry deleted",
        description: "The entry has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
          <CardDescription>Your logged data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedEntries = entries
    ? [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Recent Entries</CardTitle>
        <CardDescription>
          {sortedEntries.length} {sortedEntries.length === 1 ? "entry" : "entries"} logged
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Flame className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No entries yet</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Start logging your daily calories and weight to see your progress
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {sortedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg border bg-card hover-elevate"
                  data-testid={`entry-${entry.id}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-medium">
                        {format(parseISO(entry.date), "EEEE, MMM d")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(entry.date), "yyyy")}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground"
                          data-testid={`button-delete-entry-${entry.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this entry? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(entry.id)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Flame className="h-3 w-3" />
                      {entry.calories.toLocaleString()} cal
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Scale className="h-3 w-3" />
                      {entry.weight} lbs
                    </Badge>
                    {entry.protein && (
                      <Badge variant="outline" className="gap-1">
                        <Beef className="h-3 w-3" />
                        {entry.protein}g P
                      </Badge>
                    )}
                    {entry.carbs && (
                      <Badge variant="outline" className="gap-1">
                        <Wheat className="h-3 w-3" />
                        {entry.carbs}g C
                      </Badge>
                    )}
                    {entry.fat && (
                      <Badge variant="outline" className="gap-1">
                        <Droplet className="h-3 w-3" />
                        {entry.fat}g F
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
