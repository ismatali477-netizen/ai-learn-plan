import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BookOpen, Calendar, ListChecks, BarChart3, Clock, RotateCcw, Bell, Timer,
  FileDown, Trophy, ArrowRight, Check, Menu, X, ChevronDown, Github, Twitter, Linkedin,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Study Planner — A calm workspace for studying" },
      { name: "description", content: "Plan your subjects, track exams, and study with a tutor that knows your syllabus. A practical study workspace for students." },
      { property: "og:title", content: "AI Study Planner — A calm workspace for studying" },
      { property: "og:description", content: "Plan your subjects, track exams, and study with a tutor that knows your syllabus." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "AI Study Planner",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }),
    }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main id="top">
        <Hero />
        <Planner />
        <Features />
        <HowItWorks />
        <Tutor />
        <Voices />
        <Pricing />
        <FAQ />
        <Closing />
      </main>
      <Footer />
    </div>
  );
}

/* ---------------- NAV ---------------- */

const NAV_LINKS: [string, string][] = [
  ["The planner", "#demo"],
  ["What's inside", "#features"],
  ["How it works", "#how"],
  ["Tutor", "#ai"],
  ["Pricing", "#pricing"],
];

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <a href="#top" className="flex items-baseline gap-2">
          <span className="font-display text-lg font-600">Study Planner</span>
        </a>
        <nav className="hidden flex-1 items-center gap-6 md:flex">
          {NAV_LINKS.map(([label, href]) => (
            <a key={href} href={href} className="text-sm text-muted-foreground hover:text-foreground">{label}</a>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-4 md:flex">
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Log in</Link>
          <PrimaryLink to="/auth">Create an account</PrimaryLink>
        </div>
        <button
          className="ml-auto md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto grid max-w-6xl gap-1 px-4 py-3">
            {NAV_LINKS.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)} className="py-2 text-sm">{label}</a>
            ))}
            <Link to="/auth" onClick={() => setOpen(false)} className="py-2 text-sm">Log in</Link>
            <div className="pt-2"><PrimaryLink to="/auth">Create an account</PrimaryLink></div>
          </nav>
        </div>
      )}
    </header>
  );
}

function PrimaryLink({ to, children }: { to: "/auth"; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      {children}
    </Link>
  );
}

