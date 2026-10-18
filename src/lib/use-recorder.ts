import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "requesting" | "recording" | "paused" | "stopped" | "denied" | "unsupported";

/**
 * Browser microphone recorder. Audio chunks are kept IN MEMORY ONLY for the
 * lifetime of the page and are never uploaded or persisted by default.
 */
export function useRecorder(onChunk: (blob: Blob, elapsed: number) => void, chunkMs = 6000) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [hasAudio, setHasAudio] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const elapsedRef = useRef(0);
  const rafRef = useRef<number>(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const onChunkRef = useRef(onChunk);
  onChunkRef.current = onChunk;

  useEffect(() => {
    if (status !== "recording") return;
    const t = setInterval(() => { elapsedRef.current += 1; setElapsed(elapsedRef.current); }, 1000);
    return () => clearInterval(t);
  }, [status]);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
    streamRef.current = null; ctxRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => () => { recRef.current?.state !== "inactive" && recRef.current?.stop(); cleanup(); }, [cleanup]);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus("unsupported"); return;
    }
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += ((v - 128) / 128) ** 2;
        setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          setHasAudio(true);
          onChunkRef.current(e.data, elapsedRef.current);
        }
      };
      rec.start(chunkMs);
      recRef.current = rec;
      setStatus("recording");
    } catch {
      cleanup();
      setStatus("denied");
    }
  }, [chunkMs, cleanup]);

  const pause = () => { recRef.current?.pause(); setStatus("paused"); };
  const resume = () => { recRef.current?.resume(); setStatus("recording"); };
  const stop = () => { recRef.current?.stop(); cleanup(); setStatus("stopped"); };
  const discardAudio = () => { chunksRef.current = []; setHasAudio(false); };

  return { status, elapsed, level, hasAudio, start, pause, resume, stop, discardAudio };
}
