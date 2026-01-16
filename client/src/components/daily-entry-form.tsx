import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState } from "react";

const formSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  calories: z.union([z.string(), z.number()]).transform((v) => {
    const num = typeof v === 'string' ? parseInt(v, 10) : v;
    return isNaN(num) ? 0 : num;
  }).refine((v) => v > 0, "Calories is required"),
  weight: z.union([z.string(), z.number()]).transform((v) => {
    const num = typeof v === 'string' ? parseFloat(v) : v;
    return isNaN(num) ? 0 : num;
  }).refine((v) => v > 0, "Weight is required"),
  protein: z.union([z.string(), z.number(), z.null()]).optional().transform((v) => {
    if (v === null || v === undefined || v === '') return null;
    const num = typeof v === 'string' ? parseInt(v, 10) : v;
    return isNaN(num) ? null : num;
  }),
  carbs: z.union([z.string(), z.number(), z.null()]).optional().transform((v) => {
    if (v === null || v === undefined || v === '') return null;
    const num = typeof v === 'string' ? parseInt(v, 10) : v;
    return isNaN(num) ? null : num;
  }),
  fat: z.union([z.string(), z.number(), z.null()]).optional().transform((v) => {
    if (v === null || v === undefined || v === '') return null;
    const num = typeof v === 'string' ? parseInt(v, 10) : v;
    return isNaN(num) ? null : num;
  }),
});

type FormValues = {
  date: Date;
  calories: string | number;
  weight: string | number;
  protein?: string | number | null;
  carbs?: string | number | null;
  fat?: string | number | null;
};

interface DailyEntryFormProps {
  onSuccess?: () => void;
}

export function DailyEntryForm({ onSuccess }: DailyEntryFormProps) {
  const { toast } = useToast();
  const [showMacros, setShowMacros] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      calories: "",
      weight: "",
      protein: "",
      carbs: "",
      fat: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.output<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/entries", {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      form.reset({
        date: new Date(),
        calories: "",
        weight: "",
        protein: "",
        carbs: "",
        fat: "",
      });
      toast({
        title: "Entry saved",
        description: "Your daily entry has been recorded.",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    const parsed = formSchema.parse(data);
    mutation.mutate(parsed);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Log Today
        </CardTitle>
        <CardDescription>Record your daily calories and weight</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="button-date-picker"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calories</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 2000"
                        data-testid="input-calories"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (lbs)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 180.5"
                        data-testid="input-weight"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Collapsible open={showMacros} onOpenChange={setShowMacros}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground"
                  data-testid="button-toggle-macros"
                >
                  {showMacros ? "Hide macros" : "Add macros (optional)"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="protein"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protein (g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="150"
                            data-testid="input-protein"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="carbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carbs (g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="200"
                            data-testid="input-carbs"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fat (g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="70"
                            data-testid="input-fat"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
              data-testid="button-submit-entry"
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Entry
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
