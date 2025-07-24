import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "../styles/globals.css";

import { cn } from "@/lib/utils"; 
import { ThemeProvider } from "@/components/theme-provider";  

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
};