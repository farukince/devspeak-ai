'use client'

import { useState, useRef } from 'react'
import { CodeBlock, dracula, atomOneLight } from 'react-code-blocks'
import { useTheme } from 'next-themes'
import { X } from 'lucide-react'
import Navigation from '../../../components/Navigation'
import { Button } from '../../../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Progress } from '@/components/ui/progress'

const SAMPLE_CODE = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}`

const ROLE_OPTIONS = [
  { value: 'reviewer', label: '🔍 Reviewer', description: 'Review the sample code' },
  { value: 'author', label: '✍️ Author', description: 'Write your own code for review' },
]

interface ReviewerFeedback {
  constructiveness: number;
  specificity: number;
  tone: number;
  feedback: string;
}

interface AuthorFeedback {
  correctness: number;
  readability: number;
  bestPractices: number;
  feedback: string;
}

type AiFeedbackType = ReviewerFeedback | AuthorFeedback;

export default function CodeReviewModule() {
  const { theme } = useTheme()
  const [selectedRole, setSelectedRole] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [userCode, setUserCode] = useState('// Write your code here to get feedback...')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiFeedback, setAiFeedback] = useState<AiFeedbackType | null>(null)
  const [showInfoBanner, setShowInfoBanner] = useState(true)
  const feedbackRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async () => {
    if (selectedRole === 'reviewer' && !reviewText.trim()) return;
    if (selectedRole === 'author' && (!userCode.trim() || userCode.trim() === '// Write your code here to get feedback...')) return;

    setIsSubmitting(true);
    setAiFeedback(null);

    const requestBody = selectedRole === 'reviewer'
      ? { role: 'reviewer', userReview: reviewText, codeToReview: SAMPLE_CODE }
      : { role: 'author', codeToReview: userCode };

    try {
      const response = await fetch('/api/code-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data: AiFeedbackType = await response.json();
      setAiFeedback(data);

      const { feedback: feedbackText, ...scores } = data;
      try {
        await fetch('/api/log-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module_type: 'code_review',
            task_name: `Role: ${selectedRole}`,
            scores: scores,
            user_input: selectedRole === 'reviewer' ? { review: reviewText } : { code: userCode },
            ai_feedback: feedbackText,
          }),
        });
      } catch (logError) {
        console.warn('Could not log session to database:', logError);
      }
      
      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (error) {
      console.error('Error getting AI feedback:', error);
      setAiFeedback(null);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setShowInfoBanner(false);
    setAiFeedback(null);
  };

  const isSubmitDisabled = 
    !selectedRole || 
    (selectedRole === 'reviewer' && !reviewText.trim()) || 
    (selectedRole === 'author' && (!userCode.trim() || userCode.trim() === '// Write your code here to get feedback...')) || 
    isSubmitting;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold">Code Review Practice</h1>
            <p className="text-lg text-muted-foreground">Practice giving clear, professional feedback.</p>
        </div>
        
        <div className="mb-8">
            <Label className="mb-3 block text-lg font-medium">Select Your Role</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ROLE_OPTIONS.map((option) => (
                    <Card key={option.value} onClick={() => handleRoleSelect(option.value)}
                        className={`cursor-pointer transition-all ${selectedRole === option.value ? 'border-primary ring-2 ring-primary' : 'hover:shadow-md'}`}>
                        <CardHeader>
                            <CardTitle>{option.label}</CardTitle>
                            <CardDescription>{option.description}</CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>

        {selectedRole === 'reviewer' && (
          <>
            <div className="mb-8"><Label className="mb-3 block font-medium">Code to Review</Label><CodeBlock text={SAMPLE_CODE} language="javascript" theme={theme === 'dark' ? dracula : atomOneLight} showLineNumbers={true} /></div>
            <div className="mb-8">
              <Label htmlFor="review-text" className="mb-3 block font-medium">Write Your Review</Label>
              <div className="relative">
                <Textarea id="review-text" value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Write clear, constructive feedback here..." rows={8} />
                {reviewText && (
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setReviewText('')}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
        {selectedRole === 'author' && (
          <div className="mb-8">
            <Label htmlFor="user-code" className="mb-3 block font-medium">Write Your Code</Label>
            <div className="relative">
              <Textarea id="user-code" value={userCode} onChange={(e) => setUserCode(e.target.value)} placeholder="// Write your code here..." rows={12} className="font-mono bg-muted" />
              {userCode && userCode !== '// Write your code here to get feedback...' && (
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setUserCode('')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {selectedRole && <div className="mb-8"><Button onClick={handleSubmit} disabled={isSubmitDisabled} size="lg">{isSubmitting ? 'Submitting...' : 'Submit for Feedback'}</Button></div>}

        {aiFeedback && (
          <div ref={feedbackRef} className="mb-8">
            <Card className="bg-muted/50">
              <CardHeader><CardTitle>🤖 AI Evaluation</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {selectedRole === 'reviewer' && 'constructiveness' in aiFeedback && (
                    <>
                      <div><div className="flex justify-between mb-1"><Label>Constructiveness</Label><span className="font-semibold">{aiFeedback.constructiveness}/100</span></div><Progress value={aiFeedback.constructiveness} /></div>
                      <div><div className="flex justify-between mb-1"><Label>Specificity</Label><span className="font-semibold">{aiFeedback.specificity}/100</span></div><Progress value={aiFeedback.specificity} /></div>
                      <div><div className="flex justify-between mb-1"><Label>Tone</Label><span className="font-semibold">{aiFeedback.tone}/100</span></div><Progress value={aiFeedback.tone} /></div>
                    </>
                  )}
                  {selectedRole === 'author' && 'correctness' in aiFeedback && (
                     <>
                      <div><div className="flex justify-between mb-1"><Label>Correctness</Label><span className="font-semibold">{aiFeedback.correctness}/100</span></div><Progress value={aiFeedback.correctness} /></div>
                      <div><div className="flex justify-between mb-1"><Label>Readability</Label><span className="font-semibold">{aiFeedback.readability}/100</span></div><Progress value={aiFeedback.readability} /></div>
                      <div><div className="flex justify-between mb-1"><Label>Best Practices</Label><span className="font-semibold">{aiFeedback.bestPractices}/100</span></div><Progress value={aiFeedback.bestPractices} /></div>
                    </>
                  )}
                </div>
                <div>
                  <Label className="font-semibold">Feedback</Label>
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{aiFeedback.feedback}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}