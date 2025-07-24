'use client'

import { useState, useRef } from 'react'
import Navigation from '../../../components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

interface StandupFeedback {
  clarity: number;
  conciseness: number;
  impact: number;
  feedback: string;
}

export default function StandupModule() {
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [feedback, setFeedback] = useState<StandupFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const handleFeedback = async () => {
    if (!yesterday && !today && !blockers) {
      setFeedback({ clarity: 0, conciseness: 0, impact: 0, feedback: 'Please fill in at least one section.' });
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/standup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yesterday: yesterday || 'Not provided',
          today: today || 'Not provided',
          blockers: blockers || 'None'
        }),
      });
      if (!response.ok) { throw new Error(`API request failed`); }
      const result: StandupFeedback = await response.json();
      setFeedback(result);
      try {
        await fetch('/api/log-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module_type: 'standup',
            task_name: 'Daily Stand-up',
            scores: { clarity: result.clarity, conciseness: result.conciseness, impact: result.impact },
            user_input: { yesterday, today, blockers },
            ai_feedback: result.feedback
          }),
        });
      } catch (logError) { console.warn('Could not log session:', logError); }
      setTimeout(() => { feedbackRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
    } catch (error) {
      console.error('Error getting AI feedback:', error);
      setFeedback({ clarity: 0, conciseness: 0, impact: 0, feedback: 'Sorry, there was an error.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setYesterday(''); setToday(''); setBlockers(''); setFeedback(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold">Daily Stand-up Simulation</h1>
          <p className="text-lg text-muted-foreground">Practice your daily stand-up and get AI feedback.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Your Stand-up Update</CardTitle>
              <CardDescription>Fill in the sections below to get feedback.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <div className="space-y-6 flex-grow">
                <div>
                  <Label htmlFor="yesterday" className="text-sm font-medium mb-2 block">What I did yesterday</Label>
                  <Textarea id="yesterday" value={yesterday} onChange={(e) => setYesterday(e.target.value)} placeholder="e.g., Finished implementing the user authentication feature." className="h-28"/>
                </div>
                <div>
                  <Label htmlFor="today" className="text-sm font-medium mb-2 block">What I'll do today</Label>
                  <Textarea id="today" value={today} onChange={(e) => setToday(e.target.value)} placeholder="e.g., I will start working on the user profile page." className="h-28"/>
                </div>
                <div>
                  <Label htmlFor="blockers" className="text-sm font-medium mb-2 block">Blockers or challenges</Label>
                  <Textarea id="blockers" value={blockers} onChange={(e) => setBlockers(e.target.value)} placeholder="e.g., I'm blocked by the API team for the user data endpoint." className="h-28"/>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <Button onClick={handleFeedback} disabled={loading} className="flex-1">{loading ? 'Analyzing...' : 'Get Feedback'}</Button>
                <Button onClick={handleClear} variant="outline">Clear</Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="h-full">
            {loading && (<Card className="h-full"><CardContent className="h-full pt-6"><div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground"><p className="text-lg font-medium">Analyzing...</p></div></CardContent></Card>)}
            {feedback && !loading && (
              <div ref={feedbackRef} className="h-full">
                <Card className="bg-muted/50 h-full">
                  <CardHeader><CardTitle>AI Evaluation</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div><div className="flex justify-between mb-1 text-sm"><Label>Clarity</Label><span className="font-semibold">{feedback.clarity}/100</span></div><Progress value={feedback.clarity} /></div>
                      <div><div className="flex justify-between mb-1 text-sm"><Label>Conciseness</Label><span className="font-semibold">{feedback.conciseness}/100</span></div><Progress value={feedback.conciseness} /></div>
                      <div><div className="flex justify-between mb-1 text-sm"><Label>Impact</Label><span className="font-semibold">{feedback.impact}/100</span></div><Progress value={feedback.impact} /></div>
                    </div>
                    <div><Label className="font-semibold">Feedback</Label><p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{feedback.feedback}</p></div>
                  </CardContent>
                </Card>
              </div>
            )}
            {!feedback && !loading && (
              <Card className="border-dashed h-full">
                <CardContent className="h-full pt-6">
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                    <div className="text-2xl mb-3">🤖</div><p className="text-lg font-medium">AI Evaluation will appear here</p><p className="text-sm">Fill in your stand-up details on the left and click "Get Feedback" to see your scores.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}