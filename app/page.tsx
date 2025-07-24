import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "../components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "DevSpeak AI - English Learning for Developers",
  description:
    "Master English communication skills through AI-powered simulations designed for developers",
};

export default function Home() {
  const modules = [
    {
      title: "Stand-up Simulation",
      description:
        'Practice daily stand-up updates with AI feedback. Write your "What I did/What I\'ll do/Blockers" and get intelligent suggestions.',
      icon: (
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      href: "/modules/standup",
      color: "blue",
    },
    {
      title: "Interview",
      description:
        "Simulate real interview scenarios. Practice explaining technical concepts and answering behavioral questions.",
      icon: (
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      href: "/modules/interview",
      color: "green",
    },
    {
      title: "Code Review",
      description:
        "Learn to give and receive constructive feedback on code. Practice technical communication in review scenarios.",
      icon: (
        <svg
          className="w-8 h-8 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
      href: "/modules/code-review",
      color: "purple",
    },
    {
      title: "Writing",
      description:
        "Improve documentation and technical writing skills. Get feedback on clarity, structure, and professional tone.",
      icon: (
        <svg
          className="w-8 h-8 text-orange-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
      href: "/modules/writing",
      color: "orange",
    },
    {
      title: "Pair Programming",
      description:
        "Practice collaborative coding scenarios. Learn to communicate effectively while working with a partner.",
      icon: (
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      href: "/modules/pair-programming",
      color: "red",
    },
    {
      title: "Progress",
      description:
        "Track your learning journey and review your improvement over time. Analyze your communication patterns.",
      icon: (
        <svg
          className="w-8 h-8 text-indigo-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      href: "/modules/progress",
      color: "indigo",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation currentPage="home" />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Master English for
            <span className="text-primary"> Developers</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Practice real-world scenarios with AI-powered simulations. From
            stand-up meetings to technical interviews, build confidence in your
            English communication skills.
          </p>
        </div>

        {/* Module Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    {module.icon}
                  </div>
                  <Badge variant="secondary">{module.color}</Badge>
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  {module.title}
                </CardTitle>
                <CardDescription>
                  {module.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full group">
                  <Link href={module.href}>
                    Start Module
                    <svg
                      className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to improve your English skills?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Choose a module above to start your learning journey with DevSpeak
            AI.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">
              Start Learning Today
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card/80 backdrop-blur-sm border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                DevSpeak AI
              </h3>
              <p className="text-muted-foreground">
                Empowering developers to communicate confidently in English
                through AI-powered simulations.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">
                Modules
              </h4>
              <ul className="space-y-2">
                <li>
                  <Button variant="link" asChild className="h-auto p-0">
                    <Link href="/modules/standup">
                      Stand-up Meetings
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="link" asChild className="h-auto p-0">
                    <Link href="/modules/interview">
                      Technical Interviews
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="link" asChild className="h-auto p-0">
                    <Link href="/modules/code-review">
                      Code Review
                    </Link>
                  </Button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">
                Company
              </h4>
              <ul className="space-y-2">
                <li>
                  <Button variant="link" asChild className="h-auto p-0">
                    <Link href="/about">
                      About
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="link" asChild className="h-auto p-0">
                    <Link href="/contact">
                      Contact
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="link" asChild className="h-auto p-0">
                    <Link href="/privacy">
                      Privacy
                    </Link>
                  </Button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">
                Support
              </h4>
              <ul className="space-y-2">
                <li>
                  <Button variant="link" asChild className="h-auto p-0">
                    <Link href="/help">
                      Help Center
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="link" asChild className="h-auto p-0">
                    <Link href="/feedback">
                      Feedback
                    </Link>
                  </Button>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-muted-foreground">
              © 2025 DevSpeak AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
