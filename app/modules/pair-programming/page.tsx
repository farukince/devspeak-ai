'use client';

import { useState, useEffect } from 'react';
import Navigation from '../../../components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

const tasks = [
    { id: 'binary-search', title: 'Implement a binary search function', description: 'Create an efficient binary search algorithm.'},
    { id: 'login-bug', title: 'Fix bug in login form', description: 'Debug and resolve authentication issues.'},
    { id: 'loading-state', title: 'Add loading state to the button', description: 'Implement loading spinner and disabled state.'}
];

// Tipleri tanımlıyoruz
interface DriverFeedback { correctness: number; efficiency: number; readability: number; feedback: string; }
interface NavigatorFeedback { clarity: number; effectiveness: number; precision: number; generatedCode: string; }
type AiFeedbackType = DriverFeedback | NavigatorFeedback;

export default function PairProgrammingPage() {
  const [selectedRole, setSelectedRole] = useState<'driver' | 'navigator' | null>(null);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [code, setCode] = useState('// Your code will appear here...');
  const [instruction, setInstruction] = useState('');
  const [feedback, setFeedback] = useState<AiFeedbackType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const currentTask = tasks.find(t => t.id === selectedTask);

  useEffect(() => {
    if (selectedRole === 'navigator') { setCode("// AI's code will appear here..."); setSelectedTask(''); } 
    else { setCode('// Start coding here...'); }
    setInstruction(''); setFeedback(null); setError('');
  }, [selectedRole]);

  const handleSubmit = async () => {
    let requestBody;
    if (selectedRole === 'driver') {
      if (!currentTask) { setError('Please select a task.'); return; }
      if (!code.trim()) { setError('Please write some code.'); return; }
      requestBody = { role: 'driver', task: currentTask.title, code };
    } else if (selectedRole === 'navigator') {
      if (!instruction.trim()) { setError('Please provide an instruction.'); return; }
      requestBody = { role: 'navigator', instruction };
    } else { setError('Please select a role.'); return; }

    setIsLoading(true); setError(''); setFeedback(null);

    try {
      const response = await fetch('/api/pair-programming', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Failed to get AI feedback'); }
      const data: AiFeedbackType = await response.json();
      setFeedback(data);
      
      let scores = {};
      let ai_feedback_text = '';
      let user_input = {};

      if (selectedRole === 'navigator' && 'generatedCode' in data) {
        const newCode = data.generatedCode.replace(/```(javascript|js)?/g, '').replace(/```/g, '').trim();
        setCode(prevCode => prevCode.includes("// AI's code will appear here...") ? newCode : `${prevCode}\n${newCode}`);
        setInstruction('');
        const { generatedCode, ...restScores } = data;
        scores = restScores;
        ai_feedback_text = `AI generated code based on instruction. Instruction Scores: Clarity(${data.clarity}), Effectiveness(${data.effectiveness}), Precision(${data.precision}).`;
        user_input = { instruction };
      } else if (selectedRole === 'driver' && 'feedback' in data) {
        const { feedback, ...restScores } = data;
        scores = restScores;
        ai_feedback_text = feedback;
        user_input = { code };
      }
      
      await fetch('/api/log-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_type: 'pair_programming',
          task_name: selectedRole === 'driver' ? currentTask?.title : `Navigator Session`,
          scores,
          user_input,
          ai_feedback: ai_feedback_text,
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-screen-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10"><h1 className="text-4xl font-bold">👥 Pair Programming Simulation</h1></div>
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>1. Choose Your Role</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-3">
                <Button variant={selectedRole === 'driver' ? 'default' : 'outline'} onClick={() => setSelectedRole('driver')} className="h-auto p-4 justify-start text-left"><div><div className="font-medium">🚗 Driver</div><div className="text-sm opacity-80 font-normal">I will write the code.</div></div></Button>
                <Button variant={selectedRole === 'navigator' ? 'default' : 'outline'} onClick={() => setSelectedRole('navigator')} className="h-auto p-4 justify-start text-left"><div><div className="font-medium">🧭 Navigator</div><div className="text-sm opacity-80 font-normal">I will give directions.</div></div></Button>
              </CardContent>
            </Card>
            <div className={selectedRole === 'navigator' ? 'opacity-50 pointer-events-none' : ''}>
              <Card><CardHeader><CardTitle>2. Select a Task</CardTitle><CardDescription>Required for Driver role</CardDescription></CardHeader><CardContent>{tasks.map((task) => (<div key={task.id} onClick={() => setSelectedTask(task.id)} className={`cursor-pointer rounded-lg border-2 p-4 mb-3 ${selectedTask === task.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}><p className="font-medium">{task.title}</p></div>))}</CardContent></Card>
            </div>
          </div>
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader><CardTitle>3. The Session</CardTitle></CardHeader>
              <CardContent>
                {!selectedRole ? (<div className="min-h-[300px] flex items-center justify-center text-center text-muted-foreground bg-muted/50 rounded-lg"><p>Please select a role to begin.</p></div>) : (
                  <div className="space-y-4">
                    {selectedRole === 'driver' && (<div><Label htmlFor="code-editor" className="mb-2 block font-medium">Your Code (Driver)</Label><Textarea id="code-editor" value={code} onChange={(e) => setCode(e.target.value)} className="w-full min-h-[400px] font-mono text-sm bg-gray-950 text-gray-300 border-gray-700 rounded-md" spellCheck={false} /></div>)}
                    {selectedRole === 'navigator' && (<div className="space-y-4"><div><Label className="mb-2 block">AI's Code (Driver)</Label><div className="w-full min-h-[300px] font-mono text-sm bg-gray-950 text-gray-300 border border-gray-700 rounded-md p-4 whitespace-pre-wrap">{code}</div></div><div><Label htmlFor="instruction-input" className="mb-2 block">Your Instruction (Navigator)</Label><Textarea id="instruction-input" value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="e.g., Create a function..." className="w-full min-h-[100px]" /></div></div>)}
                    <div className="flex justify-end pt-4"><Button onClick={handleSubmit} disabled={isLoading}>{isLoading ? 'Waiting...' : 'Submit to Partner'}</Button></div>
                  </div>)}
              </CardContent>
            </Card>
            {error && (<Card className="border-destructive"><CardHeader><CardTitle className="text-destructive">⚠️ Error</CardTitle></CardHeader><CardContent><p className="text-destructive">{error}</p></CardContent></Card>)}
            {feedback && !isLoading && (
              <Card>
                <CardHeader><CardTitle>🤖 AI Partner's Feedback</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedRole === 'driver' && 'correctness' in feedback && (
                      <>
                        <div><div className="flex justify-between mb-1"><Label>Correctness</Label><span className="font-semibold">{feedback.correctness}/100</span></div><Progress value={feedback.correctness} /></div>
                        <div><div className="flex justify-between mb-1"><Label>Efficiency</Label><span className="font-semibold">{feedback.efficiency}/100</span></div><Progress value={feedback.efficiency} /></div>
                        <div><div className="flex justify-between mb-1"><Label>Readability</Label><span className="font-semibold">{feedback.readability}/100</span></div><Progress value={feedback.readability} /></div>
                        <div className="pt-4"><Label className="font-semibold">Feedback</Label><p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{feedback.feedback}</p></div>
                      </>
                    )}
                    {selectedRole === 'navigator' && 'clarity' in feedback && (
                      <>
                        <p className="text-sm text-muted-foreground">AI has evaluated your last instruction:</p>
                        <div><div className="flex justify-between mb-1"><Label>Clarity</Label><span className="font-semibold">{feedback.clarity}/100</span></div><Progress value={feedback.clarity} /></div>
                        <div><div className="flex justify-between mb-1"><Label>Effectiveness</Label><span className="font-semibold">{feedback.effectiveness}/100</span></div><Progress value={feedback.effectiveness} /></div>
                        <div><div className="flex justify-between mb-1"><Label>Precision</Label><span className="font-semibold">{feedback.precision}/100</span></div><Progress value={feedback.precision} /></div>
                      </>
                    )}
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