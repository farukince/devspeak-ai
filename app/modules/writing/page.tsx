'use client';

import { useState, useRef, useEffect } from 'react';
import Navigation from '../../../components/Navigation';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

interface WriterFeedback {
  clarity: number;
  structure: number;
  tone: number;
  completeness: number;
  feedback: string;
  suggestions: {
    title: string;
    description: string;
    type: 'tip' | 'warning' | 'refactor';
    original_text?: string;
    replacement_text?: string;
  }[];
}

const WRITING_TYPES = [
  { value: 'email', label: 'Technical Email', placeholder: "Subject: API Deprecation Warning..." },
  { value: 'blog-post', label: 'Blog Post', placeholder: "# How to Optimize React Performance..." },
  { value: 'documentation', label: 'Documentation', placeholder: "## Authentication Endpoint\n\nThis endpoint allows..." },
];

export default function WritingModule() {
  const [selectedType, setSelectedType] = useState('email');
  const [content, setContent] = useState('');
  const [feedback, setFeedback] = useState<WriterFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const feedbackRef = useRef<HTMLElement>(null);

  const { speak, pause, resume, stop, speaking, paused, supported: ttsSupported } = useSpeechSynthesis({ rate: 1, pitch: 1, volume: 1 });

  const handleGetFeedback = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setFeedback(null);
    stop();

    try {
      const response = await fetch('/api/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ writingType: selectedType, userContent: content }),
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setFeedback(data);

      if (ttsSupported && data.feedback) {
        speak(data.feedback);
      }

      // Log session
      await fetch('/api/log-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_type: 'writing',
          task_name: `Writing: ${selectedType}`,
          scores: data,
          user_input: { content },
          ai_feedback: data.feedback
        })
      }).catch(console.warn);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (original: string, replacement: string) => {
    if (!original || !replacement) return;
    setContent(prev => prev.replace(original, replacement));
  };

  const currentPlaceholder = WRITING_TYPES.find(t => t.value === selectedType)?.placeholder || "Start writing...";

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#111418] dark:text-white min-h-screen flex flex-col font-display overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#283039] px-6 py-3 bg-[#1c2127]/50 backdrop-blur-md z-10 flex-none h-16">
        <Navigation /> {/* Reusing Navigation component */}

        {/* Center: Type Selector */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex p-1 bg-[#1c2127] rounded-lg border border-[#283039]">
          {WRITING_TYPES.map((type) => (
            <label key={type.value} className="cursor-pointer">
              <input type="radio" className="hidden" checked={selectedType === type.value} onChange={() => { setSelectedType(type.value); setFeedback(null); }} />
              <div className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedType === type.value ? 'bg-primary text-white' : 'text-[#9dabb9] hover:text-white'}`}>
                {type.label}
              </div>
            </label>
          ))}
        </div>

        <div className="flex w-[100px]"></div> {/* Spacer for balance if needed */}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative h-[calc(100vh-64px)]">

        {/* Left: Editor */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#101922] relative">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 px-8 pt-8 pb-4 flex-none">
            <div className="flex items-center gap-2 text-sm text-[#9dabb9]">
              <span>Professional Writing</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-white">{WRITING_TYPES.find(t => t.value === selectedType)?.label}</span>
            </div>
            {/* Mock Title Input */}
            <input className="w-full bg-transparent border-none text-2xl md:text-4xl font-bold text-white placeholder-[#3b4754] focus:ring-0 px-0 py-2" placeholder="Enter document title..." type="text" />

            {/* Mock Formatting Toolbar */}
            <div className="flex items-center gap-1 border-b border-[#283039] pb-3 overflow-x-auto">
              {['format_bold', 'format_italic', 'link', 'format_h1', 'format_h2', 'code_blocks', 'format_list_bulleted'].map((icon, i) => (
                <button key={i} className="p-2 text-[#9dabb9] hover:text-white hover:bg-[#1c2127] rounded transition-colors flex-none">
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-20">
            <div className="flex gap-4 min-h-full">
              {/* Line Numbers Sim */}
              <div className="hidden md:flex flex-col gap-1 text-right font-mono text-sm text-[#3b4754] select-none pt-1">
                {Array.from({ length: 10 }).map((_, i) => <span key={i}>{i + 1}</span>)}
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 bg-transparent border-none focus:ring-0 text-lg leading-relaxed text-[#d0d7de] resize-none h-full outline-none font-display placeholder-[#3b4754] p-0"
                placeholder={currentPlaceholder}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#101922]/95 backdrop-blur border-t border-[#283039] px-8 py-2 flex justify-between items-center text-xs text-[#9dabb9] flex-none">
            <div className="flex gap-4">
              <span>markdown</span>
              <span>{content.split(/\s+/).filter(Boolean).length} words</span>
            </div>
            <button onClick={handleGetFeedback} disabled={loading || !content.trim()} className="text-primary hover:text-white font-bold disabled:opacity-50">
              {loading ? 'Analyzing...' : 'Analyze Writing'}
            </button>
          </div>
        </div>

        {/* Right: Analysis Sidebar */}
        <aside className="w-full md:w-[400px] border-l border-[#283039] bg-[#1c2127] flex flex-col shadow-xl flex-none z-20" ref={feedbackRef}>
          <div className="p-6 border-b border-[#283039] flex justify-between items-center flex-none">
            <div>
              <h3 className="text-white font-bold text-lg">Writing Analysis</h3>
              <p className="text-xs text-[#9dabb9]">Real-time feedback powered by Gemini</p>
            </div>
            <div className={`size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary ${loading ? 'animate-spin' : ''}`}>
              <span className="material-symbols-outlined text-lg">{loading ? 'sync' : 'auto_awesome'}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-8">
            {!feedback && !loading && (
              <div className="text-center text-[#9dabb9] text-sm mt-10">
                Write your content and click "Analyze Writing" to see feedback.
              </div>
            )}

            {feedback && (
              <>
                {/* Metrics */}
                <div className="flex flex-col gap-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#9dabb9]">Metrics</h4>
                  <MetricBar label="Clarity" value={feedback.clarity} color="bg-emerald-400" textColor="text-emerald-400" />
                  <MetricBar label="Structure" value={feedback.structure} color="bg-primary" textColor="text-primary" />
                  <MetricBar label="Tone" value={feedback.tone} color="bg-orange-400" textColor="text-orange-400" />
                  <MetricBar label="Completeness" value={feedback.completeness} color="bg-blue-400" textColor="text-blue-400" />
                </div>

                <hr className="border-[#283039]" />

                {/* Suggestions */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#9dabb9]">Suggestions</h4>
                    {ttsSupported && (
                      <button onClick={() => speaking ? pause() : (paused ? resume() : speak(feedback.feedback))} className="text-primary hover:text-white">
                        <span className="material-symbols-outlined text-sm">{speaking && !paused ? 'pause' : 'volume_up'}</span>
                      </button>
                    )}
                  </div>

                  {feedback.suggestions?.map((suggestion, i) => (
                    <div key={i} className="bg-[#111418] border border-[#283039] rounded-xl p-4 flex flex-col gap-3 group hover:border-primary/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className={`material-symbols-outlined text-lg mt-0.5 ${suggestion.type === 'warning' ? 'text-orange-400' : 'text-primary'}`}>
                          {suggestion.type === 'warning' ? 'warning' : 'lightbulb'}
                        </span>
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs font-medium uppercase tracking-wide ${suggestion.type === 'warning' ? 'text-orange-400' : 'text-primary'}`}>
                            {suggestion.title}
                          </span>
                          {suggestion.original_text && (
                            <p className="text-sm text-[#9dabb9] line-through decoration-white/20 select-all">{suggestion.original_text}</p>
                          )}
                        </div>
                      </div>
                      <div className="pl-8 flex flex-col gap-3">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-primary text-lg mt-0.5 transform rotate-90">subdirectory_arrow_right</span>
                          <p className="text-sm text-white font-medium">{suggestion.description}</p>
                        </div>
                        {suggestion.replacement_text && suggestion.original_text && (
                          <button
                            onClick={() => applySuggestion(suggestion.original_text!, suggestion.replacement_text!)}
                            className="w-full bg-[#283039] hover:bg-primary/20 hover:text-primary text-white text-xs font-medium py-1.5 px-3 rounded flex items-center justify-center gap-1 transition-colors mt-1"
                          >
                            <span className="material-symbols-outlined text-sm">check</span> Apply Fix: "{suggestion.replacement_text}"
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>
      </main>

      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    </div>
  );
}

function MetricBar({ label, value, color, textColor }: { label: string, value: number, color: string, textColor: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className={`text-xs font-bold ${textColor}`}>{value}%</span>
      </div>
      <div className="h-2 w-full bg-[#283039] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}