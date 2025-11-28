import { getUserFromCookies } from "@/lib/helper";
import { auth } from "@clerk/nextjs/server";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import HomeHeroActions from "@/components/ui/home-hero-actions";
import HomeCards from "@/components/ui/home-cards";
import WelcomeName from "@/components/ui/welcome-name";
import AccessGateBanner from "@/components/ui/access-gate-banner";

export default async function Home() {
  const user = await getUserFromCookies();
  const { userId: clerkId } = await auth();

  return (
    <div className="relative min-h-screen bg-background selection:bg-primary/20">
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 text-center space-y-8 relative z-10">
          <div className="flex justify-center">
            <AnimatedShinyText className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary shadow-[0_0_20px_rgba(96,34,237,0.15)]">
              Verify media authenticity with AI
            </AnimatedShinyText>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
            Not sure if an image is real? <span className="text-primary">We’ve got you.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            VerifAI scans images for signs of deepfakes or AI generation, returning an authenticity verdict, confidence score, and clear explanation you can trust.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <HomeHeroActions />
          </div>

          {user ? <div className="pt-4"><WelcomeName /></div> : null}

          <div className="sm:hidden pt-8">
            <AccessGateBanner />
          </div>
        </div>

        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />
        </div>
      </section>

      <HomeCards />

      <footer className="py-10 text-center text-sm text-muted-foreground border-t border-border/50 mt-20">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="hover:text-foreground transition-colors">VerifAI © {new Date().getFullYear()} All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// client component moved to components/ui/client-analyses-info
