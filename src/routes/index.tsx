import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles, BookOpen, Calendar, Target, BarChart3, ListChecks, CalendarRange,
  Lightbulb, RotateCcw, Activity, Brain, Clock, Wand2, AlertTriangle, Repeat,
  GraduationCap, LineChart, Network, ArrowRight, Play, Check, Star, ChevronDown,
  Flame, Trophy, Bell, Timer, FileDown, Menu, X, Github, Twitter, Linkedin,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Study Planner — Study Smarter. Achieve More." },
      { name: "description", content: "Personalized AI study schedules, exam tracking, and progress analytics for students and professionals." },
      { property: "og:title", content: "AI Study Planner" },
      { property: "og:description", content: "AI-powered study plans built around your subjects, exams, and goals." },
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
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Nav />
      <Hero />
      <Logos />
      <Features />
      <HowItWorks />
      <AISection />
      <DashboardPreview />
      <Roadmap />
      <Stats />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}

/* ---------------- NAV ---------------- */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    ["Features", "#features"],
    ["How it works", "#how"],
    ["AI", "#ai"],
    ["Pricing", "#pricing"],
    ["FAQ", "#faq"],
  ];

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? "py-2" : "py-4"}`}>
      <div className="mx-auto max-w-7xl px-4">
        <div className={`flex items-center justify-between rounded-2xl px-4 py-3 transition-all ${scrolled ? "glass shadow-card" : ""}`}>
          <a href="#top" className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold tracking-tight">AI Study Planner</span>
          </a>
          <nav className="hidden items-center gap-7 md:flex">
            {links.map(([l, h]) => (
              <a key={h} href={h} className="text-sm text-muted-foreground transition hover:text-foreground">{l}</a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link to="/auth" className="text-sm font-medium text-foreground/80 hover:text-foreground">Log in</Link>
            <CTAButton to="/auth">Start free</CTAButton>
          </div>
          <button className="md:hidden" onClick={() => setOpen(v => !v)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="mt-2 rounded-2xl glass p-4 md:hidden">
            <div className="grid gap-3">
              {links.map(([l, h]) => (
                <a key={h} href={h} onClick={() => setOpen(false)} className="text-sm text-foreground/80">{l}</a>
              ))}
              <Link to="/auth" onClick={() => setOpen(false)} className="text-sm font-medium text-foreground/80">Log in</Link>
              <CTAButton to="/auth">Start free</CTAButton>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="grid h-8 w-8 place-items-center rounded-xl text-white shadow-elegant"
         style={{ backgroundImage: "var(--gradient-primary)" }}>
      <Sparkles className="h-4 w-4" />
    </div>
  );
}

function CTAButton({ children, href, to, variant = "primary" as "primary" | "ghost" | "dark" }: any) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all";
  const cls =
    variant === "ghost"
      ? `${base} border border-border bg-background text-foreground hover:bg-muted`
      : variant === "dark"
      ? `${base} bg-[var(--ink)] text-[var(--ink-foreground)] hover:opacity-90`
      : `${base} text-white shadow-elegant hover:brightness-110 hover:-translate-y-0.5`;
  const style = variant === "primary" ? { backgroundImage: "var(--gradient-primary)" } : undefined;
  if (to) return <Link to={to} className={cls} style={style}>{children}</Link>;
  return <a href={href ?? "#"} className={cls} style={style}>{children}</a>;
}

/* ---------------- HERO ---------------- */
function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-24">
      <div className="absolute inset-0 -z-10 bg-aurora opacity-70" />
      <div className="absolute inset-0 -z-10 grid-bg" />
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-4xl text-center animate-fade-up">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            New · AI Performance Coach is live
          </div>
          <h1 className="text-balance text-5xl font-bold tracking-tight md:text-7xl">
            Study <span className="font-display italic text-gradient">Smarter</span> with AI.
            <br className="hidden md:block" /> Achieve more, every week.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            AI Study Planner builds personalized schedules from your subjects, exams, and available hours — then adapts daily so you always know exactly what to study next.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <CTAButton to="/auth">Start Planning Free <ArrowRight className="h-4 w-4" /></CTAButton>
            <CTAButton href="#dashboard-preview" variant="ghost"><Play className="h-4 w-4" /> See Demo</CTAButton>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card · Free forever plan · Cancel anytime</p>
        </div>

        <div className="relative mx-auto mt-16 max-w-6xl">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] opacity-60 blur-3xl"
               style={{ backgroundImage: "var(--gradient-primary)" }} />
          <HeroDashboard />
        </div>
      </div>
    </section>
  );
}

function HeroDashboard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-elegant">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>
        <div className="ml-3 text-xs text-muted-foreground">app.aistudyplanner.com / dashboard</div>
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-12">
        {/* sidebar */}
        <aside className="hidden rounded-2xl bg-[var(--ink)] p-4 text-[var(--ink-foreground)] md:col-span-3 md:block">
          <div className="mb-6 flex items-center gap-2">
            <Logo /><span className="text-sm font-semibold">Study Planner</span>
          </div>
          <nav className="space-y-1 text-sm">
            {[
              ["Dashboard", Activity, true],
              ["Subjects", BookOpen],
              ["Exams", Calendar],
              ["Tasks", ListChecks],
              ["Analytics", BarChart3],
              ["Achievements", Trophy],
            ].map(([label, Icon, active]: any) => (
              <div key={label} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${active ? "bg-white/10" : "opacity-70 hover:opacity-100"}`}>
                <Icon className="h-4 w-4" /> {label}
              </div>
            ))}
          </nav>
          <div className="mt-6 rounded-xl border border-white/10 p-3 text-xs">
            <div className="mb-1 flex items-center gap-2 text-accent"><Flame className="h-3.5 w-3.5" /> 14-day streak</div>
            <p className="text-white/60">Keep going — you're in the top 8% of learners this week.</p>
          </div>
        </aside>

        {/* main */}
        <div className="space-y-4 md:col-span-9">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard icon={<Flame className="h-4 w-4" />} label="Study streak" value="14 days" tone="accent" />
            <StatCard icon={<Target className="h-4 w-4" />} label="Weekly goal" value="82%" tone="primary" progress={82} />
            <StatCard icon={<Clock className="h-4 w-4" />} label="Focus today" value="3h 20m" tone="secondary" />
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <div className="md:col-span-3 rounded-2xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Today's plan</h4>
                <span className="text-xs text-muted-foreground">AI optimized · 4 sessions</span>
              </div>
              <div className="space-y-2">
                {[
                  ["Calculus — Limits & continuity", "45m", "primary", true],
                  ["Physics — Rotational motion", "30m", "secondary", true],
                  ["English — Reading comprehension", "25m", "accent", false],
                  ["Revision — Organic chemistry", "40m", "primary", false],
                ].map(([t, d, c, done]: any) => (
                  <div key={t} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
                    <span className={`grid h-6 w-6 place-items-center rounded-md text-white`} style={{ backgroundColor: `var(--${c})` }}>
                      {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span className={`flex-1 text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{t}</span>
                    <span className="text-xs text-muted-foreground">{d}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 rounded-2xl border border-border p-4">
              <h4 className="mb-3 text-sm font-semibold">Weekly performance</h4>
              <MiniChart />
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 p-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-xs">AI: shift 25m from Biology → Physics this week to balance weak topics.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Mathematics Final", "in 12 days", "primary"],
              ["Physics Mid-term", "in 21 days", "secondary"],
              ["Chemistry Quiz", "in 4 days", "accent"],
            ].map(([t, d, c]: any) => (
              <div key={t} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Upcoming exam</span>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `var(--${c})` }} />
                </div>
                <div className="mt-1 text-sm font-semibold">{t}</div>
                <div className="text-xs text-muted-foreground">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone, progress }: any) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="grid h-6 w-6 place-items-center rounded-md text-white" style={{ backgroundColor: `var(--${tone})` }}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
      {progress != null && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundImage: "var(--gradient-primary)" }} />
        </div>
      )}
    </div>
  );
}

function MiniChart() {
  const bars = [40, 65, 50, 80, 70, 95, 60];
  return (
    <div className="flex h-28 items-end gap-2">
      {bars.map((b, i) => (
        <div key={i} className="flex-1 rounded-md" style={{ height: `${b}%`, backgroundImage: "var(--gradient-primary)", opacity: 0.85 }} />
      ))}
    </div>
  );
}

/* ---------------- LOGOS ---------------- */
function Logos() {
  const items = ["Harvard", "MIT", "Stanford", "Oxford", "IIT", "BIT", "NUS", "Cambridge"];
  return (
    <section className="border-y border-border bg-muted/30 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <p className="mb-4 text-center text-xs uppercase tracking-widest text-muted-foreground">Trusted by students from</p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 md:grid-cols-8">
          {items.map(n => (
            <div key={n} className="text-center font-display text-xl italic text-muted-foreground/70">{n}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FEATURES ---------------- */
function Features() {
  const features = [
    { icon: Wand2, t: "AI Study Schedule Generator", d: "Generate a complete, personalized plan in seconds — tailored to your subjects, exams, and energy." },
    { icon: BookOpen, t: "Subject Management", d: "Organize syllabi, chapters, and difficulty levels in one beautiful workspace." },
    { icon: Calendar, t: "Exam Countdown", d: "Visual countdowns keep priorities sharp and exam pressure controlled." },
    { icon: Target, t: "Goal Tracking", d: "Set weekly and monthly targets and watch them complete themselves." },
    { icon: BarChart3, t: "Progress Analytics", d: "Beautiful charts show how time, focus, and performance evolve over time." },
    { icon: ListChecks, t: "Daily Tasks", d: "Wake up to a clean, prioritized list — no decision fatigue, ever." },
    { icon: CalendarRange, t: "Weekly Planning", d: "Drag-and-drop weekly view with auto-balancing for breaks and revision." },
    { icon: Lightbulb, t: "Smart Recommendations", d: "Suggestions that learn from your habits and exam outcomes." },
    { icon: RotateCcw, t: "Revision Planning", d: "Spaced repetition baked in — recall when it matters, not when you cram." },
    { icon: Activity, t: "Productivity Insights", d: "See your most productive hours and protect them automatically." },
  ];
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHead
          eyebrow="Features"
          title={<>Everything you need to <span className="text-gradient font-display italic">perform</span>.</>}
          sub="A complete planning system designed for serious students — minus the busywork."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {features.map(({ icon: Icon, t, d }, i) => (
            <div key={t}
                 className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-elegant ${i === 0 ? "xl:col-span-2" : ""}`}>
              <div className="mb-4 inline-grid h-10 w-10 place-items-center rounded-xl text-white shadow-elegant"
                   style={{ backgroundImage: "var(--gradient-primary)" }}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-60"
                   style={{ backgroundImage: "var(--gradient-primary)" }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, sub, light = false }: any) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className={`mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${light ? "border-white/15 text-white/70" : "border-border text-muted-foreground"}`}>{eyebrow}</div>
      <h2 className={`text-balance text-4xl font-bold tracking-tight md:text-5xl ${light ? "text-white" : ""}`}>{title}</h2>
      {sub && <p className={`mx-auto mt-4 max-w-2xl text-balance text-lg ${light ? "text-white/70" : "text-muted-foreground"}`}>{sub}</p>}
    </div>
  );
}

/* ---------------- HOW IT WORKS ---------------- */
function HowItWorks() {
  const steps = [
    { t: "Add Subjects", d: "Bring in your syllabus or pick from templates.", icon: BookOpen },
    { t: "Add Exam Dates", d: "Set deadlines so AI can work backwards from them.", icon: Calendar },
    { t: "Set Study Hours", d: "Tell us when you study best — mornings, nights, weekends.", icon: Clock },
    { t: "AI Generates Plan", d: "A personalized week appears, balanced and realistic.", icon: Wand2 },
    { t: "Track Progress Daily", d: "Tick tasks, log focus, build the streak.", icon: ListChecks },
    { t: "Improve Performance", d: "AI re-tunes your plan as you grow.", icon: LineChart },
  ];
  return (
    <section id="how" className="bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHead eyebrow="How it works" title="From blank slate to a working study plan in 60 seconds." sub="Six simple steps. Zero spreadsheets." />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.t} className="group relative rounded-2xl border border-border bg-card p-6 transition hover:shadow-elegant">
              <div className="absolute -top-3 left-6 rounded-full bg-[var(--ink)] px-3 py-1 text-xs font-semibold text-white">Step {i + 1}</div>
              <div className="mt-2 mb-3 inline-grid h-12 w-12 place-items-center rounded-xl text-white" style={{ backgroundImage: "var(--gradient-primary)" }}>
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- AI SECTION ---------------- */
function AISection() {
  const cards = [
    { icon: Brain, t: "Personalized Study Plans", d: "Plans built around your goals, not someone else's template." },
    { icon: Clock, t: "Smart Time Allocation", d: "AI weighs difficulty, deadlines, and focus windows." },
    { icon: Repeat, t: "Dynamic Adjustment", d: "Missed a day? Your week reshapes itself, instantly." },
    { icon: AlertTriangle, t: "Weak Subject Detection", d: "Spot blind spots before they cost you marks." },
    { icon: RotateCcw, t: "Revision Recommendations", d: "Spaced repetition that respects your real schedule." },
    { icon: GraduationCap, t: "Exam Preparation", d: "Reverse-engineered from exam dates and rubrics." },
    { icon: Activity, t: "Productivity Analysis", d: "Understand which hours actually move the needle." },
    { icon: Network, t: "Learning Pattern Detection", d: "Identify habits that compound — and ones that don't." },
  ];
  return (
    <section id="ai" className="relative overflow-hidden bg-[var(--ink)] py-28 text-[var(--ink-foreground)]">
      <div className="absolute inset-0 bg-aurora opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4">
        <SectionHead
          light
          eyebrow="AI Engine"
          title={<>An intelligence layer that <span className="font-display italic text-gradient">studies with you</span>.</>}
          sub="Not a chatbot bolted on — a planning brain trained for academic outcomes."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ icon: Icon, t, d }) => (
            <div key={t} className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
              <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-xl text-white" style={{ backgroundImage: "var(--gradient-primary)" }}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-white/65">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- DASHBOARD PREVIEW ---------------- */
function DashboardPreview() {
  return (
    <section id="demo" className="py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHead
          eyebrow="Dashboard"
          title={<>Your <span className="text-gradient font-display italic">command center</span> for academics.</>}
          sub="Tasks, exams, streaks, and AI nudges — all in one beautiful, focused workspace."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <HeroDashboard />
          </div>
          <div className="grid gap-4 lg:col-span-5">
            <PreviewCard icon={<Bell className="h-4 w-4" />} title="Notifications" desc="Smart reminders that respect your focus blocks." />
            <PreviewCard icon={<Trophy className="h-4 w-4" />} title="Achievement Badges" desc="Gamified milestones that turn habits into momentum." />
            <PreviewCard icon={<Timer className="h-4 w-4" />} title="Pomodoro Timer" desc="Built-in focus sessions with cooldowns and stats." />
            <PreviewCard icon={<FileDown className="h-4 w-4" />} title="Weekly Reports · PDF Export" desc="Beautiful summaries you can share with mentors and parents." />
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewCard({ icon, title, desc }: any) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ backgroundImage: "var(--gradient-primary)" }}>
        {icon}
      </div>
      <div className="min-w-0">
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

/* ---------------- ROADMAP ---------------- */
function Roadmap() {
  const stages = [
    "Current Level", "Foundation Building", "Consistent Study Habits",
    "Subject Mastery", "Exam Preparation", "Top Performance",
  ];
  return (
    <section className="bg-muted/30 py-24">
      <div className="mx-auto max-w-5xl px-4">
        <SectionHead eyebrow="Roadmap" title="A learning journey, visualized." sub="Track where you are and where you're going — every step deliberate." />
        <div className="relative mt-14">
          <div className="absolute left-1/2 top-0 bottom-0 hidden w-px -translate-x-1/2 bg-border md:block" />
          <div className="space-y-6">
            {stages.map((s, i) => (
              <div key={s} className={`flex items-center gap-4 md:gap-8 ${i % 2 ? "md:flex-row-reverse" : ""}`}>
                <div className="flex-1 rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stage {i + 1}</div>
                  <div className="mt-1 text-lg font-semibold">{s}</div>
                </div>
                <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full text-white shadow-elegant animate-pulse-ring"
                     style={{ backgroundImage: "var(--gradient-primary)" }}>
                  {i + 1}
                </div>
                <div className="hidden flex-1 md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- STATS ---------------- */
function Stats() {
  const items = [
    { n: 10000, suffix: "+", l: "Study plans generated" },
    { n: 95, suffix: "%", l: "User satisfaction" },
    { n: 500, suffix: "+", l: "Daily active students" },
    { n: 1, suffix: "M+", l: "Study hours planned" },
  ];
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-6 rounded-3xl border border-border bg-card p-8 shadow-card sm:grid-cols-2 md:grid-cols-4">
          {items.map(it => (
            <div key={it.l} className="text-center">
              <div className="text-4xl font-bold tracking-tight md:text-5xl">
                <Counter to={it.n} />{it.suffix}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{it.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Counter({ to }: { to: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0; const start = performance.now(); const dur = 1400;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setVal(Math.floor(p * to));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span>{val.toLocaleString()}</span>;
}

/* ---------------- TESTIMONIALS ---------------- */
function Testimonials() {
  const items = [
    { n: "Priya Sharma", r: "BIT, 3rd year", q: "I went from cramming the night before to a 14-day streak. My GPA jumped from 3.1 to 3.7.", m: "+0.6 GPA", a: "PS" },
    { n: "Aarav Khanna", r: "+2 Science", q: "The AI knew I was weak in organic chem before I did. The revision plan saved my finals.", m: "92% in Chemistry", a: "AK" },
    { n: "Sneha Rai", r: "CSIT, BSc", q: "Finally a planner that adapts when life happens. I missed two days and it just rebuilt the week.", m: "Top 5% in class", a: "SR" },
    { n: "Rahul Verma", r: "UPSC aspirant", q: "Used it for 6 months straight. My mock test scores improved every single week.", m: "+38% mock scores", a: "RV" },
    { n: "Mira Iyer", r: "BCA, 2nd year", q: "I love that it feels like a Linear app — fast, beautiful, no clutter.", m: "20+ hrs saved / month", a: "MI" },
    { n: "Daniel Park", r: "MBBS prep", q: "The exam countdown alone is worth the Pro plan. It's my new dashboard.", m: "Consistent A grades", a: "DP" },
  ];
  return (
    <section className="bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHead eyebrow="Student stories" title="Results that speak for themselves." sub="Real students. Real outcomes. Backed by their data." />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map(t => (
            <div key={t.n} className="rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-elegant">
              <div className="mb-3 flex items-center gap-1 text-yellow-500">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="text-foreground">"{t.q}"</p>
              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full text-sm font-semibold text-white" style={{ backgroundImage: "var(--gradient-primary)" }}>{t.a}</div>
                  <div>
                    <div className="text-sm font-semibold">{t.n}</div>
                    <div className="text-xs text-muted-foreground">{t.r}</div>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{t.m}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- PRICING ---------------- */
function Pricing() {
  const plans = [
    { name: "Free", price: "$0", desc: "Start strong, zero commitment.", cta: "Get started", features: ["3 AI study plans / month", "Basic progress tracking", "Subject & exam manager", "Daily task list"], variant: "ghost" },
    { name: "Pro", price: "$9", desc: "For serious students chasing results.", cta: "Start 14-day trial", features: ["Unlimited AI study plans", "Advanced analytics & charts", "Smart recommendations", "Weekly PDF reports", "Pomodoro & focus stats"], variant: "primary", featured: true },
    { name: "Premium", price: "$19", desc: "Everything in Pro + your AI coach.", cta: "Go Premium", features: ["AI Performance Coach", "1:1 weekly insights", "Exam strategy briefs", "Priority support", "Early access to new AI features"], variant: "dark" },
  ];
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHead eyebrow="Pricing" title="Simple plans. Serious results." sub="Pay for outcomes, not features. Upgrade or cancel anytime." />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map(p => (
            <div key={p.name}
                 className={`relative rounded-3xl border p-7 transition ${p.featured ? "border-transparent shadow-elegant" : "border-border bg-card shadow-card"}`}
                 style={p.featured ? { backgroundImage: "linear-gradient(180deg, rgba(37,99,235,0.05), rgba(124,58,237,0.05))", borderColor: "transparent" } : {}}>
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-elegant"
                     style={{ backgroundImage: "var(--gradient-primary)" }}>Most popular</div>
              )}
              <div className="text-sm font-semibold text-muted-foreground">{p.name}</div>
              <div className="mt-2 flex items-end gap-1">
                <div className="text-5xl font-bold tracking-tight">{p.price}</div>
                <div className="mb-2 text-sm text-muted-foreground">/month</div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="my-6 space-y-2.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full text-white" style={{ backgroundImage: "var(--gradient-primary)" }}>
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <CTAButton href="#cta" variant={p.variant as any}>{p.cta}</CTAButton>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
function FAQ() {
  const faqs = [
    { q: "How does the AI generate my study schedule?", a: "The planner analyzes your subjects, syllabus weight, exam dates, available hours, and energy patterns, then builds a balanced weekly plan with spaced revision built-in." },
    { q: "Is my data private?", a: "Yes. Your data is encrypted in transit and at rest. We never sell or share study data with third parties, and you can export or delete everything at any time." },
    { q: "Can I track my study habits over time?", a: "Absolutely. Streaks, weekly performance, focus minutes, and per-subject progress are all visualized in the dashboard." },
    { q: "Will it help me prepare for big exams?", a: "It's built for exactly that. The AI works backwards from your exam date to ensure every topic gets the time it deserves." },
    { q: "What's included in the Free plan?", a: "Three AI plans per month, basic progress tracking, the subject and exam manager, and the daily task list — forever free." },
    { q: "Can I cancel anytime?", a: "Yes, with one click. No emails, no hoops, no guilt." },
  ];
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="bg-muted/30 py-24">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHead eyebrow="FAQ" title="Questions, answered." />
        <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <button key={f.q} onClick={() => setOpen(isOpen ? -1 : i)} className="block w-full px-6 py-5 text-left">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold">{f.q}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
                {isOpen && <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CONTACT / CTA ---------------- */
function Contact() {
  return (
    <section id="cta" className="py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-3xl bg-[var(--ink)] p-10 text-white shadow-elegant md:p-16">
          <div className="absolute inset-0 bg-aurora opacity-50" />
          <div className="relative grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
                Start studying <span className="font-display italic text-gradient">smarter</span> today.
              </h2>
              <p className="mt-4 max-w-md text-white/70">
                Join 10,000+ students who turned scattered study sessions into a structured path to top performance.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <CTAButton href="#">Start Planning Free <ArrowRight className="h-4 w-4" /></CTAButton>
                <a href="mailto:hello@aistudyplanner.com" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Talk to us</a>
              </div>
              <p className="mt-6 text-xs text-white/50">support@aistudyplanner.com</p>
            </div>
            <form onSubmit={(e) => e.preventDefault()} className="grid gap-3 rounded-2xl bg-white/5 p-5 backdrop-blur">
              <label className="grid gap-1">
                <span className="text-xs text-white/70">Name</span>
                <input className="rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-white/40" placeholder="Your name" />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-white/70">Email</span>
                <input type="email" className="rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-white/40" placeholder="you@school.edu" />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-white/70">What are you preparing for?</span>
                <textarea rows={3} className="resize-none rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-white/40" placeholder="e.g. CSIT finals in 6 weeks" />
              </label>
              <button className="mt-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-elegant" style={{ backgroundImage: "var(--gradient-primary)" }}>
                Get my study plan <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- FOOTER ---------------- */
function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2"><Logo /><span className="font-semibold">AI Study Planner</span></div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">Study smarter. Achieve more. The intelligent planning system for students who want to perform at their best.</p>
            <div className="mt-4 flex gap-2 text-muted-foreground">
              <a href="#" className="rounded-md p-2 hover:bg-muted"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="rounded-md p-2 hover:bg-muted"><Github className="h-4 w-4" /></a>
              <a href="#" className="rounded-md p-2 hover:bg-muted"><Linkedin className="h-4 w-4" /></a>
            </div>
          </div>
          {[
            ["Product", ["Features", "How it works", "Dashboard", "Pricing"]],
            ["Company", ["About", "Careers", "Press", "Contact"]],
            ["Resources", ["Help center", "Privacy", "Terms", "Security"]],
          ].map(([title, items]: any) => (
            <div key={title}>
              <div className="text-sm font-semibold">{title}</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {items.map((i: string) => <li key={i}><a href="#" className="hover:text-foreground">{i}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} AI Study Planner. All rights reserved.</p>
          <p>Built with intent. Designed for outcomes.</p>
        </div>
      </div>
    </footer>
  );
}
