import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  appointmentId?: string;
  type: "confirmation" | "reminder";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { appointmentId, type }: ReminderRequest = await req.json();

    let appointments;

    if (appointmentId) {
      // Send for specific appointment
      const { data, error } = await supabase
        .from("appointments")
        .select("*, services(name, duration)")
        .eq("id", appointmentId)
        .single();

      if (error) throw error;
      appointments = [data];
    } else if (type === "reminder") {
      // Find appointments for tomorrow that haven't been reminded
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("appointments")
        .select("*, services(name, duration)")
        .eq("appointment_date", tomorrowStr)
        .eq("status", "confirmed");

      if (error) throw error;
      appointments = data || [];
    } else {
      throw new Error("Invalid request");
    }

    const results = [];

    for (const appointment of appointments) {
      if (!appointment.email) continue;

      const serviceName = appointment.services?.name || "your appointment";
      const date = new Date(appointment.appointment_date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let subject: string;
      let html: string;

      if (type === "confirmation") {
        subject = "Appointment Confirmed - El's Beauty Studio";
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #d946ef;">Your Appointment is Confirmed!</h1>
            <p>Hi ${appointment.full_name},</p>
            <p>Your appointment has been confirmed. Here are the details:</p>
            <div style="background: #fdf4ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Service:</strong> ${serviceName}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time:</strong> ${appointment.appointment_time}</p>
            </div>
            <p>If you need to reschedule, please contact us as soon as possible.</p>
            <p>See you soon!</p>
            <p style="color: #888;">- El's Beauty Studio</p>
          </div>
        `;
      } else {
        subject = "Reminder: Your Appointment Tomorrow - El's Beauty Studio";
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #d946ef;">Appointment Reminder</h1>
            <p>Hi ${appointment.full_name},</p>
            <p>This is a friendly reminder about your appointment tomorrow:</p>
            <div style="background: #fdf4ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Service:</strong> ${serviceName}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time:</strong> ${appointment.appointment_time}</p>
            </div>
            <p>We look forward to seeing you!</p>
            <p style="color: #888;">- El's Beauty Studio</p>
          </div>
        `;
      }

      try {
        const emailResponse = await resend.emails.send({
          from: "El's Beauty Studio <onboarding@resend.dev>",
          to: [appointment.email],
          subject,
          html,
        });

        results.push({ appointmentId: appointment.id, success: true, response: emailResponse });
      } catch (emailError: any) {
        results.push({ appointmentId: appointment.id, success: false, error: emailError.message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
