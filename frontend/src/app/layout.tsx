import type { Metadata } from "next";
import "./globals.css";
import { SiteChrome } from "@/components/site-chrome";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "JobQ",
  description: "Get in the queue.",
  icons: {
    icon: "/favicon-32.png",
    shortcut: "/favicon-32.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SiteChrome>{children}</SiteChrome>
          </ThemeProvider>
        </AppProvider>
      </body>
    </html>
  );
}
