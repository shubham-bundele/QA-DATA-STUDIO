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

              <div className="pointer-events-none fixed bottom-5 right-5 z-30 flex justify-end">
                <div className="site-watermark" aria-label="Handcrafted by Shubham Bundele">
                  <span className="site-watermark__monogram">SB</span>
                  <span className="site-watermark__text">Handcrafted by Shubham Bundele</span>
                </div>
              </div>
            </div>
          </TooltipProvider>
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
