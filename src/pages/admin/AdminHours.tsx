import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Clock } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { businessHoursApi, BusinessHourDTO } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type BusinessHour = BusinessHourDTO;

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const AdminHours = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: hours, isLoading } = useQuery({
    queryKey: ["admin-hours"],
    queryFn: () => businessHoursApi.list(),
  });

  const updateMutation = useMutation({
    mutationFn: async (hour: BusinessHour) => {
      await businessHoursApi.update(hour.id, {
        open_time: hour.open_time,
        close_time: hour.close_time,
        is_closed: hour.is_closed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hours"] });
      toast({
        title: "Hours updated",
        description: "Business hours have been saved.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleToggleClosed = (hour: BusinessHour) => {
    updateMutation.mutate({
      ...hour,
      is_closed: !hour.is_closed,
    });
  };

  const handleTimeChange = (
    hour: BusinessHour,
    field: "open_time" | "close_time",
    value: string
  ) => {
    updateMutation.mutate({
      ...hour,
      [field]: value,
    });
  };

  const formatTime = (time: string | null) => {
    if (!time) return "";
    // Convert from HH:MM:SS to HH:MM for input
    return time.substring(0, 5);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Business Hours</h1>
          <p className="text-muted-foreground">Set your availability for appointments</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hours?.map((hour) => (
                  <div
                    key={hour.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg bg-muted/50"
                  >
                    <div className="w-28 font-medium">{dayNames[hour.day_of_week]}</div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!hour.is_closed}
                        onCheckedChange={() => handleToggleClosed(hour)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {hour.is_closed ? "Closed" : "Open"}
                      </span>
                    </div>
                    {!hour.is_closed && (
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`open-${hour.id}`} className="sr-only">
                            Open time
                          </Label>
                          <Input
                            id={`open-${hour.id}`}
                            type="time"
                            value={formatTime(hour.open_time)}
                            onChange={(e) =>
                              handleTimeChange(hour, "open_time", e.target.value)
                            }
                            className="w-32"
                          />
                        </div>
                        <span className="text-muted-foreground">to</span>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`close-${hour.id}`} className="sr-only">
                            Close time
                          </Label>
                          <Input
                            id={`close-${hour.id}`}
                            type="time"
                            value={formatTime(hour.close_time)}
                            onChange={(e) =>
                              handleTimeChange(hour, "close_time", e.target.value)
                            }
                            className="w-32"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminHours;
