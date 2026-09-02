import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { siteConfig } from "@/config/site"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={0}>
            <div className="relative flex min-h-screen flex-col">
              <div className="flex-1">{children}</div>

              <footer className="relative mt-auto border-t border-border/60 bg-background/80 backdrop-blur-sm">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-4">
                  <div className="sr-only">Handcrafted by Shubham Bundele</div>
                </div>
              </footer>

              <div className="pointer-events-none fixed bottom-6 right-6 z-30 flex justify-end animate-float" style={{ animationDuration: '8s' }}>
                <a href="https://www.linkedin.com/in/connectshubham23/" target="_blank" rel="noreferrer" className="site-watermark pointer-events-auto group" aria-label="Handcrafted by Shubham Bundele">
                  <div className="site-watermark__monogram-wrapper">
                    <span className="site-watermark__monogram shadow-inner">SB</span>
                    <div className="site-watermark__ring"></div>
                    <div className="site-watermark__glow"></div>
                  </div>
                  <span className="site-watermark__text flex items-center gap-1.5">
                    <span className="opacity-70 font-medium lowercase tracking-widest text-[0.55rem]">handcrafted by</span>
                    <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-[length:200%_auto] bg-clip-text text-transparent font-black tracking-[0.15em] animate-shimmer drop-shadow-sm">
                      SHUBHAM BUNDELE
                    </span>
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 ml-1 opacity-80 group-hover:rotate-[72deg] transition-all group-hover:opacity-100 group-hover:scale-125 duration-500">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </a>
              </div>
            </div>
          </TooltipProvider>
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
