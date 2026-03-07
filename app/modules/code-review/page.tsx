'use client';

import { useState, useRef, useEffect } from 'react';
import Navigation from '../../../components/Navigation';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

interface Suggestion {
  title: string;
  description: string;
  type: 'tip' | 'warning' | 'refactor';
  icon: string;
}

interface ReviewerFeedback {
  constructiveness: number;
  specificity: number;
  tone: number;
  feedback: string;
  suggestions: Suggestion[];
}

interface AuthorFeedback {
  correctness: number;
  readability: number;
  bestPractices: number;
  feedback: string;
  suggestions: Suggestion[];
}

type AiFeedbackType = ReviewerFeedback | AuthorFeedback;

const SAMPLE_CODE_REVIEWER = `export const authenticate = (req, res, next) => {
 const token = req.headers['authorization'];
 if (!token) {
 return res.status(401).json({ message: 'No token provided' });
  }
 
 // TODO: Verify token logic needs improvement
 try {
 const decoded = jwt.verify(token, process.env.SECRET);
 req.user = decoded;
 next();
 }
}`;

const SAMPLE_CODE_AUTHOR_DEFAULT = `// Write your code here...
function calculateTotal(items) {
  return items.reduce((acc, item) => acc + item.price, 0);
}`;

export default function CodeReviewModule() {
  const [role, setRole] = useState<'reviewer' | 'author'>('reviewer');
  const [inputContent, setInputContent] = useState(''); // Review comment OR User code
  const [feedback, setFeedback] = useState<AiFeedbackType | null>(null);
  const [loading, setLoading] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const { speak, pause, resume, stop, speaking, paused, supported: ttsSupported } = useSpeechSynthesis({ rate: 1, pitch: 1, volume: 1 });

  // Reset state on role change
  useEffect(() => {
    setInputContent(role === 'author' ? SAMPLE_CODE_AUTHOR_DEFAULT : '');
    setFeedback(null);
    stop();
  }, [role, stop]);

  const handleSubmit = async () => {
    if (!inputContent.trim()) return;
    setLoading(true);
    setFeedback(null);

    const payload = role === 'reviewer'
      ? { role: 'reviewer', userReview: inputContent, codeToReview: SAMPLE_CODE_REVIEWER }
      : { role: 'author', codeToReview: inputContent };

    try {
      const response = await fetch('/api/code-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setFeedback(data);

      if (ttsSupported && data.feedback) {
        speak(data.feedback);
      }

      // Log session (simplified)
      await fetch('/api/log-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_type: 'code_review',
          task_name: role === 'reviewer' ? 'Auth Middleware Review' : 'Code Authoring',
          scores: data, // Logs all scores
          user_input: { content: inputContent },
          ai_feedback: data.feedback
        })
      }).catch(console.warn);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const currentCode = role === 'reviewer' ? SAMPLE_CODE_REVIEWER : inputContent;

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen flex flex-col font-display overflow-hidden">
      <Navigation />

      <main className="flex-1 flex flex-col w-full max-w-[1920px] mx-auto px-4 md:px-8 py-6 h-[calc(100vh-64px)] overflow-hidden">
        {/* Header & Role Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-none">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Code Review Practice</h1>
            <p className="text-[#9dabb9] mt-1">
              {role === 'reviewer' ? 'Critique the code below to improve your reviewing skills.' : 'Write code to get instant feedback on quality and best practices.'}
            </p>
          </div>

          <div className="bg-[#1c2127] rounded-lg p-1 flex items-center h-10 w-fit">
            <label className={`cursor-pointer flex items-center justify-center px-4 py-1.5 rounded-md transition-all text-sm font-medium ${role === 'reviewer' ? 'bg-primary text-white' : 'text-[#9dabb9] hover:text-white'}`}>
              <span className="mr-2 material-symbols-outlined text-[18px]">rate_review</span>
              <span>Reviewer</span>
              <input type="radio" className="hidden" checked={role === 'reviewer'} onChange={() => setRole('reviewer')} />
            </label>
            <label className={`cursor-pointer flex items-center justify-center px-4 py-1.5 rounded-md transition-all text-sm font-medium ${role === 'author' ? 'bg-primary text-white' : 'text-[#9dabb9] hover:text-white'}`}>
              <span className="mr-2 material-symbols-outlined text-[18px]">edit_note</span>
              <span>Author</span>
              <input type="radio" className="hidden" checked={role === 'author'} onChange={() => setRole('author')} />
            </label>
          </div>
        </div>

        {/* Main Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

          {/* LEFT PANEL: Workspace */}
          <div className="lg:col-span-8 flex flex-col gap-4 h-full min-h-0">
            {/* Code Viewer / Editor */}
            <div className={`rounded-xl border border-[#283039] bg-[#0d1117] overflow-hidden flex flex-col shadow-lg flex-1 min-h-0 ${role === 'author' ? 'ring-1 ring-primary/20' : ''}`}>
              <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#283039] flex-none">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#9dabb9] text-sm">code</span>
                  <span className="text-xs font-mono text-[#9dabb9]">
                    {role === 'reviewer' ? 'src/middleware/auth.ts' : 'sandbox.js'}
                  </span>
                </div>
                <span className="text-xs text-[#9dabb9] uppercase font-bold tracking-wider">
                  {role === 'reviewer' ? 'Read Only' : 'Editable'}
                </span>
              </div>

              <div className="relative flex-1 overflow-hidden">
                {role === 'reviewer' ? (
                  <pre className="p-4 font-mono text-sm overflow-auto h-full text-[#e6edf3] leading-6 custom-scrollbar">
                    {currentCode}
                  </pre>
                ) : (
                  <textarea
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    className="w-full h-full bg-[#0d1117] p-4 font-mono text-sm text-[#e6edf3] resize-none focus:outline-none leading-6 custom-scrollbar"
                    spellCheck={false}
                  />
                )}
              </div>
            </div>

            {/* Review Input (Only for Reviewer role) */}
            {role === 'reviewer' && (
              <div className="flex-none h-1/3 min-h-[150px] flex flex-col gap-2">
                <label className="text-sm font-medium text-[#9dabb9] flex items-center justify-between">
                  <span>Your Review Comment</span>
                  <span className="text-xs text-[#9dabb9]/70">Markdown supported</span>
                </label>
                <textarea
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  className="w-full h-full bg-[#1c2127] border border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary rounded-xl p-4 text-white placeholder:text-[#3b4754] resize-none font-display leading-relaxed"
                  placeholder="e.g., The error handling here seems a bit generic. Consider checking for specific JWT errors..."
                ></textarea>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-end pt-2 flex-none">
              <button
                onClick={handleSubmit}
                disabled={loading || !inputContent.trim()}
                className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span className="material-symbols-outlined">analytics</span>
                )}
                {loading ? 'Analyzing...' : 'Analyze Feedback'}
              </button>
            </div>
          </div>

          {/* RIGHT PANEL: AI Feedback */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pb-6" ref={feedbackRef}>
            {!feedback && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 border border-[#283039] rounded-xl border-dashed">
                <span className="material-symbols-outlined text-4xl text-[#3b4754]">psychology</span>
                <p className="text-[#9dabb9]">Submit your work to receive detailed AI analysis.</p>
              </div>
            )}

            {feedback && (
              <>
                {/* Overall Score Card */}
                <div className="bg-[#1c2127] border border-[#283039] rounded-xl p-6 relative overflow-hidden flex-none">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <span className="material-symbols-outlined text-9xl">psychology</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#9dabb9] text-sm font-medium uppercase tracking-wider">AI Assessment</h3>
                    {ttsSupported && (
                      <button onClick={() => speaking ? pause() : (paused ? resume() : speak(feedback.feedback))} className="text-primary hover:text-white">
                        <span className="material-symbols-outlined">{speaking && !paused ? 'pause' : 'volume_up'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Summary Score (Average) */}
                    <div className="relative size-24 flex-none">
                      <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-[#283039]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                        <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${((('constructiveness' in feedback ? feedback.constructiveness : feedback.correctness) + ('specificity' in feedback ? feedback.specificity : feedback.readability) + ('tone' in feedback ? feedback.tone : feedback.bestPractices)) / 3)}, 100`} strokeLinecap="round" strokeWidth="3"></path>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-3xl font-bold text-white">
                          {Math.round((('constructiveness' in feedback ? feedback.constructiveness : feedback.correctness) + ('specificity' in feedback ? feedback.specificity : feedback.readability) + ('tone' in feedback ? feedback.tone : feedback.bestPractices)) / 3)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-lg">Analysis Complete</span>
                      <p className="text-[#9dabb9] text-sm leading-tight mt-1 line-clamp-3">{feedback.feedback}</p>
                    </div>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="bg-[#1c2127] border border-[#283039] rounded-xl p-6 flex flex-col gap-5 flex-none">
                  <h3 className="text-[#9dabb9] text-sm font-medium uppercase tracking-wider">Detailed Metrics</h3>
                  {role === 'reviewer' && 'constructiveness' in feedback ? (
                    <>
                      <MetricBar label="Constructiveness" value={feedback.constructiveness} color="text-emerald-400" bgColor="bg-emerald-500" />
                      <MetricBar label="Specificity" value={feedback.specificity} color="text-primary" bgColor="bg-primary" />
                      <MetricBar label="Tone" value={feedback.tone} color="text-amber-400" bgColor="bg-amber-400" />
                    </>
                  ) : 'correctness' in feedback && (
                    <>
                      <MetricBar label="Correctness" value={feedback.correctness} color="text-emerald-400" bgColor="bg-emerald-500" />
                      <MetricBar label="Readability" value={feedback.readability} color="text-primary" bgColor="bg-primary" />
                      <MetricBar label="Best Practices" value={feedback.bestPractices} color="text-amber-400" bgColor="bg-amber-400" />
                    </>
                  )}
                </div>

                {/* Suggestions */}
                {feedback.suggestions?.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-[#9dabb9] text-sm font-medium uppercase tracking-wider mb-1">Suggestions</h3>
                    {feedback.suggestions.map((s, i) => (
                      <div key={i} className={`bg-[#1c2127]/50 border border-l-4 border-[#283039] p-4 rounded-r-lg hover:bg-[#1c2127] transition-colors group ${s.type === 'tip' ? 'border-l-primary' : s.type === 'warning' ? 'border-l-amber-400' : 'border-l-emerald-400'
                        }`}>
                        <div className="flex gap-3">
                          <div className={`mt-0.5 ${s.type === 'tip' ? 'text-primary' : s.type === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                            <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                          </div>
                          <div>
                            <h4 className={`text-white text-sm font-semibold mb-1 transition-colors ${s.type === 'tip' ? 'group-hover:text-primary' : s.type === 'warning' ? 'group-hover:text-amber-400' : 'group-hover:text-emerald-400'
                              }`}>{s.title}</h4>
                            <p className="text-[#9dabb9] text-xs leading-relaxed">{s.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

          </div>

        </div>
      </main>

      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    </div>
  );
}

function MetricBar({ label, value, color, bgColor }: { label: string, value: number, color: string, bgColor: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-white font-medium">{label}</span>
        <span className={`${color} font-bold`}>{value}/100</span>
      </div>
      <div className="h-2 w-full bg-[#111418] rounded-full overflow-hidden">
        <div className={`h-full ${bgColor} rounded-full transition-all duration-1000`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}