'use client'

import { useEffect, useState, useRef } from 'react'
import Navigation from '../../../components/Navigation'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'

const SAMPLE_QUESTIONS = {
  'Frontend': [
    "Explain the difference between React's useState and useEffect hooks.",
    "What is the Virtual DOM in React and how does it improve performance?",
    "Describe the CSS Box Model and how it differs from 'box-sizing: border-box'.",
    "How do you optimize a React application for performance?"
  ],
  'Backend': [
    "What is the difference between SQL and NoSQL databases?",
    "Explain RESTful API design principles.",
    "How would you handle authentication and authorization in a microservices architecture?",
    "Describe the concept of database sharding."
  ],
  'Fullstack': [
    "How does CORS work and why is it important?",
    "Explain the difference between Server-Side Rendering (SSR) and Client-Side Rendering (CSR).",
    "How would you design a rate limiter for an API?",
    "What are WebSockets and when should you use them?"
  ],
  'DevOps': [
    "What is the difference between Docker and a Virtual Machine?",
    "Explain the concept of CI/CD pipelines.",
    "How do you ensure zero-downtime deployments?",
    "What is Infrastructure as Code (IaC)?"
  ]
};

interface InterviewFeedback {
  accuracy: number;
  depth: number;
  clarity: number;
  feedback: string;
  key_strengths: string[];
  areas_for_growth: string[];
  recommended_phrasing: string;
}

