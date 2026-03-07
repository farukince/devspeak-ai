import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "../styles/globals.css";

import { cn } from "@/lib/utils"; 
import { ThemeProvider } from "@/components/theme-provider";
import { ConfigureAmplifyClientSide } from "@/lib/amplifyConfig";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "DevSpeak AI",
  description: "Empowering developers to communicate confidently in English.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ConfigureAmplifyClientSide />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div style={{ zoom: 1.1 }}>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}