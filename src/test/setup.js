import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── localStorage mock ────────────────────────────────────────────────────────
const _store = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem:    (k)    => _store[k] ?? null,
    setItem:    (k, v) => { _store[k] = String(v); },
    removeItem: (k)    => { delete _store[k]; },
    clear:      ()     => { Object.keys(_store).forEach((k) => delete _store[k]); },
  },
  writable: true,
});

// ── matchMedia mock ──────────────────────────────────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    addEventListener:    vi.fn(),
    removeEventListener: vi.fn(),
  }),
});

// ── SpeechRecognition mock ───────────────────────────────────────────────────
const mockRecognition = {
  start:          vi.fn(),
  stop:           vi.fn(),
  abort:          vi.fn(),
  lang:           '',
  interimResults: false,
  maxAlternatives: 1,
  onresult:       null,
  onend:          null,
  onerror:        null,
};
global.SpeechRecognition        = vi.fn(() => mockRecognition);
global.webkitSpeechRecognition  = vi.fn(() => mockRecognition);
global.__mockRecognition        = mockRecognition;

// ── clipboard mock ───────────────────────────────────────────────────────────
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
});

// ── scrollIntoView mock (jsdom doesn't implement it) ─────────────────────────
window.HTMLElement.prototype.scrollIntoView = vi.fn();
