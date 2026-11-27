import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export interface Section {
  heading: string;
  body: string[];
}

/** Lines starting with "- " become one bullet list; the rest stay paragraphs. */
const groupBody = (body: string[]): (string | string[])[] => {
  const out: (string | string[])[] = [];
  for (const line of body) {
    if (line.startsWith("- ")) {
      const last = out[out.length - 1];
      if (Array.isArray(last)) last.push(line.slice(2));
      else out.push([line.slice(2)]);
    } else out.push(line);
  }
  return out;
};

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
          <BrandLogo />
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
            {groupBody(s.body).map((g, i) =>
              Array.isArray(g) ? (
                <ul key={i} className="mb-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {g.map((li, j) => (
                    <li key={j}>{li}</li>
                  ))}
                </ul>
              ) : (
                <p key={i} className="mb-2 text-sm leading-relaxed text-muted-foreground">
                  {g}
                </p>
              ),
            )}
          </section>
        ))}
      </div>

    </main>
  </div>
);
