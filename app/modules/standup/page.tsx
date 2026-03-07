'use client'

import { useEffect, useState, useRef } from 'react'
import Navigation from '../../../components/Navigation'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'

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
  const [autoReadEnabled, setAutoReadEnabled] = useState(true);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const {
    supported: ttsSupported,
    speaking,
    paused,
    speak,
    pause,
    resume,
    stop,
  } = useSpeechSynthesis({ rate: 1, pitch: 1, volume: 1 });

  useEffect(() => {
    if (!ttsSupported) return;
    const handlePageHide = () => { stop(); };
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      stop();
    };
  }, [ttsSupported, stop]);

  const handleFeedback = async () => {
    if (!yesterday && !today && !blockers) {
      // Simple validation feedback if needed
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

      if (ttsSupported && autoReadEnabled && result?.feedback) {
        speak(result.feedback);
      }

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

      // Scroll to feedback after a short delay to allow rendering
      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (error) {
      console.error('Error getting AI feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setYesterday('');
    setToday('');
    setBlockers('');
    setFeedback(null);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen flex flex-col font-sans">
      {/* Navigation placeholder or integration */}
      <Navigation />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 py-6 md:py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Daily Stand-up Simulator</h1>
              <p className="text-text-secondary text-base max-w-2xl">Practice your daily updates. Get instant AI feedback on clarity, conciseness, and impact.</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Input Zone */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Input 1: Yesterday */}
            <div className="bg-surface-dark border border-border-dark rounded-xl p-5 shadow-sm">
              <label className="flex flex-col gap-3 group">
                <div className="flex justify-between items-center">
                  <span className="text-white text-base font-semibold flex items-center gap-2">
                    <span className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                    Yesterday's Achievements
                  </span>
                </div>
                <textarea
                  value={yesterday}
                  onChange={(e) => setYesterday(e.target.value)}
                  className="w-full bg-[#111418] border border-input-border rounded-lg p-4 text-white placeholder:text-text-secondary/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none min-h-[120px] transition-all"
                  placeholder="What tasks did you complete yesterday? e.g., 'I finished the API integration...'"
                ></textarea>
              </label>
            </div>

            {/* Input 2: Today */}
            <div className="bg-surface-dark border border-border-dark rounded-xl p-5 shadow-sm">
              <label className="flex flex-col gap-3 group">
                <div className="flex justify-between items-center">
                  <span className="text-white text-base font-semibold flex items-center gap-2">
                    <span className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                    Today's Plan
                  </span>
                </div>
                <textarea
                  value={today}
                  onChange={(e) => setToday(e.target.value)}
                  className="w-full bg-[#111418] border border-input-border rounded-lg p-4 text-white placeholder:text-text-secondary/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none min-h-[120px] transition-all"
                  placeholder="What will you work on today? e.g., 'I plan to write unit tests...'"
                ></textarea>
              </label>
            </div>

            {/* Input 3: Blockers */}
            <div className="bg-surface-dark border border-border-dark rounded-xl p-5 shadow-sm">
              <label className="flex flex-col gap-3 group">
                <div className="flex justify-between items-center">
                  <span className="text-white text-base font-semibold flex items-center gap-2">
                    <span className="flex items-center justify-center size-6 rounded-full bg-red-500/10 text-red-400 text-xs font-bold">3</span>
                    Current Blockers
                  </span>
                </div>
                <textarea
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  className="w-full bg-[#111418] border border-input-border rounded-lg p-4 text-white placeholder:text-text-secondary/50 focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none resize-none min-h-[100px] transition-all"
                  placeholder="Any impediments? e.g., 'I am waiting for designs...'"
                ></textarea>
              </label>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleClear}
                className="text-text-secondary hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                Clear all
              </button>
              <button
                onClick={handleFeedback}
                disabled={loading}
                className="bg-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Analyzing...' : 'Submit for Review'}</span>
                {!loading && <span className="material-symbols-outlined text-[20px]">send</span>}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Feedback Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24" ref={feedbackRef}>

            {/* Loading State Placeholder */}
            {loading && (
              <div className="bg-surface-dark border border-border-dark rounded-xl p-10 flex flex-col items-center justify-center text-center animate-pulse">
                <div className="size-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
                <p className="text-white font-medium">Analyzing your update...</p>
                <p className="text-text-secondary text-sm mt-2">Checking for clarity, conciseness, and impact.</p>
              </div>
            )}

            {/* Empty State / Intro */}
            {!feedback && !loading && (
              <div className="bg-surface-dark border border-border-dark border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center">
                <div className="text-4xl mb-4">👋</div>
                <h3 className="text-white font-bold text-lg mb-2">Ready for Stand-up?</h3>
                <p className="text-text-secondary text-sm">Fill in your update on the left and click submit to get instant feedback.</p>
              </div>
            )}

            {/* Scorecard Section */}
            {feedback && !loading && (
              <>
                <div className="bg-surface-dark border border-border-dark rounded-xl p-6 shadow-md relative overflow-hidden group">
                  {/* Subtle decorative background gradient */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Performance Score</h3>
                    <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-sm font-bold border border-green-500/20">
                      {feedback.clarity > 80 && feedback.conciseness > 80 && feedback.impact > 80 ? 'Excellent' : 'Good'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    {/* Clarity Metric */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white font-medium">Clarity</span>
                        <span className="text-primary font-bold">{feedback.clarity}/100</span>
                      </div>
                      <div className="h-2 w-full bg-[#111418] rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${feedback.clarity}%` }}></div>
                      </div>
                    </div>

                    {/* Conciseness Metric */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white font-medium">Conciseness</span>
                        <span className="text-orange-400 font-bold">{feedback.conciseness}/100</span>
                      </div>
                      <div className="h-2 w-full bg-[#111418] rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full" style={{ width: `${feedback.conciseness}%` }}></div>
                      </div>
                    </div>

                    {/* Impact Metric */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white font-medium">Impact</span>
                        <span className="text-green-400 font-bold">{feedback.impact}/100</span>
                      </div>
                      <div className="h-2 w-full bg-[#111418] rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 rounded-full" style={{ width: `${feedback.impact}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Feedback Detail */}
                <div className="bg-surface-dark border border-border-dark rounded-xl flex flex-col shadow-md overflow-hidden">
                  <div className="p-5 border-b border-border-dark bg-[#1c2127] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-400">auto_awesome</span>
                      <h3 className="font-bold text-white">Gemini Analysis</h3>
                    </div>

                    {ttsSupported && (
                      <button
                        onClick={() => speaking ? pause() : (paused ? resume() : speak(feedback.feedback))}
                        className="text-text-secondary hover:text-white transition-colors flex items-center gap-1 text-xs font-medium"
                        title={speaking ? "Pause" : "Listen"}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {speaking && !paused ? 'pause_circle' : 'volume_up'}
                        </span>
                        {speaking && !paused ? 'Pause' : 'Listen'}
                      </button>
                    )}
                  </div>

                  <div className="p-6 overflow-y-auto max-h-[500px]">
                    <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                      {feedback.feedback}
                    </p>
                  </div>

                  <div className="p-4 bg-[#181c22] border-t border-border-dark">
                    <button
                      onClick={handleClear}
                      className="w-full py-2 rounded-lg border border-border-dark text-text-secondary hover:text-white hover:border-text-secondary transition-all text-sm font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Material Symbols Import (Ideally in head or layout, but included here for component isolation if needed) */}
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    </div>
  );
}