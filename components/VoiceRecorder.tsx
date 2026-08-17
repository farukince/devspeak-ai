'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, RefreshCcw, Square } from 'lucide-react';

type RecorderState = 'idle' | 'recording' | 'uploading' | 'ready' | 'error';

export function VoiceRecorder({
  moduleType,
  scenarioId,
  maxDurationSeconds,
  onTranscript,
}: {
  moduleType: 'standup' | 'interview';
  scenarioId?: string | null;
  maxDurationSeconds: number;
  onTranscript: (result: { transcript: string; clientRequestId: string; durationSeconds: number }) => void;
}) {
  const [state, setState] = useState<RecorderState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const secondsRef = useRef(0);
  const requestIdRef = useRef<string | null>(null);

  const releaseMedia = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    releaseMedia();
  }, []);

  const upload = async (blob: Blob) => {
    setState('uploading');
    try {
      const clientRequestId = requestIdRef.current ?? crypto.randomUUID();
      const form = new FormData();
      form.append('audio', blob, `voice.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`);
      form.append('moduleType', moduleType);
      form.append('clientRequestId', clientRequestId);
      form.append('scenarioId', scenarioId ?? '');
      form.append('durationSeconds', String(Math.max(1, secondsRef.current)));
      const response = await fetch('/api/voice/transcribe', { method: 'POST', body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Audio transcription failed.');
      setState('ready');
      onTranscript({ transcript: payload.transcript, clientRequestId, durationSeconds: payload.durationSeconds });
    } catch (requestError) {
      setState('error');
      setError(requestError instanceof Error ? requestError.message : 'Audio transcription failed.');
    }
  };

  const startRecording = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setState('error');
      setError('Voice recording is not supported by this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferredType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm']
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      secondsRef.current = 0;
      setSeconds(0);
      requestIdRef.current = crypto.randomUUID();
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        releaseMedia();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        void upload(blob);
      };
      recorder.start(250);
      setState('recording');
      timerRef.current = window.setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        if (secondsRef.current >= maxDurationSeconds && recorder.state === 'recording') recorder.stop();
      }, 1000);
    } catch (mediaError) {
      releaseMedia();
      setState('error');
      setError(mediaError instanceof Error ? mediaError.message : 'Microphone access failed.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  return (
    <div className="rounded-lg border border-zinc-700 bg-black/30 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {state !== 'recording' ? (
          <button type="button" onClick={startRecording} disabled={state === 'uploading' || (moduleType === 'interview' && !scenarioId)} className="inline-flex items-center gap-2 rounded-md bg-violet-400 px-4 py-3 text-sm font-black text-black disabled:opacity-50">
            {state === 'error' ? <RefreshCcw className="size-4" /> : <Mic className="size-4" />}
            {state === 'error' ? 'Record Again' : state === 'ready' ? 'New Recording' : 'Start Recording'}
          </button>
        ) : (
          <button type="button" onClick={stopRecording} className="inline-flex items-center gap-2 rounded-md bg-red-400 px-4 py-3 text-sm font-black text-black"><Square className="size-4" /> Stop</button>
        )}
        <span className="text-sm font-bold text-zinc-300">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')} / {String(Math.floor(maxDurationSeconds / 60)).padStart(2, '0')}:{String(maxDurationSeconds % 60).padStart(2, '0')}</span>
        <span className="text-xs uppercase text-zinc-500">{state === 'uploading' ? 'Transcribing…' : state}</span>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </div>
  );
}
