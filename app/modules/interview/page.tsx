'use client'

import { useState, useRef } from 'react'
import Navigation from '../../../components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress' 

const SAMPLE_QUESTIONS = {
  'Frontend Developer': [
    "Explain the difference between React's useState and useEffect hooks.",
    "What is the Virtual DOM in React and how does it improve performance?",
  ],
  'Backend Developer': [
    "What is the difference between SQL and NoSQL databases?",
    "Explain RESTful API design principles.",
  ]
};

// State yapısını sadeleştirdik
interface InterviewFeedback {
  accuracy: number;
  depth: number;
  clarity: number;
  feedback: string;
}

export default function InterviewModule() {
  const [selectedRole, setSelectedRole] = useState('')
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [interviewCompleted, setInterviewCompleted] = useState(false)
  
  const feedbackRef = useRef<HTMLDivElement>(null)

  const handleStartInterview = () => {
    if (!selectedRole) return;
    setInterviewStarted(true);
    setQuestionIndex(0);
    setCurrentAnswer('');
    setFeedback(null);
    setInterviewCompleted(false);
  }

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;
    setIsSubmitting(true);
    setFeedback(null);
    
    try {
      const questions = SAMPLE_QUESTIONS[selectedRole as keyof typeof SAMPLE_QUESTIONS];
      const currentQuestion = questions[questionIndex];
      
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, question: currentQuestion, answer: currentAnswer }),
      });
      if (!response.ok) { throw new Error('Failed to get AI evaluation'); }

      const result: InterviewFeedback = await response.json();
      setFeedback(result);
      
      const overallScore = Math.round((result.accuracy + result.depth + result.clarity) / 3);
      await fetch('/api/log-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_type: 'interview',
          task_name: currentQuestion,
          scores: { accuracy: result.accuracy, depth: result.depth, clarity: result.clarity, overall: overallScore },
          user_input: { answer: currentAnswer },
          ai_feedback: result.feedback,
        }),
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('An error occurred while getting feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }

  const handleNextQuestion = () => {
    const questions = SAMPLE_QUESTIONS[selectedRole as keyof typeof SAMPLE_QUESTIONS];
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(prev => prev + 1);
      setCurrentAnswer('');
      setFeedback(null);
    } else {
      setInterviewCompleted(true);
    }
  }

  const handleReset = () => {
    setInterviewStarted(false);
    setSelectedRole('');
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Technical Interview Simulation</CardTitle>
            <CardDescription className="text-lg">Practice with AI-powered questions and feedback</CardDescription>
          </CardHeader>
          
          <CardContent>
            {!interviewStarted ? (
              <div className="space-y-6">
                <Label>Select Your Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger><SelectValue placeholder="Choose a role..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                    <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleStartInterview} disabled={!selectedRole} className="w-full">Start Interview</Button>
              </div>
            ) : !interviewCompleted ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Interview Question</CardTitle>
                      <Badge variant="secondary">Question {questionIndex + 1}/{SAMPLE_QUESTIONS[selectedRole as keyof typeof SAMPLE_QUESTIONS].length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p>{SAMPLE_QUESTIONS[selectedRole as keyof typeof SAMPLE_QUESTIONS][questionIndex]}</p>
                  </CardContent>
                </Card>

                <div>
                  <Label htmlFor="answer" className="mb-2 block font-medium">Your Answer</Label>
                  <Textarea id="answer" rows={8} placeholder="Type your detailed answer here..." value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} />
                </div>
                
                {!feedback && (
                  <Button onClick={handleSubmitAnswer} disabled={isSubmitting || !currentAnswer.trim()} className="w-full">
                    {isSubmitting ? 'Evaluating Answer...' : 'Submit Answer'}
                  </Button>
                )}

                {/* --- YENİ, TUTARLI GERİ BİLDİRİM PANELİ --- */}
                {feedback && (
                  <div ref={feedbackRef}>
                    <Card className="bg-muted/50">
                      <CardHeader><CardTitle>AI Evaluation</CardTitle></CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1 text-sm"><Label>Technical Accuracy</Label><span className="font-semibold">{feedback.accuracy}/100</span></div>
                            <Progress value={feedback.accuracy} />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1 text-sm"><Label>Depth of Understanding</Label><span className="font-semibold">{feedback.depth}/100</span></div>
                            <Progress value={feedback.depth} />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1 text-sm"><Label>Clarity of Expression</Label><span className="font-semibold">{feedback.clarity}/100</span></div>
                            <Progress value={feedback.clarity} />
                          </div>
                        </div>
                        <div>
                          <Label className="font-semibold">Feedback</Label>
                          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{feedback.feedback}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {feedback && (
                  <Button onClick={handleNextQuestion} className="w-full">Next Question</Button>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold">Interview Complete!</h2>
                <p>You can review your full performance on the Progress Dashboard.</p>
                <Button onClick={handleReset} variant="outline">Start New Interview</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}