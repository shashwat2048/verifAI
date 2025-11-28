import { SignIn } from '@clerk/nextjs'
import Image from 'next/image'
import { Check } from 'lucide-react'

export default function Page() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Brand Panel */}
        <div className="hidden md:block space-y-8 p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Image src="/verifai_logo.png" alt="VerifAI" width={24} height={24} className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-foreground">VerifAI</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight text-foreground">
              Verify media authenticity with <span className="text-primary">confidence</span>.
            </h1>
            <p className="text-lg text-muted-foreground">
              Join thousands of users who trust VerifAI to detect deepfakes and verify digital content.
            </p>
          </div>

          <div className="space-y-4">
            {[
              "AI-powered deepfake detection",
              "Detailed authenticity reports",
              "Secure and private analysis",
              "History of past scans"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign In Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-primary/5">
            <SignIn
              fallbackRedirectUrl="/analyze"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none bg-transparent p-0 w-full",
                  headerTitle: "text-foreground font-bold text-xl",
                  headerSubtitle: "text-muted-foreground",
                  socialButtonsBlockButton: "bg-background border-border text-foreground hover:bg-muted",
                  socialButtonsBlockButtonText: "text-foreground font-medium",
                  dividerLine: "bg-border",
                  dividerText: "text-muted-foreground",
                  formFieldLabel: "text-foreground font-medium",
                  formFieldInput: "bg-background border-border text-foreground focus:border-primary focus:ring-primary/20",
                  footerActionText: "text-muted-foreground",
                  footerActionLink: "text-primary hover:text-primary/80",
                  formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
                  identityPreviewText: "text-foreground",
                  identityPreviewEditButton: "text-primary hover:text-primary/80"
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}