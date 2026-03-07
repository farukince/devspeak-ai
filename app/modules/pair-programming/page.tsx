'use client';

import { useState, useRef, useEffect } from 'react';
import Navigation from '../../../components/Navigation';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

interface FeedbackItem {
  title: string;
  description: string;
  type?: 'tip' | 'warning' | 'refactor';
  code?: string;
}

interface DriverFeedback {
  correctness: number;
  efficiency: number;
  readability: number;
  feedback: string;
  communication_tips?: FeedbackItem[];
  refactoring_suggestions?: FeedbackItem[];
  strategy_alerts?: FeedbackItem[];
}

interface NavigatorFeedback {
  clarity: number;
  effectiveness: number;
  precision: number;
  generatedCode: string;
  communication_tips?: FeedbackItem[];
}

type AiFeedbackType = DriverFeedback | NavigatorFeedback;

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const DEFAULT_CODE = `import json
import time

def process_data(payload):
    # Start by parsing the incoming JSON
    data = json.loads(payload)
    results = []
    
    for item in data['items']:
        if item.get('valid'):
            results.append(item)
            
    return results`;

export default function PairProgrammingModule() {
  const [role, setRole] = useState<'driver' | 'navigator'>('driver');
  const [code, setCode] = useState(DEFAULT_CODE);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [feedback, setFeedback] = useState<AiFeedbackType | null>(null);
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState('Implement a binary search function'); // Default task

  const { speak, pause, resume, stop, speaking, paused, supported: ttsSupported } = useSpeechSynthesis({ rate: 1, pitch: 1, volume: 1 });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset session on role change
    setFeedback(null);
    setChatHistory([]);
    setChatInput('');
    if (role === 'navigator') {
      setCode('# AI will write code here based on your instructions...');
      setTask(''); // Navigators give instructions, task is less relevant initially or derived from context
    } else {
      setCode(DEFAULT_CODE);
      setTask('Refactor this legacy data processing script');
    }
    stop();
  }, [role, stop]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmit = async () => {
    if (role === 'navigator' && !chatInput.trim()) return;
    if (role === 'driver' && !code.trim()) return;

    setLoading(true);
    const userMessage = role === 'navigator' ? chatInput : (chatInput || "Submitting current code for review...");

    // Add user message to chat
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage, timestamp }]);
    setChatInput('');

    const payload = role === 'driver'
      ? { role: 'driver', task, code }
      : { role: 'navigator', instruction: userMessage };

    try {
      const response = await fetch('/api/pair-programming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setFeedback(data);

      let aiResponseText = '';

      if (role === 'driver') {
        // Driver: AI gives feedback
        aiResponseText = (data as DriverFeedback).feedback;
      } else {
        // Navigator: AI writes code
        const navData = data as NavigatorFeedback;
        aiResponseText = "I've updated the code based on your instruction. How does this look?";
        if (navData.generatedCode) {
          setCode(navData.generatedCode);
        }
      }

      setChatHistory(prev => [...prev, { role: 'ai', text: aiResponseText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);

      if (ttsSupported) {
        speak(aiResponseText);
      }

      // Log session (simplified)
      await fetch('/api/log-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_type: 'pair_programming',
          task_name: role === 'driver' ? task : 'Navigator Session',
          scores: data,
          user_input: { code: role === 'driver' ? code : undefined, instruction: role === 'navigator' ? userMessage : undefined },
          ai_feedback: aiResponseText
        })
      }).catch(console.warn);


    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'ai', text: "Sorry, something went wrong processing your request.", timestamp }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-white min-h-screen flex flex-col font-display overflow-hidden">
      {/* Global Navigation */}
      <Navigation />

      {/* Module Sub-Header & Tools */}
      <header className="flex items-center justify-between border-b border-[#283039] bg-[#101922] px-6 py-3 flex-none h-14">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">groups</span>
          <h2 className="text-white text-base font-bold">Pair Programming</h2>
        </div>
        {/* Role Switcher */}
        <div className="flex w-64 items-center justify-center rounded-lg bg-[#1c2127] p-1 border border-[#283039]">
          <label className={`flex cursor-pointer h-8 grow items-center justify-center rounded-md px-2 text-xs font-bold uppercase tracking-wider transition-all ${role === 'driver' ? 'bg-primary text-white' : 'text-[#9dabb9] hover:text-white'}`}>
            <span>Driver</span>
            <input type="radio" className="hidden" checked={role === 'driver'} onChange={() => setRole('driver')} />
          </label>
          <label className={`flex cursor-pointer h-8 grow items-center justify-center rounded-md px-2 text-xs font-bold uppercase tracking-wider transition-all ${role === 'navigator' ? 'bg-primary text-white' : 'text-[#9dabb9] hover:text-white'}`}>
            <span>Navigator</span>
            <input type="radio" className="hidden" checked={role === 'navigator'} onChange={() => setRole('navigator')} />
          </label>
        </div>
        <div className="flex items-center gap-3 w-[100px]"></div> {/* Spacer */}
      </header>

      {/* 3-Column Layout */}
      <main className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">

        {/* LEFT: Code Editor */}
        <section className="flex flex-[2.5] flex-col border-r border-[#283039] bg-[#0d1117] overflow-hidden min-w-0">
          <div className="flex border-b border-[#283039] bg-[#161b22] px-2 gap-1 overflow-x-auto flex-none">
            <button className="flex items-center gap-2 border-b-2 border-primary bg-[#0d1117] px-4 py-2 text-sm font-medium text-white">
              <span className="material-symbols-outlined text-sm text-yellow-500">terminal</span>
              main.py
            </button>
            {/* Mock tabs */}
            <button className="flex items-center gap-2 border-b-2 border-transparent px-4 py-2 text-sm font-medium text-[#9dabb9] hover:bg-white/5">
              <span className="material-symbols-outlined text-sm text-blue-400">database</span>
              schema.sql
            </button>
          </div>

          <div className="flex-1 relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              readOnly={role === 'navigator'}
              className="w-full h-full bg-[#0d1117] p-4 font-mono text-sm text-[#e6edf3] resize-none focus:outline-none leading-6 custom-scrollbar"
              spellCheck={false}
            />
          </div>

          <div className="flex items-center justify-between border-t border-[#283039] bg-[#0d1117] p-3 flex-none">
            <div className="flex items-center gap-4 text-xs text-[#9dabb9]">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">code</span> Python 3.10</span>
              {role === 'driver' && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">edit</span> Editing...</span>}
              {role === 'navigator' && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">lock</span> Read Only</span>}
            </div>
          </div>
        </section>

        {/* CENTER: Communication Log */}
        <section className="flex flex-[1.5] flex-col border-r border-[#283039] bg-[#101922] overflow-hidden min-w-0">
          <div className="flex items-center justify-between border-b border-[#283039] p-4 flex-none bg-[#101922]">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">chat_bubble</span>
              Communication Log
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {chatHistory.length === 0 && (
              <div className="text-center text-[#9dabb9] text-sm mt-10 opacity-50">
                Start the session by {role === 'driver' ? 'submitting your code' : 'sending an instruction'}.
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-3 text-sm text-white shadow-lg ${msg.role === 'user' ? 'rounded-tr-none bg-primary' : 'rounded-tl-none bg-[#1c2127] border border-[#283039]'
                  }`}>
                  {msg.role === 'ai' && <p className="text-primary font-bold text-xs mb-1 uppercase">AI Partner</p>}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="mt-1 text-[10px] text-[#9dabb9] uppercase font-bold tracking-widest">
                  {msg.role === 'user' ? 'You' : 'Gemini'} • {msg.timestamp}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-[#283039] p-4 bg-[#101922] flex-none">
            <div className="relative">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                className="w-full rounded-lg bg-[#1c2127] border-[#283039] text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary p-3 pr-12 resize-none"
                placeholder={role === 'navigator' ? "Give an instruction to your AI partner..." : "Explain your logic or just submit current code..."}
                rows={3}
              ></textarea>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="absolute bottom-3 right-3 text-primary hover:text-white transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT: AI Feedback & Partner */}
        <section className="flex flex-1 flex-col bg-[#0d1117] overflow-y-auto custom-scrollbar min-w-0 border-l border-[#283039]">
          <div className="p-4 space-y-6">

            {feedback ? (
              <>
                {/* Metrics */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#9dabb9] mb-4">Performance Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {role === 'driver' && 'correctness' in feedback ? (
                      <>
                        <MetricCard label="Correctness" value={feedback.correctness} color="text-emerald-500" />
                        <MetricCard label="Efficiency" value={feedback.efficiency} color="text-primary" />
                      </>
                    ) : role === 'navigator' && 'clarity' in feedback ? (
                      <>
                        <MetricCard label="Clarity" value={feedback.clarity} color="text-emerald-500" />
                        <MetricCard label="Effectiveness" value={feedback.effectiveness} color="text-primary" />
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Tips & Suggestions */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#9dabb9] mb-4">AI Partner Suggestions</h3>
                  <div className="space-y-4">
                    {(feedback.communication_tips || []).map((tip, i) => (
                      <SuggestionCard key={i} title={tip.title} description={tip.description} icon="lightbulb" color="text-primary" borderColor="border-primary" />
                    ))}
                    {role === 'driver' && (feedback as DriverFeedback).refactoring_suggestions?.map((item, i) => (
                      <SuggestionCard key={`refactor-${i}`} title={item.title} description={item.description} icon="auto_fix_high" color="text-emerald-500" borderColor="border-emerald-500" code={item.code} />
                    ))}
                    {role === 'driver' && (feedback as DriverFeedback).strategy_alerts?.map((item, i) => (
                      <SuggestionCard key={`alert-${i}`} title={item.title} description={item.description} icon="warning" color="text-amber-500" borderColor="border-amber-500" />
                    ))}
                    {(!feedback.communication_tips?.length && !(feedback as DriverFeedback).refactoring_suggestions?.length) && (
                      <p className="text-sm text-[#9dabb9] italic">No specific suggestions at this time. Keep going!</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                <span className="material-symbols-outlined text-4xl text-[#283039]">analytics</span>
                <p className="text-[#9dabb9] text-sm">AI analysis will appear here after you submit.</p>
              </div>
            )}


          </div>
        </section>

      </main>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="rounded-xl border border-[#283039] bg-[#1c2127] p-4 text-center">
      <div className="relative inline-flex items-center justify-center mb-2">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle className="text-[#283039]" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4"></circle>
          <circle className={color} cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeDasharray="175" strokeDashoffset={175 - (175 * value) / 100} strokeWidth="4" strokeLinecap="round"></circle>
        </svg>
        <span className="absolute text-sm font-bold text-white">{value}%</span>
      </div>
      <p className="text-xs text-[#9dabb9] font-medium uppercase">{label}</p>
    </div>
  );
}

function SuggestionCard({ title, description, icon, color, borderColor, code }: { title: string, description: string, icon: string, color: string, borderColor: string, code?: string }) {
  return (
    <div className={`group rounded-xl border border-[#283039] bg-[#1c2127] p-4 hover:border-l-4 hover:${borderColor} transition-all cursor-pointer`}>
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
        <span className="text-xs font-bold uppercase">{title}</span>
      </div>
      <p className="text-xs text-white mb-3 leading-relaxed">{description}</p>
      {code && (
        <div className="bg-[#0d1117] p-3 font-mono text-[10px] border border-[#283039] rounded text-[#e6edf3] whitespace-pre-wrap">
          {code}
        </div>
      )}
    </div>
  );
}