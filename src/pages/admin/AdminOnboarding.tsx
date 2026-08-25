import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Rocket, PartyPopper } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

const AdminOnboarding = () => {
  const { steps, doneCount, total, allDone } = useOnboardingStatus();
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Rocket className="h-6 w-6 text-primary" />
            Get your studio ready
          </h1>
          <p className="text-muted-foreground">
            A few quick steps to launch your studio and start taking bookings.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-3 py-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {doneCount} of {total} complete
              </span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <Progress value={pct} />
          </CardContent>
        </Card>

        {allDone && (
          <Card className="border-green-500/40 bg-green-500/5">
            <CardContent className="flex items-center gap-3 py-5">
              <PartyPopper className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-foreground">You're all set!</p>
                <p className="text-sm text-muted-foreground">
                  Your studio is ready. Share your booking page with customers.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {steps.map((step) => (
            <Card key={step.key} className={step.done ? "opacity-70" : ""}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-start gap-3 min-w-0">
                  {step.done ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`font-medium ${
                        step.done
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant={step.done ? "ghost" : "default"}
                  className="shrink-0"
                >
                  <Link to={step.path}>{step.done ? "Review" : step.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOnboarding;
