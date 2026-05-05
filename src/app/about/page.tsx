import type { Metadata } from "next";
import Link from "next/link";
import Squares from "@/components/Squares";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import HomeHeroActions from "@/components/ui/home-hero-actions";
import { cn } from "@/lib/utils";
import {
  AudioWaveform,
  Brain,
  Check,
  Eye,
  FileText,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Link2,
  Shield,
  Smartphone,
  Target,
  Video,
  Vote,
  Scale,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "VerifAI builds multimodal AI-powered verification for images, video, audio, and text. Our mission is to restore trust in digital content.",
  alternates: {
    canonical: "/about",
  },
};

function SectionHeader({
  kicker,
  title,
  description,
  className,
}: {
  kicker: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn("space-y-2 sm:space-y-3 xl:space-y-4", className)}>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[11px] xl:text-xs xl:tracking-[0.22em]">
        {kicker}
      </p>
      <h2 className="text-balance text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl xl:text-3xl xl:leading-tight 2xl:text-[2.125rem] 2xl:leading-[1.2]">
        {title}
      </h2>
      {description ? (
        <p className="max-w-prose text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base xl:max-w-2xl xl:text-lg 2xl:text-xl 2xl:leading-relaxed">
          {description}
        </p>
      ) : null}
    </header>
  );
}

/** Body copy: comfortable on phones, scales up on laptop / desktop */
const aboutBody =
  "text-[15px] leading-[1.75] text-muted-foreground md:text-base md:leading-relaxed xl:text-[1.0625rem] xl:leading-[1.8] 2xl:text-lg 2xl:leading-[1.78]";
