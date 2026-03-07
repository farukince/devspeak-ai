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
    emoji: '🎯',
    color: 'from-primary/20 to-primary/5',
    difficulty: 'Beginner',
    duration: '15-20 min',
    features: ['Real-time conversation', 'Progress tracking', 'Feedback on clarity', 'Common phrases practice']
  },
  {
    id: 'interview',
    title: 'Technical Interviews',
    description: 'Simulate real interview scenarios. Practice explaining technical concepts and answering behavioral questions.',
    emoji: '💼',
    color: 'from-purple-500/20 to-purple-500/5',
    difficulty: 'Intermediate',
    duration: '30-45 min',
    features: ['Mock interviews', 'Technical explanations', 'Behavioral questions', 'Confidence building']
  },
  {
    id: 'writing',
    title: 'Technical Writing',
    description: 'Improve documentation and technical writing skills. Get feedback on clarity, structure, and professional tone.',
    emoji: '✍️',
    color: 'from-emerald-500/20 to-emerald-500/5',
    difficulty: 'Advanced',
    duration: '20-30 min',
    features: ['Documentation practice', 'Grammar correction', 'Style improvement', 'Professional tone']
  },
  {
    id: 'code-review',
    title: 'Code Review',
    description: 'Master the art of giving and receiving code feedback. Learn diplomatic communication for technical discussions.',
    emoji: '🔍',
    color: 'from-cyan-500/20 to-cyan-500/5',
    difficulty: 'Intermediate',
    duration: '25-35 min',
    features: ['Review practice', 'Diplomatic feedback', 'Technical clarity', 'Tone improvement']
  },
  {
    id: 'pair-programming',
    title: 'Pair Programming',
    description: 'Practice real-time communication while coding. Master explaining your thought process out loud.',
    emoji: '👥',
    color: 'from-pink-500/20 to-pink-500/5',
    difficulty: 'Intermediate',
    duration: '30-40 min',
    features: ['Live coding practice', 'Thought verbalization', 'Collaboration skills', 'Problem solving']
  },
  {
    id: 'networking',
    title: 'Professional Networking',
    description: 'Small talk and professional introductions for conferences. Make meaningful connections that count.',
    emoji: '🤝',
    color: 'from-primary/20 to-primary/5',
    difficulty: 'Beginner',
    duration: '15-25 min',
    features: ['Ice breakers', 'Conference talk', 'Follow-up emails', 'LinkedIn messages']
  }
]

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'Intermediate':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Advanced':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-cream-dark text-text-secondary';
  }
}

export default function Modules() {
  return (
    <div className="min-h-screen bg-warm-white dark:bg-background-dark">
      <Navigation />

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <span className="text-5xl mb-4 block">✨</span>
          <h1 className="text-4xl font-black tracking-tight mb-4">
            Learning <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">Modules</span>
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Choose from our comprehensive selection of AI-powered English learning modules designed specifically for developers.
          </p>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Card key={module.id} className="group border-cream-dark/50 dark:border-border-dark bg-cream dark:bg-surface-dark hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className={`size-14 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                    {module.emoji}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(module.difficulty)}`}>
                    {module.difficulty}
                  </span>
                </div>

                <CardTitle className="text-xl mb-2 text-foreground">
                  {module.title}
                </CardTitle>

                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                  {module.description}
                </p>

                <div className="flex items-center text-sm text-text-secondary">
                  <span className="mr-1">⏱️</span>
                  {module.duration}
                </div>
              </CardHeader>

              <CardContent>
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3">What you&apos;ll learn:</h4>
                  <ul className="space-y-2">
                    {module.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-text-secondary">
                        <span className="text-green-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button asChild className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-bold rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
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
      <div className="bg-cream dark:bg-surface-dark border-t border-cream-dark/40 dark:border-border-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <span className="text-4xl mb-4 block">🚀</span>
            <h2 className="text-3xl font-black tracking-tight mb-4">
              Ready to start your learning journey?
            </h2>
            <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
              Create an account to track your progress and unlock all features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-bold rounded-full px-8 shadow-lg shadow-primary/25">
                <Link href="/login">
                  Sign Up Free
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="rounded-full px-8 border-cream-dark/50 dark:border-border-dark hover:bg-cream-dark/30 dark:hover:bg-border-dark/50">
                <Link href="/">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
