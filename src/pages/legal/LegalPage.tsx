import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";
import { PLATFORM } from "@/config/platform";

export interface Section {
  heading: string;
  body: string[];
}

export const LegalPage = ({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: ReactNode;
  sections: Section[];
}) => (
  <div className="min-h-screen bg-background">
    <header className="border-b border-border">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-serif text-xl font-semibold">{PLATFORM.name}</span>
        </Link>
        <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
      </div>
    </header>

    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated: {updated}</p>
      <div className="mt-6 text-muted-foreground">{intro}</div>

      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="mb-2 text-lg font-semibold text-foreground">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mb-2 text-sm leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      <p className="mt-12 rounded-lg border border-border bg-secondary p-4 text-xs text-muted-foreground">
        This is a general template provided for convenience and is not legal
        advice. Please have it reviewed by a qualified lawyer before relying on it.
      </p>
    </main>
  </div>
);
