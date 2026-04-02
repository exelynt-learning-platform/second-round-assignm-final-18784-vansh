import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile, useSpeechRecognition } from '../../components/hooks';

// ── useIsMobile ───────────────────────────────────────────────────────────────
describe('useIsMobile', () => {
  it('returns false when window width >= 768', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true when window width < 768', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('updates when matchMedia fires a change event', () => {
    let handler;
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      addEventListener: (_, h) => { handler = h; },
      removeEventListener: vi.fn(),
    });
    const { result } = renderHook(() => useIsMobile());
    act(() => { handler({ matches: true }); });
    expect(result.current).toBe(true);
  });

  it('removes event listener on unmount', () => {
    const removeEventListener = vi.fn();
    window.matchMedia = () => ({
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener,
    });
    const { unmount } = renderHook(() => useIsMobile());
    unmount();
    expect(removeEventListener).toHaveBeenCalled();
  });
});

// ── useSpeechRecognition ──────────────────────────────────────────────────────
describe('useSpeechRecognition', () => {
  beforeEach(() => {
    global.__mockRecognition.start.mockClear();
    global.__mockRecognition.stop.mockClear();
    global.__mockRecognition.abort.mockClear();
    global.__mockRecognition.onresult = null;
    global.__mockRecognition.onend = null;
    global.__mockRecognition.onerror = null;
  });

  it('supported is true when SpeechRecognition exists', () => {
    const { result } = renderHook(() => useSpeechRecognition(vi.fn()));
    expect(result.current.supported).toBe(true);
  });

  it('listening starts as false', () => {
    const { result } = renderHook(() => useSpeechRecognition(vi.fn()));
    expect(result.current.listening).toBe(false);
  });

  it('start() sets listening to true and calls r.start()', () => {
    const { result } = renderHook(() => useSpeechRecognition(vi.fn()));
    act(() => { result.current.start(); });
    expect(result.current.listening).toBe(true);
    expect(global.__mockRecognition.start).toHaveBeenCalled();
  });

  it('stop() sets listening to false and calls r.stop()', () => {
    const { result } = renderHook(() => useSpeechRecognition(vi.fn()));
    act(() => { result.current.start(); });
    act(() => { result.current.stop(); });
    expect(result.current.listening).toBe(false);
    expect(global.__mockRecognition.stop).toHaveBeenCalled();
  });

  it('onresult calls the onResult callback with transcript', () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition(onResult));
    act(() => { result.current.start(); });
    act(() => {
      global.__mockRecognition.onresult({
        results: [[{ transcript: 'hello world' }]],
      });
    });
    expect(onResult).toHaveBeenCalledWith('hello world');
  });

  it('onend sets listening to false', () => {
    const { result } = renderHook(() => useSpeechRecognition(vi.fn()));
    act(() => { result.current.start(); });
    act(() => { global.__mockRecognition.onend(); });
    expect(result.current.listening).toBe(false);
  });

  it('onerror sets listening to false', () => {
    const { result } = renderHook(() => useSpeechRecognition(vi.fn()));
    act(() => { result.current.start(); });
    act(() => { global.__mockRecognition.onerror(); });
    expect(result.current.listening).toBe(false);
  });

  it('aborts recognition on unmount', () => {
    const { result, unmount } = renderHook(() => useSpeechRecognition(vi.fn()));
    act(() => { result.current.start(); });
    unmount();
    expect(global.__mockRecognition.abort).toHaveBeenCalled();
  });
});
