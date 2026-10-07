import { Link } from "react-router-dom";
import { CheckCircle, MessageCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

export const BookingSuccess = ({
  studioName,
  whatsappConfirmLink,
  onBookAnother,
}: {
  studioName: string;
  whatsappConfirmLink: string | null;
  onBookAnother: () => void;
}) => (
  <Layout>
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
            Booking Request Received!
          </h1>
          <p className="text-muted-foreground mb-6">
            Thank you for booking with {studioName}. Your request is
            <span className="font-medium text-foreground"> pending confirmation</span> —
            we'll confirm shortly. Send us a quick WhatsApp so we can keep you updated.
          </p>
          <div className="flex flex-col gap-3">
            {whatsappConfirmLink && (
              <Button asChild className="bg-[#25D366] hover:bg-[#1da851] text-white">
                <a href={whatsappConfirmLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Confirm on WhatsApp
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={onBookAnother}>
              Book Another Appointment
            </Button>
          </div>
        </div>
      </div>
    </section>
  </Layout>
);

// Anyone can browse & fill the booking form; admins can't book.
export const AdminCannotBook = () => (
  <Layout>
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-3">
            Admins can't book appointments
          </h1>
          <p className="text-muted-foreground mb-6">
            Appointment booking is for customer accounts only. Log in with a
            customer account to make a booking.
          </p>
          <Button asChild>
            <Link to="/admin">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </section>
  </Layout>
);
