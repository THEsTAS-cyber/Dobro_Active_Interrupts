import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Out-of-window reminders: system notifications, sound, vibration and a blinking tab title.
 *
 * Browser rules this hook respects:
 *  - Notification.requestPermission() and AudioContext creation must happen inside a
 *    user gesture, so `prime()` is called from the "Начать сессию" click handler;
 *  - <audio> elements are often blocked in background tabs, while an AudioContext
 *    created during a gesture keeps working — so sounds are synthesized with oscillators;
 *  - navigator.vibrate is missing in iOS Safari — feature-detected, silently skipped.
 */
const BLINK_TEXT = '⏰ Пора отдохнуть! | Активные перерывы';

// Sound patterns per urgency level: [frequency Hz, duration s, oscillator type]
const PATTERNS = {
  0: [[660, 0.18, 'sine'], [880, 0.25, 'sine']],
  1: [[740, 0.15, 'triangle'], [740, 0.15, 'triangle'], [988, 0.3, 'triangle']],
  2: [[440, 0.2, 'square'], [330, 0.2, 'square'], [440, 0.2, 'square'], [330, 0.2, 'square'], [440, 0.4, 'square']],
};
const VIBRATION = [300, 120, 300, 120, 600];

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function useNotifications({ soundEnabled = true } = {}) {
  const audioRef = useRef(null);
  const blinkRef = useRef(null);
  const originalTitle = useRef(typeof document !== 'undefined' ? document.title : '');
  const [permission, setPermission] = useState(notificationsSupported() ? Notification.permission : 'unsupported');

  /** Must be called from a click/keypress handler. */
  const prime = useCallback(async ({ askPermission = true } = {}) => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx && !audioRef.current) audioRef.current = new Ctx();
      if (audioRef.current?.state === 'suspended') await audioRef.current.resume();
    } catch (error) {
      console.warn('[notify] audio unavailable', error);
    }
    if (askPermission && notificationsSupported() && Notification.permission === 'default') {
      try {
        setPermission(await Notification.requestPermission());
      } catch {
        /* old Safari: callback-based API, ignore */
      }
    }
  }, []);

  const playSound = useCallback(
    (level) => {
      const ctx = audioRef.current;
      if (!soundEnabled || !ctx) return;
      let t = ctx.currentTime + 0.05;
      for (const [freq, dur, type] of PATTERNS[level] || PATTERNS[0]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        // Short attack/release envelope avoids clicks.
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(level === 2 ? 0.25 : 0.18, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.02);
        t += dur + 0.08;
      }
    },
    [soundEnabled],
  );

  const stopBlink = useCallback(() => {
    if (blinkRef.current) {
      clearInterval(blinkRef.current);
      blinkRef.current = null;
      document.title = originalTitle.current;
    }
  }, []);

  const startBlink = useCallback(() => {
    if (blinkRef.current) return;
    originalTitle.current = document.title.startsWith('⏰') ? originalTitle.current : document.title;
    let on = false;
    blinkRef.current = setInterval(() => {
      on = !on;
      document.title = on ? BLINK_TEXT : originalTitle.current;
    }, 1000);
  }, []);

  /** Fires all reminder channels for a due break. */
  const remind = useCallback(
    (level, body) => {
      playSound(level);
      if (level === 2 && 'vibrate' in navigator) navigator.vibrate(VIBRATION);
      if (document.hidden) startBlink();
      if (notificationsSupported() && Notification.permission === 'granted' && document.hidden) {
        try {
          const n = new Notification('Пора сделать перерыв', {
            body,
            icon: `${import.meta.env.BASE_URL}favicon.svg`,
            tag: 'active-break', // replaces the previous reminder instead of stacking
            requireInteraction: level === 2,
          });
          n.onclick = () => {
            window.focus();
            n.close();
          };
        } catch (error) {
          console.warn('[notify] notification failed', error); // e.g. Android Chrome requires a Service Worker
        }
      }
    },
    [playSound, startBlink],
  );

  // Stop blinking as soon as the user returns to the tab.
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) stopBlink();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      stopBlink();
    };
  }, [stopBlink]);

  return { permission, prime, remind, stopBlink, playSound };
}
