import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

type Tile = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  onClick: () => void;
};

type TourStep = {
  title: string;
  description: string;
  targetId?: string;
};

const TOUR_SEEN_KEY = 'palindrome_ui_tour_v1_seen';

function safeGetTourSeen(): boolean {
  try {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(TOUR_SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

function safeSetTourSeen(): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TOUR_SEEN_KEY, '1');
  } catch {
    return;
  }
}

function toTileId(title: string) {
  return `tour-tile-${title.toLowerCase().replace(/\s+/g, '-')}`;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function TourOverlay(props: {
  open: boolean;
  stepIndex: number;
  steps: TourStep[];
  accentColor: string;
  isDark: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onDone: () => void;
}) {
  const { open, stepIndex, steps, accentColor, isDark, onBack, onNext, onSkip, onDone } = props;
  const step = steps[stepIndex];
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!open) return;

    const update = () => {
      if (!step?.targetId) {
        setRect(null);
        return;
      }
      const el = document.getElementById(step.targetId);
      if (!el) {
        setRect(null);
        return;
      }
      setRect(el.getBoundingClientRect());
    };

    const raf = requestAnimationFrame(() => {
      if (step?.targetId) {
        const el = document.getElementById(step.targetId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
      update();
      setTimeout(update, 260);
    });

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [open, step?.targetId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
      if (e.key === 'ArrowRight' || e.key === 'Enter') onNext();
      if (e.key === 'ArrowLeft') onBack();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onBack, onNext, onSkip]);

  if (!open || !step) return null;

  const isLast = stepIndex === steps.length - 1;
  const viewportW = typeof window === 'undefined' ? 1024 : window.innerWidth;
  const viewportH = typeof window === 'undefined' ? 768 : window.innerHeight;

  const highlightPad = 10;
  const highlight = rect
    ? {
        left: rect.left - highlightPad,
        top: rect.top - highlightPad,
        width: rect.width + highlightPad * 2,
        height: rect.height + highlightPad * 2,
      }
    : null;

  const tooltipW = Math.min(380, viewportW - 32);
  const tooltipH = 180;

  const baseLeft = highlight ? highlight.left + highlight.width / 2 - tooltipW / 2 : viewportW / 2 - tooltipW / 2;
  const preferTop = highlight ? highlight.top > viewportH * 0.6 : false;
  const baseTop = highlight
    ? preferTop
      ? highlight.top - tooltipH - 18
      : highlight.top + highlight.height + 18
    : viewportH / 2 - tooltipH / 2;

  const tooltipLeft = clamp(baseLeft, 16, viewportW - tooltipW - 16);
  const tooltipTop = clamp(baseTop, 16, viewportH - tooltipH - 16);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        fontFamily: 'Geist-Regular, system-ui',
      }}
    >
      {/* Spotlight mask with proper cutout using SVG mask */}
      {highlight ? (
        <svg
          style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <defs>
            <mask id="spotlight-mask">
              {/* Everything is white (visible) by default */}
              <rect width="100%" height="100%" fill="white" />
              {/* The highlighted area is black (transparent) */}
              <rect
                x={highlight.left}
                y={highlight.top}
                width={highlight.width}
                height={highlight.height}
                rx="20"
                fill="black"
              />
            </mask>
          </defs>
          {/* Apply the mask to create the spotlight effect */}
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.58)"
            mask="url(#spotlight-mask)"
            style={{ backdropFilter: 'blur(2px)' }}
          />
        </svg>
      ) : (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.58)',
            backdropFilter: 'blur(2px)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Highlight border (separate from the mask) */}
      {highlight ? (
        <div
          style={{
            position: 'fixed',
            left: highlight.left,
            top: highlight.top,
            width: highlight.width,
            height: highlight.height,
            borderRadius: 20,
            boxShadow: `0 0 0 2px ${accentColor}, 0 16px 40px rgba(0,0,0,0.35)`,
            background: 'transparent',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      ) : null}

      <div
        style={{
          position: 'fixed',
          left: tooltipLeft,
          top: tooltipTop,
          width: tooltipW,
          maxWidth: 'calc(100vw - 32px)',
          background: isDark ? 'rgba(10,10,28,0.96)' : 'rgba(255,255,255,0.96)',
          borderRadius: 18,
          padding: 16,
          boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
          border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.10)',
          color: isDark ? '#FFFFFF' : '#111111',
          zIndex: 3,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontFamily: 'Geist-Bold, system-ui', fontSize: 15, lineHeight: 1.2, color: isDark ? '#FFFFFF' : '#111111' }}>{step.title}</div>
          <div style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(17,17,17,0.6)' }}>
            {stepIndex + 1}/{steps.length}
          </div>
        </div>

        <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.45, color: isDark ? 'rgba(255,255,255,0.78)' : 'rgba(17,17,17,0.78)' }}>
          {step.description}
        </div>

        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onSkip}
            style={{
              border: isDark ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(17,17,17,0.16)',
              background: 'transparent',
              borderRadius: 12,
              padding: '10px 12px',
              cursor: 'pointer',
              fontFamily: 'Geist-Regular, system-ui',
              fontSize: 13,
              color: isDark ? '#FFFFFF' : '#111111',
            }}
          >
            Skip
          </button>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={onBack}
              disabled={stepIndex === 0}
              style={{
                border: isDark ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(17,17,17,0.16)',
                background: 'transparent',
                opacity: stepIndex === 0 ? 0.5 : 1,
                borderRadius: 12,
                padding: '10px 12px',
                cursor: stepIndex === 0 ? 'default' : 'pointer',
                fontFamily: 'Geist-Regular, system-ui',
                fontSize: 13,
                color: isDark ? '#FFFFFF' : '#111111',
              }}
            >
              Back
            </button>

            <button
              onClick={isLast ? onDone : onNext}
              style={{
                border: `1px solid ${accentColor}`,
                background: accentColor,
                color: '#FFFFFF',
                borderRadius: 12,
                padding: '10px 14px',
                cursor: 'pointer',
                fontFamily: 'Geist-Bold, system-ui',
                fontSize: 13,
              }}
            >
              {isLast ? 'Got it' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MainWeb() {
  const { theme, toggleTheme, colors } = useThemeContext();
  const isDark = theme === 'dark';

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  );
  const [displayName, setDisplayName] = useState('Player');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    void (async () => {
      const user = await authService.getSessionUser();
      const name = user?.displayName?.trim() || user?.email?.split('@')[0]?.trim() || 'Player';
      setDisplayName(name);
    })();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const showComingSoon = useCallback(() => setToast('Coming Soon'), []);

  const onSignOut = useCallback(async () => {
    await authService.signOut();
    router.replace('/');
  }, []);

  const steps: TourStep[] = useMemo(
    () => [
      {
        title: 'Quick Tour',
        description:
          'Here’s a 30-second walkthrough of the main options. You’ll only see this once.',
      },
      {
        title: 'Single Player',
        description:
          'Start a fresh match and play at your own pace. This is the best place to begin.',
        targetId: toTileId('Single Player'),
      },
      {
        title: 'Multiplayer',
        description:
          'Play with friends when Multiplayer is available. For now, you’ll see “Coming Soon”.',
        targetId: toTileId('Multiplayer'),
      },
      {
        title: 'Practice Mode',
        description:
          'A relaxed mode for learning patterns and warming up. This is also landing soon.',
        targetId: toTileId('Practice Mode'),
      },
      {
        title: 'Settings & Profile',
        description:
          'Update your profile and preferences, including sound and haptics.',
        targetId: toTileId('Settings'),
      },
    ],
    [],
  );

  const [tourOpen, setTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  useEffect(() => {
    if (safeGetTourSeen()) return;
    const t = setTimeout(() => setTourOpen(true), 450);
    return () => clearTimeout(t);
  }, []);

  const openTour = useCallback(() => {
    setTourStepIndex(0);
    setTourOpen(true);
  }, []);

  const finishTour = useCallback(() => {
    safeSetTourSeen();
    setTourOpen(false);
  }, []);

  const nextTour = useCallback(() => {
    setTourStepIndex((i) => {
      const next = i + 1;
      if (next >= steps.length) {
        finishTour();
        return i;
      }
      return next;
    });
  }, [finishTour, steps.length]);

  const backTour = useCallback(() => {
    setTourStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const skipTour = useCallback(() => {
    finishTour();
  }, [finishTour]);

  const tiles: Tile[] = useMemo(
    () => [
      {
        title: 'Single Player',
        subtitle: 'Start a new game',
        icon: 'person',
        gradient: ['#8ed9fc', '#3c8dea'],
        onClick: () => router.push('/gamelayout'),
      },
      {
        title: 'Multiplayer',
        subtitle: 'Play with friends',
        icon: 'people',
        gradient: ['#ffee60', '#ffa40b'],
        onClick: showComingSoon,
      },
      {
        title: 'Practice Mode',
        subtitle: 'Warm up and explore',
        icon: 'school',
        gradient: ['#C40111', '#F01D2E'],
        onClick: showComingSoon,
      },
      {
        title: 'Settings',
        subtitle: 'Profile and preferences',
        icon: 'settings',
        gradient: ['#111111', '#3C3C3C'],
        onClick: () => router.push('/profile'),
      },
    ],
    [showComingSoon],
  );

  const isCompact = windowWidth < 980;
  const isSingleColumn = windowWidth < 560;

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        color: colors.text,
        background: isDark ? 'linear-gradient(145deg, #000017 0%, #000074 100%)' : '#EEF3FF',
        fontFamily: 'Geist-Regular, system-ui',
        overflowX: 'hidden',
      }}
    >
      <style>{`
        @keyframes floaty {
          0% { transform: translate3d(0, 0, 0); opacity: 0.6; }
          50% { transform: translate3d(0, -14px, 0); opacity: 0.85; }
          100% { transform: translate3d(0, 0, 0); opacity: 0.6; }
        }
        @keyframes glow {
          0% { opacity: 0.35; filter: blur(0px); }
          50% { opacity: 0.65; filter: blur(1px); }
          100% { opacity: 0.35; filter: blur(0px); }
        }
        @keyframes toastIn {
          0% { transform: translate3d(0, 10px, 0); opacity: 0; }
          100% { transform: translate3d(0, 0, 0); opacity: 1; }
        }
        .menu-shell {
          width: 100%;
          max-width: 980px;
          padding: ${isCompact ? '20px 18px 34px' : '24px 22px 40px'};
          box-sizing: border-box;
          position: relative;
        }
        .ambient-orb {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          mix-blend-mode: ${isDark ? 'screen' : 'multiply'};
          opacity: ${isDark ? '0.55' : '0.35'};
          animation: glow 6s ease-in-out infinite;
          filter: blur(24px);
        }
        .orb-a { width: 320px; height: 320px; left: -120px; top: -120px; background: radial-gradient(circle at 30% 30%, rgba(142,217,252,0.85), rgba(60,141,234,0.0) 70%); }
        .orb-b { width: 360px; height: 360px; right: -160px; top: 40px; background: radial-gradient(circle at 60% 40%, rgba(255,238,96,0.85), rgba(255,164,11,0.0) 70%); animation-delay: 0.8s; }
        .orb-c { width: 380px; height: 380px; right: -200px; bottom: -220px; background: radial-gradient(circle at 40% 40%, rgba(195,93,217,0.65), rgba(195,93,217,0.0) 70%); animation-delay: 1.6s; }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px 14px;
          border-radius: 18px;
          background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.75)'};
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'};
          box-shadow: ${isDark ? '0 10px 24px rgba(0,0,0,0.25)' : '0 14px 30px rgba(0,0,0,0.06)'};
          backdrop-filter: blur(10px);
        }
        .brand {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .brand-title {
          font-family: Geist-Bold, system-ui;
          font-size: ${isCompact ? '18px' : '20px'};
          letter-spacing: 0.6px;
          color: ${isDark ? '#FFFFFF' : '#0060FF'};
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .brand-subtitle {
          margin-top: 3px;
          font-size: 12px;
          color: ${isDark ? 'rgba(255,255,255,0.78)' : 'rgba(17,17,17,0.65)'};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-shrink: 0;
        }
        .icon-btn {
          width: 42px;
          height: 42px;
          border-radius: 16px;
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'};
          background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)'};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 140ms ease, background-color 140ms ease;
        }
        .icon-btn:hover { transform: translateY(-1px); }
        .hero {
          margin-top: ${isCompact ? '16px' : '18px'};
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }
        .hero-left {
          min-width: 0;
        }
        .hero-title {
          font-family: Geist-Bold, system-ui;
          font-size: ${isCompact ? '24px' : '28px'};
          margin: 0;
          line-height: 1.12;
          color: ${isDark ? '#FFFFFF' : '#0A0F2D'};
          letter-spacing: -0.2px;
        }
        .hero-desc {
          margin: 8px 0 0;
          font-size: 13px;
          color: ${isDark ? 'rgba(255,255,255,0.74)' : 'rgba(17,17,17,0.65)'};
          max-width: 520px;
        }
        .tiles {
          margin-top: ${isCompact ? '14px' : '16px'};
          display: grid;
          grid-template-columns: ${isSingleColumn ? '1fr' : '1fr 1fr'};
          gap: ${isCompact ? '12px' : '14px'};
        }
        .tile {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          cursor: pointer;
          transform: translate3d(0,0,0);
          transition: transform 140ms ease, box-shadow 140ms ease;
          box-shadow: ${isDark ? '0 10px 22px rgba(0,0,0,0.22)' : '0 14px 30px rgba(0,0,0,0.08)'};
        }
        .tile:hover { transform: translateY(-2px); }
        .tile:active { transform: translateY(0px) scale(0.99); }
        .tile-inner {
          padding: ${isCompact ? '14px 14px' : '16px 16px'};
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: ${isCompact ? '110px' : '118px'};
        }
        .tile-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .tile-icon {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          background: rgba(255,255,255,0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tile-title {
          font-family: Geist-Bold, system-ui;
          font-size: ${isCompact ? '16px' : '17px'};
          color: #fff;
          margin: 0;
          line-height: 1.2;
        }
        .tile-subtitle {
          font-size: 12px;
          color: rgba(255,255,255,0.88);
          margin: 0;
          line-height: 1.35;
        }
        .tile-badge {
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(0,0,0,0.22);
          color: rgba(255,255,255,0.92);
          font-size: 11px;
          border: 1px solid rgba(255,255,255,0.18);
          flex-shrink: 0;
        }
        .spark {
          position: absolute;
          right: 12px;
          top: 10px;
          width: 46px;
          height: 46px;
          border-radius: 999px;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0.0) 70%);
          animation: floaty 4.2s ease-in-out infinite;
          pointer-events: none;
          opacity: 0.55;
        }
        .toast {
          position: fixed;
          left: 50%;
          bottom: 22px;
          transform: translateX(-50%);
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(17,17,17,0.92);
          color: #fff;
          font-size: 13px;
          box-shadow: 0 10px 26px rgba(0,0,0,0.25);
          animation: toastIn 140ms ease-out;
          min-width: 220px;
          text-align: center;
          border: 1px solid rgba(255,255,255,0.12);
        }
      `}</style>

      <div className="menu-shell">
        <div className="ambient-orb orb-a" />
        <div className="ambient-orb orb-b" />
        <div className="ambient-orb orb-c" />

        <div className="topbar">
          <div className="brand">
            <div className="brand-title">PALINDROME®</div>
            <div className="brand-subtitle">Welcome, {displayName}</div>
          </div>

          <div className="actions">
            <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={isDark ? '#FFFFFF' : '#0060FF'} />
            </button>
            <button className="icon-btn" onClick={openTour} aria-label="Open UI tour">
              <Ionicons name="help-circle-outline" size={20} color={isDark ? '#FFFFFF' : '#0060FF'} />
            </button>
            <button className="icon-btn" onClick={onSignOut} aria-label="Sign out">
              <Ionicons name="log-out-outline" size={20} color={isDark ? '#FFFFFF' : '#111111'} />
            </button>
          </div>
        </div>

        <div className="hero">
          <div className="hero-left">
            <h1 className="hero-title">Choose Your Mode</h1>
            <p className="hero-desc">Jump in fast. Multiplayer and Practice land soon.</p>
          </div>
        </div>

        <div className="tiles">
          {tiles.map((t) => (
            <div
              key={t.title}
              id={toTileId(t.title)}
              className="tile"
              onClick={t.onClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') t.onClick();
              }}
              style={{
                background: `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})`,
              }}
            >
              <div className="spark" />
              <div className="tile-inner">
                <div className="tile-row">
                  <div className="tile-icon">
                    <Ionicons name={t.icon} size={20} color="#FFFFFF" />
                  </div>
                  {t.title === 'Single Player' ? (
                    <div className="tile-badge">Play</div>
                  ) : t.title === 'Settings' ? (
                    <div className="tile-badge">Open</div>
                  ) : (
                    <div className="tile-badge">Soon</div>
                  )}
                </div>
                <div>
                  <p className="tile-title">{t.title}</p>
                  <p className="tile-subtitle">{t.subtitle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      <TourOverlay
        open={tourOpen}
        stepIndex={tourStepIndex}
        steps={steps}
        accentColor={colors.accent}
        isDark={isDark}
        onBack={backTour}
        onNext={nextTour}
        onSkip={skipTour}
        onDone={finishTour}
      />
    </div>
  );
}
