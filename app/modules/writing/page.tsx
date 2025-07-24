'use client'

import { useState, useRef } from 'react'
import Navigation from '../../../components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

const WRITING_TYPES = [
    { value: 'documentation', label: 'Documentation', description: 'API docs, README files, code comments', placeholder: 'Write a clear explanation of how to use this API endpoint...' },
    { value: 'email', label: 'Professional Email', description: 'Team communication, project updates', placeholder: 'Write a professional email to your team about the project status...' },
    { value: 'technical-blog', label: 'Technical Blog Post', description: 'Tutorials, technical explanations', placeholder: 'Write a blog post explaining a technical concept...' },
    { value: 'pull-request', label: 'Pull Request Description', description: 'PR descriptions, commit messages', placeholder: 'Describe the changes in this pull request...' }
];

interface WritingFeedback {
  clarity: number;
  structure: number;
  tone: number;
  completeness: number;
  feedback: string;
}

export default function WritingModule() {
  const [selectedType, setSelectedType] = useState('')
  const [content, setContent] = useState('')
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null)
  const [loading, setLoading] = useState(false)
  const feedbackRef = useRef<HTMLDivElement>(null)

  // --- EKSİK OLAN FONKSİYONUN TAM VE DOĞRU HALİ ---
  const handleGetFeedback = async () => {
    if (!selectedType || !content.trim()) {
      setFeedback({ clarity: 0, structure: 0, tone: 0, completeness: 0, feedback: 'Please select a writing type and provide some content.' })
      return
    }

    setLoading(true)
    setFeedback(null)

    try {
      const response = await fetch('/api/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          writingType: selectedType,
          userContent: content,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const result: WritingFeedback = await response.json()
      setFeedback(result)
      
      try {
        const { feedback: feedbackText, ...scores } = result;
        await fetch('/api/log-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module_type: 'writing',
            task_name: selectedType,
            scores: scores,
            user_input: { content: content },
            ai_feedback: feedbackText,
          }),
        });
      } catch (logError) {
        console.warn('Could not log session to database:', logError);
      }

      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      console.error('Error getting feedback:', error)
      setFeedback({ clarity: 0, structure: 0, tone: 0, completeness: 0, feedback: 'Sorry, there was an error generating feedback.' })
    } finally {
      setLoading(false)
    }
  }
  // --- FONKSİYON SONU ---

  const handleClear = () => {
    setContent('')
    setFeedback(null)
  }

  const selectedTypeData = WRITING_TYPES.find(t => t.value === selectedType)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Technical Writing Practice</CardTitle>
            <CardDescription className="text-lg">Improve your technical writing skills with AI-powered feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="space-y-4">
                <Label className="text-base font-semibold">1. Select a Writing Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {WRITING_TYPES.map((type) => (
                    <Card 
                      key={type.value} 
                      onClick={() => { setSelectedType(type.value); setContent(''); setFeedback(null); }}
                      className={`cursor-pointer transition-all ${selectedType === type.value ? 'border-primary ring-2 ring-primary' : 'hover:shadow-md'}`}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{type.label}</CardTitle>
                        <CardDescription>{type.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {selectedType && (
                <div className="space-y-6 animate-in fade-in-50 duration-500">
                  <div className="space-y-4">
                    <Label htmlFor="content" className="text-base font-semibold">2. Write Your Content</Label>
                    <Textarea id="content" rows={12} placeholder={selectedTypeData?.placeholder || 'Start writing...'} value={content} onChange={(e) => setContent(e.target.value)} />
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={handleGetFeedback} disabled={loading || !content.trim()} className="flex-1">
                      {loading ? 'Analyzing...' : 'Get Feedback'}
                    </Button>
                    <Button onClick={handleClear} variant="outline">Clear</Button>
                  </div>
                </div>
              )}
            </div>

            {feedback && (
              <div ref={feedbackRef} className="mt-8">
                <Card className="bg-muted/50">
                  <CardHeader><CardTitle>AI Evaluation</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div><div className="flex justify-between mb-1"><Label>Clarity</Label><span className="font-semibold">{feedback.clarity}/100</span></div><Progress value={feedback.clarity} /></div>
                      <div><div className="flex justify-between mb-1"><Label>Structure</Label><span className="font-semibold">{feedback.structure}/100</span></div><Progress value={feedback.structure} /></div>
                      <div><div className="flex justify-between mb-1"><Label>Tone</Label><span className="font-semibold">{feedback.tone}/100</span></div><Progress value={feedback.tone} /></div>
                      <div><div className="flex justify-between mb-1"><Label>Completeness</Label><span className="font-semibold">{feedback.completeness}/100</span></div><Progress value={feedback.completeness} /></div>
                    </div>
                    <div>
                      <Label className="font-semibold">Feedback</Label>
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{feedback.feedback}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}