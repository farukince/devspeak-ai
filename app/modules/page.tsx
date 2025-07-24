import type { Metadata } from 'next'
import Link from 'next/link'
import Navigation from '../../components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Learning Modules - DevSpeak AI',
  description: 'Explore our AI-powered English learning modules designed specifically for developers',
}

const modules = [
  {
    id: 'standup',
    title: 'Stand-up Meetings',
    description: 'Practice daily stand-ups with AI teammates. Learn to communicate progress, blockers, and plans effectively.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: 'blue',
    difficulty: 'Beginner',
    duration: '15-20 min',
    features: ['Real-time conversation', 'Progress tracking', 'Feedback on clarity', 'Common phrases practice']
  },
  {
    id: 'interview',
    title: 'Technical Interviews',
    description: 'Simulate real interview scenarios. Practice explaining technical concepts and answering behavioral questions.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'green',
    difficulty: 'Intermediate',
    duration: '30-45 min',
    features: ['Mock interviews', 'Technical explanations', 'Behavioral questions', 'Confidence building']
  },
  {
    id: 'writing',
    title: 'Technical Writing',
    description: 'Improve documentation and technical writing skills. Get feedback on clarity, structure, and professional tone.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: 'purple',
    difficulty: 'Advanced',
    duration: '20-30 min',
    features: ['Documentation practice', 'Grammar correction', 'Style improvement', 'Professional tone']
  },
  {
    id: 'presentation',
    title: 'Technical Presentations',
    description: 'Master the art of presenting technical topics. Practice public speaking with AI audience feedback.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
      </svg>
    ),
    color: 'orange',
    difficulty: 'Intermediate',
    duration: '25-35 min',
    features: ['Presentation practice', 'Audience engagement', 'Confidence building', 'Delivery feedback']
  }
]



export default function Modules() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation currentPage="modules" />

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Learning Modules
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose from our comprehensive selection of AI-powered English learning modules designed specifically for developers.
          </p>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-2 gap-8">
          {modules.map((module) => (
            <Card key={module.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    {module.icon}
                  </div>
                  <Badge variant="secondary">
                    {module.difficulty}
                  </Badge>
                </div>
                
                <CardTitle className="text-xl mb-2">
                  {module.title}
                </CardTitle>
                
                <p className="text-muted-foreground mb-4">
                  {module.description}
                </p>
                
                <div className="flex items-center text-sm text-muted-foreground mb-4">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {module.duration}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-foreground mb-2">What you&apos;ll learn:</h4>
                  <ul className="space-y-1">
                    {module.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-muted-foreground">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button asChild className="w-full">
                  <Link href={`/modules/${module.id}`}>
                    Start Module
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-card/80 backdrop-blur-sm border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to start your learning journey?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Create an account to track your progress and unlock all features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Sign Up Free
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/demo">
                  Try Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