/* ---------------- HERO ---------------- */

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-7">
          <p className="label-caps">For students who study every day</p>
          <h1 className="mt-4 font-display text-4xl font-500 md:text-5xl">
            Know what to study next — <em className="text-primary">before</em> you open a book.
          </h1>
          <p className="mt-5 max-w-xl text-[1.0625rem] text-muted-foreground">
            Put in your subjects, your exam dates and the hours you actually have. You get a
            realistic weekly plan, a daily checklist, and honest numbers on what you finished.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <PrimaryLink to="/auth">Start planning <ArrowRight className="size-4" /></PrimaryLink>
            <a href="#demo" className="text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">
              See what a week looks like
            </a>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-6 text-sm">
            {[
              ["Free plan", "3 subjects, no card"],
              ["Built for", "SEE, NEB, TU courses"],
              ["Works offline-ish", "Plans stay readable"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-medium">{k}</dt>
                <dd className="text-muted-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <aside className="md:col-span-5">
          <div className="border border-border bg-card">
            <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Tuesday</h2>
              <span className="text-xs text-muted-foreground">2h 20m planned</span>
            </div>
            <ol className="divide-y divide-border text-sm">
              {[
                ["Calculus — limits & continuity", "45m", true],
                ["Physics — rotational motion", "30m", true],
                ["English — reading comprehension", "25m", false],
                ["Revision — organic chemistry", "40m", false],
              ].map(([task, dur, done]) => (
                <li key={task as string} className="flex items-center gap-3 px-4 py-3">
                  <span className={`grid size-4 shrink-0 place-items-center border ${done ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                    {done ? <Check className="size-3" /> : null}
                  </span>
                  <span className={done ? "flex-1 text-muted-foreground line-through" : "flex-1"}>{task}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{dur}</span>
                </li>
              ))}
            </ol>
            <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              Chemistry quiz in 4 days — revision was moved earlier in the week.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ---------------- PLANNER PREVIEW ---------------- */

function Planner() {
  const week = [
    ["Mon", 120, "Calculus, Physics"],
    ["Tue", 140, "Calculus, English"],
    ["Wed", 90, "Chemistry revision"],
    ["Thu", 150, "Physics, Chemistry"],
    ["Fri", 60, "Light review"],
    ["Sat", 180, "Mock paper"],
    ["Sun", 45, "Notes tidy-up"],
  ] as const;
  const max = 180;

  return (
    <section id="demo" className="border-b border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHead
          eyebrow="The planner"
          title="A week you can actually follow"
          sub="Hours are spread around your real availability, with heavier subjects placed where you tend to focus best."
        />
        <div className="mt-10 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <table className="w-full text-sm">
              <caption className="sr-only">Example weekly study distribution</caption>
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="label-caps py-2">Day</th>
                  <th scope="col" className="label-caps py-2">Planned</th>
                  <th scope="col" className="label-caps py-2">Focus</th>
                </tr>
              </thead>
              <tbody>
                {week.map(([day, mins, focus]) => (
                  <tr key={day} className="border-b border-border/70">
                    <th scope="row" className="py-3 pr-4 text-left font-medium">{day}</th>
                    <td className="py-3 pr-4 align-middle">
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums text-muted-foreground">{Math.floor(mins / 60)}h {mins % 60}m</span>
                        <span className="hidden h-1 w-28 bg-border sm:block">
                          <span className="block h-1 bg-primary" style={{ width: `${(mins / max) * 100}%` }} />
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground">{focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-6 md:col-span-5">
            {[
              [Bell, "Reminders", "Nudges for exams inside seven days and tasks you skipped."],
              [Trophy, "Progress", "Streaks and levels that reflect finished work, not clicks."],
              [Timer, "Focus timer", "Pomodoro sessions logged against the subject you chose."],
              [FileDown, "Reports", "Weekly and monthly summaries you can print or export."],
            ].map(([Icon, title, desc]: any) => (
              <div key={title} className="flex gap-3 border-b border-border pb-5 last:border-0">
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="label-caps">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-500">{title}</h2>
      {sub && <p className="mt-3 text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ---------------- FEATURES ---------------- */

function Features() {
  const groups: [string, [string, string][]][] = [
    ["Planning", [
      ["Subjects & syllabus", "Chapters, difficulty and credit hours in one list."],
      ["Exam dates", "Countdowns that reorder your week as a date gets close."],
      ["Daily tasks", "One short list per day, ordered by what matters most."],
      ["Revision", "Spaced repetition slots added between new material."],
    ]],
    ["Studying", [
      ["Tutor", "Ask about a topic, a problem, or your own uploaded notes."],
      ["Documents", "Upload PDFs and get summaries, key points and questions."],
      ["Quizzes & notes", "Practice questions and revision sheets from your material."],
      ["Focus sessions", "Timer with a running log of where your hours went."],
    ]],
    ["Reviewing", [
      ["Analytics", "Time per subject, completion rate, consistency over weeks."],
      ["Achievements", "Milestones for habits that took real effort."],
      ["Reports", "Printable summaries for yourself, a teacher or a parent."],
      ["Settings", "Study hours, daily goal, language and theme."],
    ]],
  ];

  return (
    <section id="features" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHead eyebrow="What's inside" title="Everything a study week needs, nothing it doesn't" />
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {groups.map(([group, items]) => (
            <div key={group}>
              <h3 className="border-b border-border pb-2 text-sm font-semibold">{group}</h3>
              <dl className="mt-4 space-y-4">
                {items.map(([t, d]) => (
                  <div key={t}>
                    <dt className="text-sm font-medium">{t}</dt>
                    <dd className="text-sm text-muted-foreground">{d}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- HOW IT WORKS ---------------- */

function HowItWorks() {
  const steps: [string, string, any][] = [
    ["Add your subjects", "Name them, mark the hard ones, note the chapters you still have left.", BookOpen],
    ["Add exam dates", "The plan is built backwards from the dates that matter.", Calendar],
    ["Set your hours", "Say when you actually study — mornings, evenings, weekends.", Clock],
    ["Get the plan", "A balanced week with revision and breaks already placed.", ListChecks],
    ["Tick things off", "Mark tasks done, run the timer, keep the streak honest.", RotateCcw],
    ["Check the numbers", "See what slipped and let the next week adjust.", BarChart3],
  ];
  return (
    <section id="how" className="border-b border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHead eyebrow="How it works" title="Six small steps, about a minute" />
        <ol className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map(([t, d, Icon], i) => (
            <li key={t} className="flex gap-4 border-t border-border pt-4">
              <span className="font-display text-2xl text-muted-foreground tabular-nums">{i + 1}</span>
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="size-4 text-muted-foreground" /> {t}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- TUTOR ---------------- */

function Tutor() {
  return (
    <section id="ai" className="border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <SectionHead
            eyebrow="Tutor"
            title="A tutor that answers, then teaches"
            sub="Ask a question in English or Nepali. Upload a chapter and ask about it. Answers stay short, worked through step by step, and pitched at your course level."
          />
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>— Explanations with a worked example</li>
            <li>— Practice questions from your own notes</li>
            <li>— Revision guidance before an exam</li>
          </ul>
        </div>
        <div className="md:col-span-7">
          <div className="border border-border bg-card">
            <p className="border-b border-border px-4 py-3 text-xs text-muted-foreground">Conversation · DBMS</p>
            <div className="space-y-4 p-4 text-sm">
              <p className="ml-auto max-w-sm border border-border bg-muted/60 px-3 py-2">
                Why do we need 3NF if 2NF already removes partial dependency?
              </p>
              <div className="max-w-lg space-y-2">
                <p>2NF only deals with parts of a composite key. 3NF handles the other leak: a non-key column depending on another non-key column.</p>
                <p className="text-muted-foreground">Example: in <span className="font-medium text-foreground">Student(roll, dept, dept_head)</span>, <span className="font-medium text-foreground">dept_head</span> depends on <span className="font-medium text-foreground">dept</span>, not on <span className="font-medium text-foreground">roll</span>. Change a head and you'd have to edit every row.</p>
                <p>Split it into two tables and the update happens once.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- VOICES ---------------- */

function Voices() {
  const quotes: [string, string, string][] = [
    ["I stopped rewriting my timetable every Sunday night. It just adjusts when I fall behind.", "Sujata R.", "NEB Grade 12, Science"],
    ["Uploading the handout and asking questions about it saved me hours before the DBMS exam.", "Nabin K.", "BSc CSIT, Semester 4"],
    ["The weekly report is the only honest picture I have of how much I actually studied.", "Aayush T.", "BBS, Second year"],
  ];
  return (
    <section className="border-b border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHead eyebrow="From students" title="How people use it" />
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {quotes.map(([q, name, meta]) => (
            <figure key={name} className="border-l-2 border-border pl-4">
              <blockquote className="font-display text-lg leading-snug">“{q}”</blockquote>
              <figcaption className="mt-3 text-sm">
                <span className="font-medium">{name}</span>
                <span className="text-muted-foreground"> · {meta}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- PRICING ---------------- */

function Pricing() {
  const tiers: { name: string; price: string; note: string; features: string[]; primary?: boolean }[] = [
    { name: "Free", price: "Rs 0", note: "Everything you need to start", features: ["Up to 3 subjects", "Weekly plan & daily tasks", "Exam tracking", "Basic analytics"] },
    { name: "Pro", price: "Rs 499", note: "per month", features: ["Unlimited subjects", "Tutor with document uploads", "Quiz & notes generation", "Full analytics and reports"], primary: true },
    { name: "Lifetime", price: "Rs 6,999", note: "one payment", features: ["Everything in Pro", "All future features", "Priority support", "No renewals"] },
  ];
  return (
    <section id="pricing" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHead eyebrow="Pricing" title="Straightforward, student-sized" sub="Start free. Upgrade only if the tutor and documents become part of your routine." />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div key={t.name} className={`flex flex-col border p-6 ${t.primary ? "border-primary bg-card" : "border-border"}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold">{t.name}</h3>
                {t.primary && <span className="label-caps text-primary">Most used</span>}
              </div>
              <p className="mt-4 font-display text-3xl">{t.price}</p>
              <p className="text-sm text-muted-foreground">{t.note}</p>
              <ul className="mt-5 flex-1 space-y-2 border-t border-border pt-5 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-1 size-3.5 shrink-0 text-primary" /> <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {t.primary ? (
                  <PrimaryLink to="/auth">Get started</PrimaryLink>
                ) : (
                  <Link to="/auth" className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
                    Choose {t.name}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */

function FAQ() {
  const qa: [string, string][] = [
    ["How accurate is the generated plan?", "It's a starting point built from your subjects, exam dates and available hours. You can edit any task, and the plan re-balances when you fall behind or finish early."],
    ["Who can see my notes and documents?", "Only you. Uploaded files sit in private storage tied to your account, and your data is never used to train anything."],
    ["Does the tutor work without uploading a PDF?", "Yes. It answers from general academic knowledge, and uses your documents only when you attach them."],
    ["Can I use it in Nepali?", "You can set responses to English, Nepali, or let it follow whichever language you write in."],
    ["What happens on the free plan?", "Three subjects, the weekly plan, daily tasks, exam tracking and basic analytics — with no card and no time limit."],
    ["Can I export my data?", "Weekly and monthly reports export as CSV, and any report page can be printed to PDF."],
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-b border-border bg-muted/40">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <SectionHead eyebrow="Questions" title="Before you sign up" />
        <div className="mt-8 border-t border-border">
          {qa.map(([q, a], i) => (
            <div key={q} className="border-b border-border">
              <button
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                {q}
                <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <p className="pb-4 text-sm text-muted-foreground">{a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CLOSING ---------------- */

function Closing() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-3xl font-500">Start with this week</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Add a couple of subjects and your next exam date. You'll have a plan for tomorrow morning in a minute or two.
          </p>
        </div>
        <PrimaryLink to="/auth">Create an account <ArrowRight className="size-4" /></PrimaryLink>
      </div>
    </section>
  );
}

/* ---------------- FOOTER ---------------- */

function Footer() {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return (
    <footer className="bg-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="font-display text-lg">Study Planner</p>
          <p className="mt-2 text-sm text-muted-foreground">A practical study workspace for students in Nepal and beyond.</p>
        </div>
        <FooterCol title="Product" items={[["The planner", "#demo"], ["What's inside", "#features"], ["Tutor", "#ai"], ["Pricing", "#pricing"]]} />
        <FooterCol title="Help" items={[["How it works", "#how"], ["Questions", "#faq"]]} />
        <div>
          <h3 className="text-sm font-semibold">Stay in touch</h3>
          <form className="mt-3 flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <label className="sr-only" htmlFor="newsletter">Email address</label>
            <input
              id="newsletter"
              type="email"
              placeholder="you@example.com"
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <button className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">Join</button>
          </form>
          <div className="mt-4 flex gap-4 text-muted-foreground">
            <a href="#top" aria-label="GitHub"><Github className="size-4" /></a>
            <a href="#top" aria-label="Twitter"><Twitter className="size-4" /></a>
            <a href="#top" aria-label="LinkedIn"><Linkedin className="size-4" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground">
          <p>© {year ?? ""} Study Planner</p>
          <p>Privacy · Terms</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map(([l, h]) => (
          <li key={h + l}><a href={h} className="hover:text-foreground">{l}</a></li>
        ))}
      </ul>
    </div>
  );
}