const aboutBodyPretty = cn(aboutBody, "text-pretty");

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-background selection:bg-primary/20">
      {/* Hero — aligned with home page hero */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="relative z-10 mx-auto max-w-5xl space-y-8 px-4 text-center">
          <div className="flex justify-center">
            <AnimatedShinyText className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary shadow-[0_0_20px_rgba(96,34,237,0.15)]">
              Verify Before You Trust.
            </AnimatedShinyText>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-7xl leading-[1.1]">
            Building the future of <br />
            <span className="text-primary">digital trust</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            We help people and organizations separate real content from manipulation—across images,
            video, audio, and text—before false narratives spread.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <HomeHeroActions />
          </div>
        </div>

        <div className="pointer-events-auto absolute inset-0 z-0">
          <Squares
            speed={0.5}
            squareSize={32}
            direction="diagonal"
            borderColor="#fff"
            hoverFillColor="#7C5CFF"
            className="h-full w-full opacity-10"
          />
        </div>
      </section>

      <article className="mx-auto w-full max-w-[min(42rem,calc(100vw-1.5rem))] px-[clamp(1rem,4vw,2rem)] pb-[max(3rem,env(safe-area-inset-bottom))] pt-[clamp(2.5rem,8vw,5.5rem)] sm:px-6 md:pt-20 xl:max-w-6xl xl:px-8 xl:pt-24 2xl:max-w-7xl 2xl:px-12 2xl:pt-28">
        <div className="flex flex-col gap-[clamp(3rem,10vw,5.5rem)] xl:gap-24 2xl:gap-32">
          {/* Who we are */}
          <section id="who-we-are" className="scroll-mt-28 space-y-[clamp(1.25rem,4vw,2rem)] xl:space-y-8 2xl:space-y-10">
            <SectionHeader kicker="01 — Introduction" title="Who we are" />
            <div
              className={cn(
                "space-y-5 border-l-[3px] border-primary/30 pl-[clamp(1rem,4vw,1.75rem)] xl:space-y-6 xl:border-l-4 xl:pl-10 2xl:pl-12",
                aboutBody
              )}
            >
              <p className="text-[clamp(0.95rem,2.5vw,1.125rem)] font-medium leading-relaxed text-foreground/95 xl:text-xl xl:leading-snug 2xl:text-2xl">
                At VerifAI, we are building the future of digital trust.
              </p>
              <p className={aboutBodyPretty}>
                Hyper-realistic synthetic media is no longer theoretical. When images, video, audio,
                and text can be forged convincingly, the bottleneck isn&apos;t storage or bandwidth—it&apos;s
                knowing what to believe. VerifAI exists to give you a single place to test content
                across modalities and see evidence-backed answers.
              </p>
            </div>
          </section>

          {/* What we do */}
          <section id="what-we-do" className="scroll-mt-28 space-y-[clamp(1.5rem,5vw,2.5rem)] xl:space-y-10 2xl:space-y-12">
            <SectionHeader
              kicker="02 — Capabilities"
              title="What we do"
              description="VerifAI is a multimodal verification platform. We analyze:"
            />

            <ul className="grid grid-cols-2 gap-[clamp(0.625rem,2vw,1rem)] min-[480px]:grid-cols-4 xl:gap-5 2xl:gap-6">
              {[
                { icon: ImageIcon, label: "Images" },
                { icon: Video, label: "Videos" },
                { icon: AudioWaveform, label: "Audio" },
                { icon: FileText, label: "Text" },
              ].map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex min-h-[6.5rem] flex-col items-center justify-center gap-2.5 rounded-2xl border border-border/90 bg-card/50 px-2 py-4 text-center shadow-sm ring-1 ring-border/30 transition motion-safe:duration-300 motion-safe:ease-out hover:border-primary/35 hover:bg-muted/25 hover:ring-primary/15 dark:bg-card/35 dark:hover:bg-muted/20 sm:min-h-0 sm:gap-3 sm:py-5 xl:min-h-[7.5rem] xl:rounded-3xl xl:py-8 2xl:min-h-[8.5rem] 2xl:gap-4"
                >
                  <Icon
                    className="h-[clamp(1.35rem,4vw,1.5rem)] w-[clamp(1.35rem,4vw,1.5rem)] text-primary xl:h-8 xl:w-8 2xl:h-9 2xl:w-9"
                    strokeWidth={1.65}
                    aria-hidden
                  />
                  <span className="text-[clamp(0.75rem,2.2vw,0.875rem)] font-medium leading-tight text-foreground xl:text-base 2xl:text-lg">
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            <div className={cn("space-y-6 xl:space-y-8", aboutBody)}>
              <p className={aboutBodyPretty}>
                Tools that only support one media type force you to stitch verdicts together by hand.
                We keep modalities in one workflow so signals stay comparable and you spend less time
                reconciling incompatible reports.
              </p>

              <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-[clamp(1.15rem,4vw,1.75rem)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] dark:bg-muted/12 dark:shadow-none xl:rounded-2xl xl:p-8 2xl:p-10">
                <p className="mb-4 font-medium text-foreground xl:mb-5 xl:text-lg 2xl:text-xl">
                  Beyond a single score, you get:
                </p>
                <ul className="space-y-3.5 xl:space-y-4">
                  {[
                    "Confidence scores tied to the model’s reasoning",
                    "Visual cues and annotations where the image story supports them",
                    "Fact-checking-style context on text claims",
                    "Explanations you can read without a lab notebook",
                  ].map((item) => (
                    <li key={item} className="flex gap-3 xl:gap-4">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/20 dark:bg-primary/18 xl:mt-1 xl:h-6 xl:w-6">
                        <Check className="h-3 w-3 xl:h-3.5 xl:w-3.5" strokeWidth={2.5} aria-hidden />
                      </span>
                      <span className={cn("min-w-0 flex-1", aboutBodyPretty)}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className={cn(aboutBodyPretty, "text-foreground/90 xl:text-[1.0625rem] 2xl:text-lg")}>
                The goal is judgment you can defend: not only <em>fake or not</em>, but{" "}
                <span className="font-medium text-foreground">why</span> the model said so.
              </p>
            </div>
          </section>

          {/* Technology */}
          <section id="technology" className="scroll-mt-28 space-y-[clamp(1.5rem,5vw,2.5rem)] xl:space-y-10 2xl:space-y-12">
            <SectionHeader
              kicker="03 — Stack"
              title="Our technology"
              description="Several layers back each verdict—none of them optional on our roadmap."
            />

            <div className="grid grid-cols-1 gap-[clamp(0.75rem,2.5vw,1.25rem)] sm:grid-cols-2 xl:grid-cols-3 xl:gap-6 2xl:gap-8">
              {[
                {
                  icon: Brain,
                  title: "Deep learning models",
                  body: "CNN-based detectors focused on manipulation cues in still images and sampled video frames.",
                },
                {
                  icon: AudioWaveform,
                  title: "Audio forensics",
                  body: "Time–frequency features (including MFCCs) to flag synthetic or spliced speech.",
                },
                {
                  icon: Shield,
                  title: "Fact-checking engine",
                  body: "Transformer-backed NLP to stress-test textual claims against trusted references.",
                },
                {
                  icon: Globe,
                  title: "Federated learning",
                  body: "Train without pooling raw user media in one place—privacy-preserving by design where we deploy it.",
                },
                {
                  icon: Link2,
                  title: "Blockchain verification",
                  body: "Immutable logs for model releases and updates when governance demands an audit trail.",
                },
              ].map(({ icon: Icon, title, body }, i, arr) => (
                <div
                  key={title}
                  className={cn(
                    "flex h-full flex-col rounded-2xl border border-border/80 bg-card/45 p-[clamp(1rem,3vw,1.35rem)] shadow-sm ring-1 ring-border/25 transition motion-safe:duration-300 hover:border-primary/30 hover:bg-muted/15 hover:ring-primary/10 dark:bg-card/30 dark:hover:bg-muted/15 xl:rounded-3xl xl:p-6 2xl:p-8",
                    i === arr.length - 1 && "sm:col-span-2 sm:mx-auto sm:max-w-xl xl:col-span-1 xl:mx-0 xl:max-w-none"
                  )}
                >
                  <div className="flex items-start gap-3 sm:gap-4 xl:gap-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.11] text-primary ring-1 ring-primary/15 dark:bg-primary/15 xl:h-12 xl:w-12 xl:rounded-2xl">
                      <Icon className="h-[18px] w-[18px] xl:h-5 xl:w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold leading-snug text-foreground xl:text-lg 2xl:text-xl">
                        {title}
                      </h3>
                      <p className={cn("mt-2 xl:mt-3", aboutBody)}>{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Why it matters */}
          <section id="why-it-matters" className="scroll-mt-28 space-y-[clamp(1.25rem,4vw,2rem)] xl:space-y-8 2xl:space-y-10">
            <SectionHeader kicker="04 — Impact" title="Why it matters" />
            <div className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-gradient-to-br from-muted/45 via-muted/15 to-transparent p-[clamp(1.15rem,4vw,2rem)] dark:from-muted/25 dark:via-muted/10 dark:to-transparent xl:rounded-3xl xl:p-10 2xl:p-12">
              <p className={cn("mb-6 max-w-prose xl:mb-8 xl:max-w-3xl", aboutBodyPretty)}>
                Synthetic media stopped being a conference demo a long time ago. It shows up anywhere
                trust is negotiated in public:
              </p>
              <ul className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 min-[520px]:gap-4 xl:grid-cols-4 xl:gap-5 2xl:gap-6">
                {[
                  { icon: Vote, text: "Elections and political systems" },
                  { icon: Smartphone, text: "Social media and everyday sharing" },
                  { icon: Scale, text: "Law enforcement and investigations" },
                  { icon: GraduationCap, text: "Schools, credentials, and coursework" },
                ].map(({ icon: Icon, text }) => (
                  <li
                    key={text}
                    className="flex min-h-[3.25rem] items-start gap-3 rounded-xl border border-border/55 bg-background/70 px-3 py-3 leading-snug text-foreground/95 shadow-sm backdrop-blur-[2px] dark:bg-background/45 sm:min-h-0 sm:items-center sm:px-4 xl:min-h-[4rem] xl:flex-col xl:items-start xl:justify-center xl:gap-3 xl:rounded-2xl xl:px-5 xl:py-5 2xl:gap-4 2xl:px-6 2xl:py-6"
                  >
                    <Icon
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0 xl:h-5 xl:w-5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className={cn("min-w-0 flex-1 xl:flex-none", aboutBody, "text-foreground/95 xl:leading-snug")}>
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
              <p className={cn("mt-6 border-t border-border/50 pt-6 xl:mt-8 xl:pt-8 xl:max-w-4xl", aboutBodyPretty)}>
                VerifAI is aimed at anyone who ships or consumes content at volume—product teams,
                newsrooms, educators, and individuals who&apos;d rather verify once than debunk for weeks.
              </p>
            </div>
          </section>

          {/* Mission / Vision */}
          <section id="mission" className="scroll-mt-28">
            <div className="grid grid-cols-1 gap-[clamp(1rem,3vw,1.75rem)] md:grid-cols-2 md:items-stretch md:gap-8 xl:gap-12 2xl:gap-14">
              <div className="flex flex-col rounded-[1.35rem] border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.07] to-transparent p-[clamp(1.25rem,4vw,1.85rem)] dark:from-emerald-500/12 dark:to-transparent xl:rounded-3xl xl:p-10 2xl:p-12">
                <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/14 px-2.5 py-1 text-emerald-800 dark:text-emerald-300 xl:mb-6 xl:px-3 xl:py-1.5">
                  <Target className="h-3.5 w-3.5 shrink-0 xl:h-4 xl:w-4" aria-hidden />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-xs xl:text-sm">
                    Mission
                  </span>
                </div>
                <p className={cn(aboutBodyPretty, "xl:text-lg xl:leading-relaxed 2xl:text-xl")}>
                  Restore trust in digital content by making verification fast, reliable, and usable
                  without a PhD in ML.
                </p>
              </div>
              <div className="flex flex-col rounded-[1.35rem] border border-primary/35 bg-gradient-to-b from-primary/[0.06] to-transparent p-[clamp(1.25rem,4vw,1.85rem)] dark:from-primary/12 dark:to-transparent xl:rounded-3xl xl:p-10 2xl:p-12">
                <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-primary/14 px-2.5 py-1 text-primary xl:mb-6 xl:px-3 xl:py-1.5">
                  <Eye className="h-3.5 w-3.5 shrink-0 xl:h-4 xl:w-4" aria-hidden />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-xs xl:text-sm">
                    Vision
                  </span>
                </div>
                <p className={cn("mb-3 font-medium text-foreground xl:mb-4 xl:text-lg 2xl:text-xl")}>
                  A web where:
                </p>
                <ul className={cn("space-y-2.5 xl:space-y-3.5", aboutBody)}>
                  <li className="text-pretty">Checking a clip or screenshot is as normal as spell-check.</li>
                  <li className="text-pretty">Misinformation loses reach before it becomes “common knowledge.”</li>
                  <li className="text-pretty">Platforms earn back attention through transparency, not confusion.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </article>

      <footer className="mt-16 border-t border-border/50 py-10 text-center text-sm text-muted-foreground xl:mt-20 xl:py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <p className="transition-colors hover:text-foreground">
            VerifAI © {new Date().getFullYear()} All rights reserved.
          </p>
          <nav
            aria-label="Footer"
            className="flex flex-wrap justify-center gap-6 sm:justify-end"
          >
            <Link href="/" className="transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="/analyze" className="transition-colors hover:text-primary">
              Scan
            </Link>
            <Link href="/reports" className="transition-colors hover:text-primary">
              Reports
            </Link>
            <span className="text-foreground/80" aria-current="page">
              About
            </span>
            <a href="#" className="transition-colors hover:text-primary">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-primary">
              Terms
            </a>
            <a href="#" className="transition-colors hover:text-primary">
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