export default function InterviewModule() {
  const [selectedRole, setSelectedRole] = useState('Frontend')
  const [category, setCategory] = useState('Technical Deep Dive')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(300) // 5 minutes in seconds
  const [timerActive, setTimerActive] = useState(false)

  const feedbackRef = useRef<HTMLDivElement>(null)
  const questionRef = useRef<HTMLDivElement>(null)

  const {
    supported: ttsSupported,
    speaking,
    paused,
    speak,
    pause,
    resume,
    stop,
  } = useSpeechSynthesis({ rate: 1, pitch: 1, volume: 1 })

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  // Reset timer/question when role changes
  useEffect(() => {
    setQuestionIndex(0);
    setFeedback(null);
    setAnswer('');
    setTimer(300);
    setTimerActive(false);
  }, [selectedRole]);

  // Clean up speech synthesis
  useEffect(() => {
    if (!ttsSupported) return;
    const handlePageHide = () => { stop(); };
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      stop();
    };
  }, [ttsSupported, stop]);

  const currentQuestion = SAMPLE_QUESTIONS[selectedRole as keyof typeof SAMPLE_QUESTIONS]?.[questionIndex] || "Select a valid role to see questions.";

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setTimerActive(true);
    setAnswer('');
    setFeedback(null);
  };

  const handleRegenerateQuestion = () => {
    setQuestionIndex(prev => (prev + 1) % SAMPLE_QUESTIONS[selectedRole as keyof typeof SAMPLE_QUESTIONS].length);
    setAnswer('');
    setFeedback(null);
    setTimer(300);
    setTimerActive(false);
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setTimerActive(false);
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, question: currentQuestion, answer }),
      });

      if (!response.ok) throw new Error('API request failed');

      const result: InterviewFeedback = await response.json();
      setFeedback(result);

      // Auto-read feedback summary
      if (ttsSupported && result?.feedback) {
        speak(result.feedback);
      }

      // Log session
      const overallScore = Math.round((result.accuracy + result.depth + result.clarity) / 3);
      await fetch('/api/log-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_type: 'interview',
          task_name: currentQuestion,
          scores: { accuracy: result.accuracy, depth: result.depth, clarity: result.clarity, overall: overallScore },
          user_input: { answer },
          ai_feedback: result.feedback
        }),
      }).catch(console.warn);

      // Scroll to feedback
      /* setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); */

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen flex flex-col font-sans overflow-hidden">
      {/* Navigation */}
      <Navigation />

      <div className="flex-1 flex overflow-hidden max-w-[1920px] mx-auto w-full">
        {/* Left: Input & Config */}
        <section className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-y-auto px-6 py-6 md:px-8 border-r border-[#283039]">
          <div className="max-w-4xl mx-auto w-full space-y-8 pb-12">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Technical Interview Practice</h2>
              <p className="text-[#9dabb9] mt-2">Master professional communication and system design explanations.</p>
            </div>

            {/* Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#9dabb9] uppercase tracking-wider">Target Role</label>
                <div className="relative">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full h-12 bg-[#1c2127] border border-[#3b4754] rounded-lg px-4 appearance-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white cursor-pointer"
                  >
                    <option value="Frontend">Frontend Engineer</option>
                    <option value="Backend">Backend Engineer</option>
                    <option value="Fullstack">Fullstack Developer</option>
                    <option value="DevOps">DevOps Engineer</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 text-[#9dabb9] pointer-events-none">unfold_more</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#9dabb9] uppercase tracking-wider">Category</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-12 bg-[#1c2127] border border-[#3b4754] rounded-lg px-4 appearance-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white cursor-pointer"
                  >
                    <option>Technical Deep Dive</option>
                    <option>System Design</option>
                    <option>Behavioral</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 text-[#9dabb9] pointer-events-none">unfold_more</span>
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-gradient-to-br from-[#1c2127] to-[#111418] border border-[#3b4754] rounded-xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <span className="material-symbols-outlined text-6xl">psychology</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded uppercase tracking-widest">Question</span>
              </div>
              <h3 className="text-xl font-medium leading-relaxed font-mono text-white">
                "{currentQuestion}"
              </h3>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleRegenerateQuestion}
                  className="flex items-center gap-2 px-4 py-2 bg-[#283039] hover:bg-[#3b4754] rounded-lg text-white text-sm font-semibold transition-all"
                >
                  <span className="material-symbols-outlined text-lg">refresh</span>
                  Next Question
                </button>
              </div>
            </div>

            {/* Input Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#9dabb9] uppercase tracking-wider">Your Response</label>
                <div className="flex items-center gap-4 text-xs">
                  <span className={`flex items-center gap-1 ${timer < 60 ? 'text-red-400' : 'text-[#9dabb9]'}`}>
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {formatTime(timer)} remaining
                  </span>
                  <span className="flex items-center gap-1 text-[#9dabb9]">
                    <span className="material-symbols-outlined text-sm">text_fields</span>
                    {answer.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
              </div>
              <div className="relative">
                <textarea
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    if (!timerActive && e.target.value.length > 0) setTimerActive(true);
                  }}
                  className="w-full h-64 bg-[#1c2127] border border-[#3b4754] rounded-xl p-6 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder:text-[#3b4754] resize-none font-sans leading-relaxed"
                  placeholder="Start typing your answer here. The timer will start automatically..."
                ></textarea>

                {/* Voice UI - Placeholder for future STT */}
                {/* <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                <button className="size-10 bg-[#283039] hover:bg-white/10 rounded-full flex items-center justify-center transition-all">
                                    <span className="material-symbols-outlined text-white">mic</span>
                                </button>
                            </div> */}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !answer.trim()}
                className="w-full py-4 bg-primary hover:bg-blue-600 rounded-xl text-white font-bold text-lg transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Analyzing Answer...</span>
                  </>
                ) : (
                  <>
                    <span>Submit for Analysis</span>
                    <span className="material-symbols-outlined">bolt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Right: Feedback Panel */}
        <section className="w-full md:w-[450px] bg-[#0c1117] border-l border-[#283039] h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar" ref={feedbackRef}>
          {loading && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="size-16 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <p className="text-white font-medium">Gemini is analyzing your technical accuracy and clarity...</p>
            </div>
          )}

          {!feedback && !loading && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 text-[#9dabb9]">
              <span className="material-symbols-outlined text-4xl opacity-50">analytics</span>
              <p>Submit your answer to see a detailed analysis here.</p>
            </div>
          )}

          {feedback && !loading && (
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  AI Evaluation
                </h2>
                <span className="text-[10px] font-bold text-[#9dabb9] bg-[#1c2127] px-2 py-1 rounded border border-[#283039]">GEMINI 1.5 PRO</span>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Accuracy', value: feedback.accuracy, color: 'primary' },
                  { label: 'Depth', value: feedback.depth, color: '#22c55e' },
                  { label: 'Clarity', value: feedback.clarity, color: '#f59e0b' }
                ].map((score, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 p-3 bg-[#1c2127] rounded-xl border border-[#3b4754]">
                    <div className="relative size-14">
                      <svg className="size-14 transform -rotate-90">
                        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-[#283039]" />
                        <circle
                          cx="28" cy="28" r="24"
                          stroke={score.color === 'primary' ? '#137fec' : score.color}
                          strokeWidth="4" fill="transparent"
                          strokeDasharray={2 * Math.PI * 24}
                          strokeDashoffset={2 * Math.PI * 24 * (1 - score.value / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{score.value}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#9dabb9] uppercase tracking-tighter">{score.label}</span>
                  </div>
                ))}
              </div>

              {/* Insights */}
              <div className="space-y-6">

                {/* Strengths */}
                {feedback.key_strengths?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-[#9dabb9] flex items-center gap-2 uppercase tracking-widest">
                      <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                      Key Strengths
                    </h3>
                    <div className="space-y-2">
                      {feedback.key_strengths.map((str, i) => (
                        <div key={i} className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                          <p className="text-sm leading-relaxed text-green-100/90">{str}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Areas for Growth */}
                {feedback.areas_for_growth?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-[#9dabb9] flex items-center gap-2 uppercase tracking-widest">
                      <span className="material-symbols-outlined text-primary text-lg">lightbulb</span>
                      Areas for Growth
                    </h3>
                    <div className="space-y-2">
                      {feedback.areas_for_growth.map((area, i) => (
                        <div key={i} className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <p className="text-sm leading-relaxed text-blue-100/90">{area}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Phrasing */}
                {feedback.recommended_phrasing && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-[#9dabb9] flex items-center gap-2 uppercase tracking-widest">
                      <span className="material-symbols-outlined text-yellow-500 text-lg">forum</span>
                      Recommended Phrasing
                    </h3>
                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                      <p className="text-sm font-medium text-white/90 italic">"{feedback.recommended_phrasing}"</p>
                    </div>
                  </div>
                )}

                {/* Main Feedback Text */}
                <div className="pt-4 border-t border-[#283039]">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold text-[#9dabb9] uppercase">Detailed Summary</h4>
                    {ttsSupported && (
                      <button
                        onClick={() => speaking ? pause() : (paused ? resume() : speak(feedback.feedback))}
                        className="text-primary hover:text-white transition-colors flex items-center gap-1 text-xs font-bold"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {speaking && !paused ? 'pause' : 'volume_up'}
                        </span>
                        {speaking && !paused ? 'PAUSE' : 'LISTEN'}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-[#9dabb9] leading-relaxed whitespace-pre-wrap">
                    {feedback.feedback}
                  </p>
                </div>

              </div>
            </div>
          )}
        </section>
      </div>

      {/* Helper for material icons if not globally loaded */}
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    </div>
  );
}