import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Gift, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LoyaltyPointsDTO, LoyaltyTransactionDTO, ReferralCodeDTO } from "@/lib/api";

interface RewardsTabProps {
  loyaltyEnabled: boolean;
  referralsEnabled: boolean;
  loyaltyCapPercent: number;
  loyalty: LoyaltyPointsDTO | undefined;
  referralCode: ReferralCodeDTO | undefined;
  history: LoyaltyTransactionDTO[];
  onCopyReferralLink: () => void;
}

export const RewardsTab = ({
  loyaltyEnabled,
  referralsEnabled,
  loyaltyCapPercent,
  loyalty,
  referralCode,
  history,
  onCopyReferralLink,
}: RewardsTabProps) => (
  <>
    {loyaltyEnabled && (
      <>
        {/* Points Info */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Your Points Balance</h3>
                <div className="text-4xl font-bold text-primary tabular-nums">
                  {loyalty?.points || 0} pts
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Earn 1 point per GHS 10 spent • use points for up to {loyaltyCapPercent}% off
                  any booking
                </p>
              </div>
              <Gift className="h-16 w-16 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        {/* How points work */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              How your points work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Earn</span> 1 point for every GHS
              10 you spend, added when your appointment is completed.
            </p>
            <p>
              <span className="font-medium text-foreground">Redeem</span> at checkout — when
              you book, flip on “Use my loyalty points” to take up to{" "}
              <span className="font-medium text-foreground">{loyaltyCapPercent}% off</span>{" "}
              that service (10 points = GHS 1).
            </p>
            <p>
              <span className="font-medium text-foreground">Refer</span> a friend and earn a
              100-point bonus (GHS 10) once they complete their first visit.
            </p>
            <Button asChild className="mt-2">
              <Link to="/book">Book &amp; use points</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    )}

    {/* Referral Card */}
    {referralsEnabled && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Refer a Friend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Share your referral code and earn 100 bonus points (GHS 10 off) when your friend
            completes their first appointment!
          </p>
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <span className="text-lg font-mono font-bold text-primary flex-1">
              {referralCode?.code || "Loading..."}
            </span>
            <Button onClick={onCopyReferralLink}>Copy Link</Button>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Recent Transactions */}
    {loyaltyEnabled && history.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>Points History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{tx.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(tx.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <span
                  className={`font-bold tabular-nums ${tx.points > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {tx.points > 0 ? "+" : ""}
                  {tx.points} pts
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}
  </>
);
