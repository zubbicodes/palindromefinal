"use client"

import { ColorBlindMode, useSettings } from "@/context/SettingsContext"
import { useThemeContext } from "@/context/ThemeContext"
import { useSound } from "@/hooks/use-sound"
import { Ionicons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { useRouter, useLocalSearchParams } from "expo-router"
import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Dimensions,
  Image,
  Pressable, // Keeps Pressable for unified event handling or allows simple onClick
  StyleSheet,
} from "react-native"
// react-native-svg works on web, usually maps to <svg>, but we can also use native <svg> if RN-SVG gives trouble. 
// However, sticking to RN-SVG is usually fine on web if setup correctly. The user snippet used Svg, let's stick to it or standard svg if safer.
// User snippet had Svg imports, let's keep them if they work, but standard SVG is safer for "pure web".
// Actually user snippet imports Svg from react-native-svg. I will try to use it, or fallback to standard svg if I can match styles.
import { authService } from "@/authService"
import { createInitialState } from "@/lib/gameEngine"
import { DEFAULT_GAME_GRADIENTS } from "@/lib/gameColors"
import { FIRST_MOVE_TIMEOUT_SECONDS, getMatch, subscribeToMatch, submitScore, updateLiveScore, type Match, type MatchPlayer } from "@/lib/matchmaking"
import Svg, { Defs, Stop, LinearGradient as SvgLinearGradient, Text as SvgText } from "react-native-svg"
import { Switch } from "react-native-switch"

const { width } = Dimensions.get("window")

// Responsive layout configuration based on screen size
const getLayoutConfig = () => {
  if (width >= 1920) {
    return {
      statusGap: 230,
      mainLayoutGap: 70,
      boardSize: 600,
      cellSize: 46,
      colorBlockWrapper: { width: 100, height: 570 },
      colorBlock: { width: 100, height: 98 },
      controlsBottom: 15,
      statusMargin: { top: 15, bottom: 15 },
    }
  } else if (width >= 1440) {
    return {
      statusGap: 165,
      mainLayoutGap: 50,
      boardSize: 520,
      cellSize: 40,
      colorBlockWrapper: { width: 85, height: 490 },
      colorBlock: { width: 85, height: 83 },
      controlsBottom: -5,
      statusMargin: { top: 30, bottom: 30 },
    }
  } else if (width >= 1366) {
    return {
      statusGap: 140,
      mainLayoutGap: 40,
      boardSize: 500,
      cellSize: 38,
      colorBlockWrapper: { width: 75, height: 440 },
      colorBlock: { width: 75, height: 73 },
      controlsBottom: 10,
      statusMargin: { top: 15, bottom: 15 },
    }
  } else {
    return {
      statusGap: 80,
      mainLayoutGap: 20,
      boardSize: Math.min(width * 0.7, 400),
      cellSize: 32,
      colorBlockWrapper: { width: 90, height: 400 },
      colorBlock: { width: 65, height: 63 },
      controlsBottom: 5,
      statusMargin: { top: 20, bottom: 20 },
    }
  }
}

const COLOR_BLIND_TOKENS: Record<ColorBlindMode, readonly string[]> = {
  symbols: ["●", "▲", "■", "◆", "★"],
  emojis: ["🍓", "🥑", "🫐", "🖤", "🍋"],
  cards: ["♥", "♣", "♦", "♠", "★"],
  letters: ["A", "B", "C", "D", "E"],
} as const

function getColorBlindToken(mode: ColorBlindMode, index: number) {
  return COLOR_BLIND_TOKENS[mode][index] ?? "?"
}

const DraggableBlock = ({
  colorIndex,
  gradient,
  count,
  layoutConfig,
  onDragStart,
}: {
  colorIndex: number
  gradient: readonly [string, string]
  count: number
  layoutConfig: any
  onDragStart: (colorIndex: number) => void
}) => {
  const { colorBlindEnabled, colorBlindMode } = useSettings()
  const [isDragging, setIsDragging] = useState(false)
  const token = colorBlindEnabled ? getColorBlindToken(colorBlindMode, colorIndex) : null

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (count > 0) {
      e.dataTransfer.setData("color", colorIndex.toString())
      e.dataTransfer.effectAllowed = "copy"
      setIsDragging(true)
      onDragStart(colorIndex)
    } else {
      e.preventDefault()
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <div
      style={{
        width: layoutConfig.colorBlock.width,
        height: layoutConfig.colorBlock.height,
        position: "relative",
        zIndex: isDragging ? 2000 : 1,
      }}
    >
      {/* Static Block (The Stack) */}
      {count > 1 && (
        <div
          style={{
            position: "absolute",
            width: layoutConfig.colorBlock.width,
            height: layoutConfig.colorBlock.height,
            borderRadius: 32,
            boxShadow: "none",
            overflow: "hidden",
            display: "flex",
          }}
        >
          <div
            style={{
              background: `linear-gradient(to right bottom, ${gradient[0]}, ${gradient[1]})`,
              width: "100%",
              height: "100%",
              borderRadius: 10,
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {token ? (
              <span
                style={{
                  position: "absolute",
                  top: 10,
                  left: 12,
                  color: "#fff",
                  fontWeight: "900",
                  fontSize: 18,
                  textShadow: "0 1px 4px rgba(0,0,0,0.45)",
                  userSelect: "none",
                }}
              >
                {token}
              </span>
            ) : null}
            <span
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: layoutConfig.colorBlock.width > 90 ? 24 : 20,
              }}
            >
              {count}
            </span>
          </div>
        </div>
      )}

      {/* Draggable Block */}
      <div
        draggable={count > 0}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          width: layoutConfig.colorBlock.width,
          height: layoutConfig.colorBlock.height,
          borderRadius: 32,
          boxShadow: "none",
          zIndex: isDragging ? 9999 : 2,
          opacity: count > 0 ? 1 : 0.5,
          cursor: count > 0 ? "grab" : "default",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Geist-Regular, system-ui",
        }}
      >
        <div
          style={{
            background: `linear-gradient(to right bottom, ${gradient[0]}, ${gradient[1]})`,
            width: "100%",
            height: "100%",
            borderRadius: 10,
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            userSelect: "none",
          }}
        >
          {token ? (
            <span
              style={{
                position: "absolute",
                top: 10,
                left: 12,
                color: "#fff",
                fontWeight: "900",
                fontSize: 18,
                textShadow: "0 1px 4px rgba(0,0,0,0.45)",
                userSelect: "none",
              }}
            >
              {token}
            </span>
          ) : null}
          <span
            style={{
              color: "#fff",
              fontWeight: "700",
              fontSize: layoutConfig.colorBlock.width > 90 ? 24 : 20,
              userSelect: "none",
            }}
          >
            {count}
          </span>
        </div>
      </div>
    </div>
  )
}

type GameTutorialMode = "modal" | "coach"

type GameTutorialStep = {
  title: string
  description: string
  targetId?: string
  mode: GameTutorialMode
  showBack?: boolean
  showPrimary?: boolean
  primaryLabel?: string
}

type GameTutorialPhase = "ui" | "placeFirst" | "makeScore" | "complete"

const GAME_TUTORIAL_SEEN_KEY = "palindrome_game_tutorial_v1_seen"

function safeGetGameTutorialSeen(): boolean {
  try {
    if (typeof window === "undefined") return true
    return window.localStorage.getItem(GAME_TUTORIAL_SEEN_KEY) === "1"
  } catch {
    return true
  }
}

function safeSetGameTutorialSeen(): void {
  try {
    if (typeof window === "undefined") return
    window.localStorage.setItem(GAME_TUTORIAL_SEEN_KEY, "1")
  } catch {
    return
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function GameTutorialOverlay(props: {
  open: boolean
  step: GameTutorialStep | null
  stepIndex: number
  stepsCount: number
  accentColor: string
  onBack: () => void
  onNext: () => void
  onSkip: () => void
  onDone: () => void
}) {
  const { open, step, stepIndex, stepsCount, accentColor, onBack, onNext, onSkip, onDone } = props
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!open) return

    const update = () => {
      if (!step?.targetId) {
        setRect(null)
        return
      }
      const el = document.getElementById(step.targetId)
      if (!el) {
        setRect(null)
        return
      }
      setRect(el.getBoundingClientRect())
    }

    const raf = requestAnimationFrame(() => {
      if (step?.targetId) {
        const el = document.getElementById(step.targetId)
        el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })
      }
      update()
      setTimeout(update, 240)
      setTimeout(update, 600)
    })

    const interval = window.setInterval(update, 160)
    const killInterval = window.setTimeout(() => window.clearInterval(interval), 1400)

    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(interval)
      window.clearTimeout(killInterval)
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update)
    }
  }, [open, step?.targetId])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip()
      if (e.key === "ArrowRight" || e.key === "Enter") onNext()
      if (e.key === "ArrowLeft") onBack()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onBack, onNext, onSkip])

  if (!open || !step) return null

  const isLast = stepIndex >= stepsCount - 1
  const viewportW = typeof window === "undefined" ? 1024 : window.innerWidth
  const viewportH = typeof window === "undefined" ? 768 : window.innerHeight
  const smallScreen = viewportW < 420 || viewportH < 520

  const highlightPad = 10
  const highlight = rect
    ? {
        left: rect.left - highlightPad,
        top: rect.top - highlightPad,
        width: rect.width + highlightPad * 2,
        height: rect.height + highlightPad * 2,
      }
    : null

  const tooltipW = smallScreen ? Math.max(240, viewportW - 32) : Math.min(420, viewportW - 32)
  const tooltipH = 190

  const baseLeft = highlight ? highlight.left + highlight.width / 2 - tooltipW / 2 : viewportW / 2 - tooltipW / 2
  const preferTop = highlight ? highlight.top > viewportH * 0.6 : false
  const baseTop = highlight
    ? preferTop
      ? highlight.top - tooltipH - 18
      : highlight.top + highlight.height + 18
    : viewportH / 2 - tooltipH / 2

  const tooltipLeft = smallScreen ? 16 : clamp(baseLeft, 16, viewportW - tooltipW - 16)
  const tooltipTop = smallScreen ? Math.max(16, viewportH - tooltipH - 16) : clamp(baseTop, 16, viewportH - tooltipH - 16)

  const blocksInteraction = step.mode === "modal"
  const showBack = step.showBack ?? false
  const showPrimary = step.showPrimary ?? true
  const primaryLabel = step.primaryLabel ?? (isLast ? "Continue" : "Next")

  return (
    <div
      role="dialog"
      aria-modal={blocksInteraction}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        fontFamily: "Geist-Regular, system-ui",
        pointerEvents: blocksInteraction ? "auto" : "none",
      }}
    >
      {highlight ? (
        <svg
          style={{
            position: "fixed",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <defs>
            <mask id="spotlight-mask-game">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={highlight.left}
                y={highlight.top}
                width={highlight.width}
                height={highlight.height}
                rx="22"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill={blocksInteraction ? "rgba(0,0,0,0.58)" : "rgba(0,0,0,0.35)"}
            mask="url(#spotlight-mask-game)"
            style={{ backdropFilter: "blur(2px)" }}
          />
        </svg>
      ) : (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: blocksInteraction ? "rgba(0,0,0,0.58)" : "rgba(0,0,0,0.35)",
            backdropFilter: "blur(2px)",
            pointerEvents: blocksInteraction ? "auto" : "none",
            zIndex: 1,
          }}
        />
      )}

      {highlight ? (
        <div
          style={{
            position: "fixed",
            left: highlight.left,
            top: highlight.top,
            width: highlight.width,
            height: highlight.height,
            borderRadius: 22,
            boxShadow: `0 0 0 2px ${accentColor}, 0 16px 40px rgba(0,0,0,0.35)`,
            background: "rgba(255,255,255,0.02)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      ) : null}

      <div
        style={{
          position: "fixed",
          left: tooltipLeft,
          top: tooltipTop,
          width: tooltipW,
          maxWidth: "calc(100vw - 32px)",
          background: "rgba(255,255,255,0.96)",
          borderRadius: 18,
          padding: 16,
          boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
          border: "1px solid rgba(0,0,0,0.10)",
          color: "#111111",
          pointerEvents: "auto",
          zIndex: 3,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontFamily: "Geist-Bold, system-ui", fontSize: 15, lineHeight: 1.2 }}>{step.title}</div>
          {stepsCount > 0 ? (
            <div style={{ fontSize: 12, color: "rgba(17,17,17,0.6)" }}>
              {Math.min(stepIndex + 1, stepsCount)}/{stepsCount}
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.45, color: "rgba(17,17,17,0.78)" }}>
          {step.description}
        </div>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <button
            onClick={onSkip}
            style={{
              border: "1px solid rgba(17,17,17,0.16)",
              background: "transparent",
              borderRadius: 12,
              padding: "10px 12px",
              cursor: "pointer",
              fontFamily: "Geist-Regular, system-ui",
              fontSize: 13,
            }}
          >
            Skip
          </button>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {showBack ? (
              <button
                onClick={onBack}
                disabled={stepIndex <= 0}
                style={{
                  border: "1px solid rgba(17,17,17,0.16)",
                  background: "transparent",
                  opacity: stepIndex <= 0 ? 0.5 : 1,
                  borderRadius: 12,
                  padding: "10px 12px",
                  cursor: stepIndex <= 0 ? "default" : "pointer",
                  fontFamily: "Geist-Regular, system-ui",
                  fontSize: 13,
                }}
              >
                Back
              </button>
            ) : null}

            {showPrimary ? (
              <button
                onClick={isLast ? onDone : onNext}
                style={{
                  border: `1px solid ${accentColor}`,
                  background: accentColor,
                  color: "#FFFFFF",
                  borderRadius: 12,
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontFamily: "Geist-Bold, system-ui",
                  fontSize: 13,
                }}
              >
                {primaryLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GameLayoutWeb() {
  const router = useRouter()
  const { matchId: routeMatchId, returnTo: routeReturnTo } = useLocalSearchParams<{ matchId?: string; returnTo?: string }>()
  const matchId = typeof routeMatchId === "string" ? routeMatchId : undefined
  const returnTo = typeof routeReturnTo === "string" ? routeReturnTo : Array.isArray(routeReturnTo) ? routeReturnTo[0] : undefined

  const { theme, colors, toggleTheme } = useThemeContext()
  const { soundEnabled, hapticsEnabled, colorBlindEnabled, colorBlindMode, customGameColors, setSoundEnabled, setHapticsEnabled, setColorBlindEnabled } = useSettings()
  const { playPickupSound, playDropSound, playErrorSound, playSuccessSound } = useSound()

  const [score, setScore] = useState(0)
  const [hints, setHints] = useState(2)
  const [time, setTime] = useState("00:00")
  const [bulldogPositions, setBulldogPositions] = useState<{ row: number; col: number }[]>([])
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [pause, setPause] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [userName, setUserName] = useState("John Doe")
  const [restartConfirmationVisible, setRestartConfirmationVisible] = useState(false)
  const [homeConfirmationVisible, setHomeConfirmationVisible] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [tutorialPhase, setTutorialPhase] = useState<GameTutorialPhase>("ui")
  const [tutorialUiIndex, setTutorialUiIndex] = useState(0)
  const [noHintsFaceVisible, setNoHintsFaceVisible] = useState(false)
  const noHintsFaceTimerRef = useRef<any>(null)

  const [opponentScore, setOpponentScore] = useState<number | null>(null)
  const [opponentName, setOpponentName] = useState<string>("Opponent")
  const [opponentAvatar, setOpponentAvatar] = useState<string | null>(null)
  const [multiplayerTimeLimit, setMultiplayerTimeLimit] = useState<number | null>(null)
  const [multiplayerJoinedAt, setMultiplayerJoinedAt] = useState<number | null>(null)
  const [multiplayerFirstMoveAt, setMultiplayerFirstMoveAt] = useState<number | null>(null)
  const [firstMoveCountdown, setFirstMoveCountdown] = useState<number | null>(null)
  const [scoreSubmitted, setScoreSubmitted] = useState(false)
  const [multiplayerMatch, setMultiplayerMatch] = useState<Match | null>(null)
  const multiplayerInitDone = useRef(false)
  const scoreRef = useRef(score)
  const multiplayerFirstMoveAtRef = useRef<number | null>(null)

  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (!hapticsEnabled) return
    if (typeof navigator === "undefined") return
    if (!("vibrate" in navigator)) return
    navigator.vibrate(pattern)
  }, [hapticsEnabled])

  const flashNoHintsFace = useCallback(() => {
    if (noHintsFaceTimerRef.current) {
      clearTimeout(noHintsFaceTimerRef.current)
      noHintsFaceTimerRef.current = null
    }
    setNoHintsFaceVisible(true)
    noHintsFaceTimerRef.current = setTimeout(() => {
      setNoHintsFaceVisible(false)
      noHintsFaceTimerRef.current = null
    }, 1200)
  }, [])

  useEffect(() => {
    return () => {
      if (noHintsFaceTimerRef.current) {
        clearTimeout(noHintsFaceTimerRef.current)
        noHintsFaceTimerRef.current = null
      }
    }
  }, [])

  const uiSteps: GameTutorialStep[] = [
    {
      title: "Welcome to Palindrome",
      description: "Quick tour of the screen, then we’ll practice one move together.",
      mode: "modal",
      showBack: true,
    },
    {
      title: "Score",
      description: "Your score increases when you create palindromes. Longer lines score higher.",
      targetId: "tour-game-status-score",
      mode: "modal",
      showBack: true,
    },
    {
      title: "Timer",
      description: "The timer starts with your first move. Use it to track your pace.",
      targetId: "tour-game-timer",
      mode: "modal",
      showBack: true,
    },
    {
      title: "Hints",
      description: "Use hints to highlight a strong move on the board when you get stuck.",
      targetId: "tour-game-status-hints",
      mode: "modal",
      showBack: true,
    },
    {
      title: "Blocks",
      description: "Drag a colored block from here onto an empty cell.",
      targetId: "tour-game-blocks",
      mode: "modal",
      showBack: true,
    },
    {
      title: "Game Board",
      description: "Place blocks to form palindromes in a row or column (3+ blocks).",
      targetId: "tour-game-board",
      mode: "modal",
      showBack: true,
    },
    {
      title: "Controls",
      description: "Play resumes, Pause stops the timer, Settings manages preferences.",
      targetId: "tour-game-btn-play",
      mode: "modal",
      showBack: true,
      primaryLabel: "Start Tutorial",
    },
  ]

  useEffect(() => {
    if (safeGetGameTutorialSeen()) return
    const t = setTimeout(() => {
      setTutorialPhase("ui")
      setTutorialUiIndex(0)
      setTutorialOpen(true)
    }, 450)
    return () => clearTimeout(t)
  }, [])

  const skipTutorial = useCallback(() => {
    safeSetGameTutorialSeen()
    setTutorialOpen(false)
  }, [])

  const doneTutorial = useCallback(() => {
    safeSetGameTutorialSeen()
    setTutorialOpen(false)
  }, [])

  const backTutorial = useCallback(() => {
    if (tutorialPhase !== "ui") return
    setTutorialUiIndex((i) => Math.max(0, i - 1))
  }, [tutorialPhase])

  const nextTutorial = useCallback(() => {
    if (tutorialPhase !== "ui") return
    setTutorialUiIndex((i) => {
      const next = i + 1
      if (next >= uiSteps.length) {
        setTutorialPhase("placeFirst")
        return i
      }
      return next
    })
  }, [tutorialPhase, uiSteps.length])

  const openTutorial = useCallback(() => {
    setTutorialPhase("ui")
    setTutorialUiIndex(0)
    setTutorialOpen(true)
  }, [])

  useEffect(() => {
    // Fetch user profile data from Supabase
    const fetchProfile = async () => {
      try {
        const user = await authService.getSessionUser();
        if (user) {
          // Try to load from cache first
          const cached = await authService.getCachedProfile(user.id);
          if (cached) {
            setUserName(cached.full_name || user.email?.split('@')[0] || 'User');
            setAvatar(cached.avatar_url);
          }

          // Fetch fresh profile data
          const profile = await authService.getProfile(user.id);
          if (profile) {
            setUserName(profile.full_name || user.email?.split('@')[0] || 'User');
            setAvatar(profile.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error fetching profile in game settings:', error);
      }
    };
    
    if (settingsVisible) {
      fetchProfile();
    }
    // Initial fetch on mount as well
    fetchProfile();
  }, [settingsVisible]);

  // Drag State
  const [dragOverCell, setDragOverCell] = useState<{ row: number; col: number } | null>(null)
  const [, setDraggedColor] = useState<number | null>(null)
  const [activeHint, setActiveHint] = useState<{ row: number; col: number; colorIndex: number } | null>(null)
  const [wrongForcedTries, setWrongForcedTries] = useState(0)
  const wrongForcedTriesRef = useRef(0)

  // Feedback State
  const [feedback, setFeedback] = useState<{ text: string, color: string, id: number } | null>(null)

  // Timer State
  const [, setSecondsElapsed] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // Game Logic State
  const gridSize = 11
  const [gridState, setGridState] = useState<(number | null)[][]>(
    Array.from({ length: gridSize }, () => Array(gridSize).fill(null)),
  )
  const [blockCounts, setBlockCounts] = useState<number[]>([16, 16, 16, 16, 16])

  const boardRef = useRef<HTMLDivElement>(null)
  const [, setBoardLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  
  useEffect(() => {
    wrongForcedTriesRef.current = wrongForcedTries
  }, [wrongForcedTries])

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  const center = Math.floor(gridSize / 2)
  const word = " PALINDROME"
  const halfWord = Math.floor(word.length / 2)

  const layoutConfig = getLayoutConfig()

  const colorGradients = customGameColors ?? [...DEFAULT_GAME_GRADIENTS]

  const spawnBulldogs = useCallback(() => {
    const totalBulldogs = 5
    const blockedPositions = new Set<string>()
    for (let i = 0; i < word.length; i++) {
      blockedPositions.add(`${center},${center - halfWord + i}`)
      blockedPositions.add(`${center - halfWord + i},${center}`)
    }

    const newPositions: { row: number; col: number }[] = []
    while (newPositions.length < totalBulldogs) {
      const row = Math.floor(Math.random() * gridSize)
      const col = Math.floor(Math.random() * gridSize)
      const key = `${row},${col}`
      if (!blockedPositions.has(key) && !newPositions.some((p) => p.row === row && p.col === col)) {
        newPositions.push({ row, col })
      }
    }
    setBulldogPositions(newPositions)
  }, [center, gridSize, halfWord, word])

  const initializeGame = useCallback(() => {
    spawnBulldogs()

    // Pre-place 3 random colors on horizontal 'I', 'N', 'D' (coordinates (5,3), (5,4), (5,5))
    const indPositions = [
      { row: 6, col: 5 },
      { row: 5, col: 4 },
      { row: 5, col: 5 },
    ]
    const initialColors = indPositions.map(() => Math.floor(Math.random() * 5))

    setGridState(() => {
      const newGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null))
      indPositions.forEach((pos, idx) => {
        newGrid[pos.row][pos.col] = initialColors[idx]
      })
      return newGrid
    })

    const initialCounts = [16, 16, 16, 16, 16]
    initialColors.forEach(colorIdx => {
      initialCounts[colorIdx] = Math.max(0, initialCounts[colorIdx] - 1)
    })
    setBlockCounts(initialCounts)

    setScore(0)
    setHints(2)
    setTime("00:00")
    setSecondsElapsed(0)
    setIsTimerRunning(false)
    setPause(false)
    setFeedback(null)
    setDragOverCell(null)
    setActiveHint(null)
  }, [spawnBulldogs, gridSize])

  useEffect(() => {
    if (matchId) return
    initializeGame()
  }, [initializeGame, matchId])

  useEffect(() => {
    if (!matchId || multiplayerInitDone.current) return
    let cancelled = false
    ;(async () => {
      const m = await getMatch(matchId)
      if (cancelled || !m) return
      multiplayerInitDone.current = true
      setMultiplayerMatch(m)
      setMultiplayerTimeLimit(m.time_limit_seconds)
      setMultiplayerJoinedAt(Date.now())
      const initialState = createInitialState(m.seed)
      setGridState(initialState.grid.map((r) => [...r]))
      setBlockCounts([...initialState.blockCounts])
      setBulldogPositions([...initialState.bulldogPositions])
      setScore(initialState.score)
      const user = await authService.getSessionUser()
      const other = (m.match_players ?? []).find((p: MatchPlayer) => p.user_id !== user?.id)
      if (other) {
        setOpponentScore(other.score ?? 0)
        const profile = await authService.getProfile(other.user_id)
        if (profile?.full_name) setOpponentName(profile.full_name)
        if (profile?.avatar_url) setOpponentAvatar(profile.avatar_url)
      }
    })()
    return () => { cancelled = true }
  }, [matchId])

  useEffect(() => {
    if (!matchId) return
    const unsub = subscribeToMatch(matchId, (m) => {
      setMultiplayerMatch(m)
      void authService.getSessionUser().then(async (user) => {
        const other = (m.match_players ?? []).find((p: MatchPlayer) => p.user_id !== user?.id)
        if (other) {
          setOpponentScore(other.score ?? 0)
          const profile = await authService.getProfile(other.user_id)
          if (profile?.full_name) setOpponentName(profile.full_name)
          if (profile?.avatar_url) setOpponentAvatar(profile.avatar_url)
          if (m.status === "finished") {
            router.replace({ pathname: "/matchresult", params: { matchId: m.id, ...(returnTo ? { returnTo } : {}) } })
          }
        }
      })
    })
    return unsub
  }, [matchId, router, returnTo])

  useEffect(() => {
    if (!matchId || !multiplayerJoinedAt || multiplayerFirstMoveAt != null || scoreSubmitted) return
    const joinedAt = multiplayerJoinedAt
    const firstMoveDeadline = joinedAt + FIRST_MOVE_TIMEOUT_SECONDS * 1000

    const tick = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((firstMoveDeadline - now) / 1000))
      setFirstMoveCountdown(remaining)
      setTime(`0:${remaining.toString().padStart(2, "0")}`)
      if (remaining <= 0) {
        setScoreSubmitted(true)
        authService.getSessionUser().then((user) => {
          if (user) submitScore(matchId, user.id, 0)
        })
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [matchId, multiplayerJoinedAt, multiplayerFirstMoveAt, scoreSubmitted])

  useEffect(() => {
    if (!matchId || multiplayerFirstMoveAt == null || multiplayerTimeLimit == null || scoreSubmitted) return
    const endAt = multiplayerFirstMoveAt + multiplayerTimeLimit * 1000

    const tick = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((endAt - now) / 1000))
      const mins = Math.floor(remaining / 60).toString().padStart(2, "0")
      const secs = (remaining % 60).toString().padStart(2, "0")
      setTime(`${mins}:${secs}`)
      if (remaining <= 0) {
        setScoreSubmitted(true)
        authService.getSessionUser().then((user) => {
          if (user) submitScore(matchId, user.id, scoreRef.current)
        })
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [matchId, multiplayerFirstMoveAt, multiplayerTimeLimit, scoreSubmitted])



  useEffect(() => {
    const measureBoard = () => {
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect()
        setBoardLayout({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        })
      }
    }

    const timer = setTimeout(measureBoard, 200)
    window.addEventListener('resize', measureBoard)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', measureBoard)
    }
  }, [])

  useEffect(() => {
    if (matchId) return
    let interval: any
    if (isTimerRunning && !pause) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => {
          const next = prev + 1
          const mins = Math.floor(next / 60).toString().padStart(2, "0")
          const secs = (next % 60).toString().padStart(2, "0")
          setTime(`${mins}:${secs}`)
          return next
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [matchId, isTimerRunning, pause])

  const handleDragStart = (colorIndex: number) => {
    playPickupSound()
    triggerHaptic(10)
    setDraggedColor(colorIndex)
    if (!isTimerRunning) {
      setIsTimerRunning(true)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, row: number, col: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"

    // Only highlight if empty
    if (gridState[row][col] === null) {
      setDragOverCell({ row, col })
    } else {
      setDragOverCell(null)
    }
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, row: number, col: number) => {
    e.preventDefault()
    if (gridState[row][col] === null) {
      setDragOverCell({ row, col })
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    // We clear dragOverCell only if we are leaving the currently highlighted cell?
    // Or just clear it. But since enter/leave bubble, it's safer to rely on Enter/Over updates.
    // However, if we leave a cell, we should clear it *if* it matches.
    setDragOverCell(null)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, row: number, col: number): Promise<boolean> => {
    e.preventDefault()
    setDragOverCell(null)
    setDraggedColor(null)

    const transferredColor = e.dataTransfer.getData("color")
    if (!transferredColor) {
      playErrorSound()
      triggerHaptic([0, 30, 20, 30])
      return false
    }

    const colorIndex = parseInt(transferredColor, 10)

    if (isNaN(colorIndex) || colorIndex < 0 || colorIndex >= colorGradients.length) {
      playErrorSound()
      triggerHaptic([0, 30, 20, 30])
      return false
    }

    if (gridState[row][col] !== null) {
      playErrorSound()
      triggerHaptic([0, 30, 20, 30])
      return false
    }

    if (blockCounts[colorIndex] <= 0) {
      playErrorSound()
      triggerHaptic([0, 30, 20, 30])
      return false
    }

    const forcedMove = findFirstScoringMove(3, gridState, blockCounts)
    if (forcedMove) {
      const tempGrid = gridState.map((r) => [...r])
      tempGrid[row][col] = colorIndex
      const attemptedScore = checkAndProcessPalindromes(row, col, colorIndex, tempGrid, true, 3)

      if (attemptedScore <= 0) {
        const nextWrongTries = wrongForcedTriesRef.current + 1
        const nextValue = nextWrongTries >= 3 ? 0 : nextWrongTries
        wrongForcedTriesRef.current = nextValue
        setWrongForcedTries(nextValue)

        playErrorSound()
        triggerHaptic([0, 30, 20, 30])

        if (nextWrongTries >= 3) {
          if (hints > 0) {
            setHints((prev) => Math.max(0, prev - 1))
            setActiveHint(forcedMove)
            setTimeout(() => setActiveHint(null), 3000)
          } else {
            flashNoHintsFace()
          }
        }
        return false
      }
    } else if (wrongForcedTriesRef.current !== 0) {
      wrongForcedTriesRef.current = 0
      setWrongForcedTries(0)
    }

    const newGrid = gridState.map((r) => [...r])
    newGrid[row][col] = colorIndex

    setGridState(newGrid)

    const nextBlockCounts = [...blockCounts]
    nextBlockCounts[colorIndex] = Math.max(0, nextBlockCounts[colorIndex] - 1)
    setBlockCounts(nextBlockCounts)

    playDropSound()
    triggerHaptic(14)
    console.log(`Successfully placed color ${colorIndex} at ${row},${col}`)

    const scoreFound = checkAndProcessPalindromes(row, col, colorIndex, newGrid)
    if (scoreFound > 0) {
      setScore(prev => prev + scoreFound)
    }
    const newScore = score + scoreFound
    if (matchId && scoreFound > 0 && !scoreSubmitted) {
      authService.getSessionUser().then((user) => {
        if (user) void updateLiveScore(matchId, user.id, newScore)
      })
    }
    if (wrongForcedTriesRef.current !== 0) {
      wrongForcedTriesRef.current = 0
      setWrongForcedTries(0)
    }

    if (tutorialOpen) {
      if (tutorialPhase === "placeFirst") {
        setTutorialPhase("makeScore")
      } else if (tutorialPhase === "makeScore" && scoreFound > 0) {
        setTutorialPhase("complete")
      }
    }

    if (matchId && multiplayerFirstMoveAtRef.current == null) {
      multiplayerFirstMoveAtRef.current = Date.now()
      setMultiplayerFirstMoveAt(Date.now())
      setFirstMoveCountdown(null)
    }

    if (matchId && nextBlockCounts.every((c) => c === 0) && !scoreSubmitted) {
      setScoreSubmitted(true)
      authService.getSessionUser().then((user) => {
        if (user) submitScore(matchId, user.id, newScore)
      })
    }

    return true
  }

  const checkAndProcessPalindromes = (row: number, col: number, colorIdx: number, currentGrid: (number | null)[][], dryRun = false, minLength = 3) => {
    let scoreFound = 0

    const checkLine = (lineIsRow: boolean) => {
      const line: { color: number; r: number; c: number }[] = []
      if (lineIsRow) {
        for (let c = 0; c < gridSize; c++) {
          if (currentGrid[row][c] !== null) {
            line.push({ color: currentGrid[row][c]!, r: row, c: c })
          } else {
            line.push({ color: -1, r: row, c: c })
          }
        }
      } else {
        for (let r = 0; r < gridSize; r++) {
          if (currentGrid[r][col] !== null) {
            line.push({ color: currentGrid[r][col]!, r: r, c: col })
          } else {
            line.push({ color: -1, r: r, c: col })
          }
        }
      }

      const targetIndex = lineIsRow ? col : row

      let start = targetIndex
      let end = targetIndex

      while (start > 0 && line[start - 1].color !== -1) start--
      while (end < gridSize - 1 && line[end + 1].color !== -1) end++

      const segment = line.slice(start, end + 1)
      if (segment.length >= minLength) {
        const colors = segment.map((s) => s.color)
        const isPal = colors.join(",") === [...colors].reverse().join(",")

        if (isPal) {
          let segmentScore = segment.length
          let hasBulldog = false
          segment.forEach((b) => {
            if (bulldogPositions.some((bp) => bp.row === b.r && bp.col === b.c)) {
              hasBulldog = true
            }
          })

          if (hasBulldog) segmentScore += 10
          scoreFound += segmentScore

          // Trigger Feedback
          if (!dryRun) {
            let feedbackText = "GOOD!"
            let feedbackColor = "#4ADE80" // green-400
            if (segment.length === 4) {
              feedbackText = "GREAT!"
              feedbackColor = "#60A5FA" // blue-400
            } else if (segment.length === 5) {
              feedbackText = "AMAZING!"
              feedbackColor = "#A78BFA" // purple-400
            } else if (segment.length >= 6) {
              feedbackText = "LEGENDARY!"
              feedbackColor = "#F472B6" // pink-400
            }

            setFeedback({ text: feedbackText, color: feedbackColor, id: Date.now() })
            playSuccessSound()
            triggerHaptic([0, 12, 10, 12])
            setTimeout(() => setFeedback(null), 2000)
          }
        }
      }
    }

    checkLine(true)
    checkLine(false)

    return scoreFound
  }

  const findFirstScoringMove = (minLength: number, grid: (number | null)[][], counts: number[]) => {
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r][c] !== null) continue
        for (let colorIdx = 0; colorIdx < colorGradients.length; colorIdx++) {
          if (counts[colorIdx] <= 0) continue
          const tempGrid = grid.map((rowArr) => [...rowArr])
          tempGrid[r][c] = colorIdx
          const sc = checkAndProcessPalindromes(r, c, colorIdx, tempGrid, true, minLength)
          if (sc > 0) {
            return { row: r, col: c, colorIndex: colorIdx }
          }
        }
      }
    }
    return null
  }

  const findHint = () => {
    if (hints <= 0) return
    const move = findFirstScoringMove(3, gridState, blockCounts) ?? findFirstScoringMove(2, gridState, blockCounts)
    if (move) {
      setHints((prev) => prev - 1)
      setActiveHint(move)
      setTimeout(() => setActiveHint(null), 3000)
      return
    }

    // No hint found
    playErrorSound()
    triggerHaptic([0, 30, 20, 30])
  }

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    background: theme === "dark"
      ? "linear-gradient(to right bottom, #000017, #000074)"
      : "linear-gradient(to right bottom, #FFFFFF, #F5F5F5)",
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
    gap: 60,
  }

  const tutorialStep: GameTutorialStep | null =
    tutorialPhase === "ui"
      ? uiSteps[tutorialUiIndex] ?? null
      : tutorialPhase === "placeFirst"
        ? {
            title: "Your First Move",
            description: "Drag any block onto an empty cell on the board.",
            targetId: "tour-game-blocks",
            mode: "coach",
            showPrimary: false,
            showBack: false,
          }
        : tutorialPhase === "makeScore"
          ? {
              title: "Make Your First Score",
              description: "Keep placing blocks until you create a palindrome (3+ in a row or column).",
              targetId: "tour-game-board",
              mode: "coach",
              showPrimary: false,
              showBack: false,
            }
          : {
              title: "Great Job",
              description: "You scored your first palindrome. You’re ready to play.",
              targetId: "tour-game-status-score",
              mode: "modal",
              showPrimary: true,
              showBack: false,
              primaryLabel: "Continue",
            }

  const tutorialStepsCount = tutorialPhase === "ui" ? uiSteps.length : 1
  const tutorialStepIndex = tutorialPhase === "ui" ? tutorialUiIndex : 0

  return (
    <div style={containerStyle}>
        {matchId && scoreSubmitted && multiplayerMatch?.status !== "finished" ? (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
          }}>
            <div style={{
              padding: 24,
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: 260,
              backgroundColor: theme === "dark" ? "rgba(25,25,91,0.95)" : "rgba(255,255,255,0.95)",
              textAlign: "center",
            }}>
              <span style={{ fontFamily: "Geist-Bold", fontSize: 18, marginBottom: 8, color: theme === "dark" ? "#FFFFFF" : "#111111", display: "block" }}>Game over!</span>
              <span style={{ fontFamily: "Geist-Regular", fontSize: 14, marginBottom: 12, color: theme === "dark" ? "rgba(255,255,255,0.7)" : "rgba(17,17,17,0.7)", display: "block" }}>
                Waiting for opponent to finish...
              </span>
              <span style={{ fontFamily: "Geist-Bold", fontSize: 20, color: colors.accent }}>Your score: {score}</span>
            </div>
          </div>
        ) : null}
        <style>{`
          @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes floatUp {
            0% { transform: translateY(0px); opacity: 1; }
            100% { transform: translateY(-50px); opacity: 0; }
          }
          @keyframes pulse {
            0% { opacity: 0.3; transform: scale(0.95); }
            50% { opacity: 0.7; transform: scale(1.05); }
            100% { opacity: 0.3; transform: scale(0.95); }
          }
        `}</style>

        {/* Left Panel: Status & Info */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 30,
          minWidth: 200,
        }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: "900",
            marginBottom: 20,
            textAlign: "center",
            color: colors.accent,
            fontFamily: "system-ui, -apple-system, sans-serif",
            margin: 0,
            textShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}>PALINDROME®</h1>

          {/* User Profile Summary */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 15,
            padding: "10px 20px",
            backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
            borderRadius: 20,
            marginBottom: 10,
          }}>
             <Image
                source={avatar ? { uri: avatar } : require("../../assets/images/profile_ph.png")}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  resizeMode: 'contain',
                  borderWidth: 2,
                  borderColor: colors.accent,
                }}
                accessibilityLabel="Profile"
              />
              <span style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.text,
                fontFamily: "system-ui"
              }}>{userName}</span>
          </div>

          {matchId ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "10px 16px",
              backgroundColor: theme === "dark" ? "rgba(25,25,91,0.5)" : "rgba(229,236,241,0.6)",
              borderRadius: 12,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: theme === "dark" ? "rgba(255,255,255,0.15)" : "#C7D5DF",
            }}>
              <Image
                source={opponentAvatar ? { uri: opponentAvatar } : require("../../assets/images/profile_ph.png")}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  resizeMode: "contain",
                }}
                accessibilityLabel="Opponent"
              />
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: colors.secondaryText, fontFamily: "system-ui" }}>{opponentName}</span>
                <span style={{ fontSize: 18, fontWeight: "700", color: colors.accent, fontFamily: "system-ui" }}>{opponentScore ?? "—"}</span>
              </div>
            </div>
          ) : null}

          <div id="tour-game-status-score" style={{
            display: "flex",
            flexDirection: "column",
            borderWidth: 1,
            borderStyle: "solid",
            borderRadius: 24,
            width: "100%",
            padding: "20px 0",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)",
            backgroundColor: theme === "dark" ? "rgba(25, 25, 91, 0.7)" : "#ffffffff",
            borderColor: colors.border,
          }}>
            <span style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 1, color: colors.secondaryText, fontFamily: "system-ui", marginBottom: 5 }}>Score</span>
            <span style={{ fontSize: 42, fontWeight: "800", color: colors.accent, fontFamily: "system-ui" }}>{score}</span>
          </div>

          {matchId && firstMoveCountdown != null ? (
            <div style={{
              padding: "8px 16px",
              borderRadius: 12,
              backgroundColor: firstMoveCountdown <= 5 ? "rgba(239,68,68,0.9)" : "rgba(34,197,94,0.9)",
              marginBottom: 8,
            }}>
              <span style={{ fontFamily: "Geist-Bold", fontSize: 14, color: "#FFFFFF" }}>
                Make your first move! {firstMoveCountdown}s
              </span>
            </div>
          ) : null}
          <div id="tour-game-timer" style={{
             display: "flex",
             flexDirection: "column",
             alignItems: "center",
             justifyContent: "center",
          }}>
             <Svg height="80" width="200">
              <Defs>
                <SvgLinearGradient id="timeGradWeb" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#95DEFE" stopOpacity="1" />
                  <Stop offset="1" stopColor="#419EEF" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              <SvgText
                fill="url(#timeGradWeb)"
                fontSize="48"
                fontFamily="Geist-Regular"
                fontWeight="bold"
                x="50%"
                y="65%"
                textAnchor="middle"
              >
                {time}
              </SvgText>
            </Svg>
          </div>

          <div
            id="tour-game-status-hints"
            onClick={findHint}
            style={{
              cursor: hints > 0 ? "pointer" : "not-allowed",
              opacity: hints > 0 ? 1 : 0.6,
              display: "flex",
              flexDirection: "column",
              borderWidth: 1,
              borderStyle: "solid",
              borderRadius: 24,
              width: "100%",
              padding: "20px 0",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)",
              backgroundColor: theme === "dark" ? "rgba(25, 25, 91, 0.7)" : "#ffffffff",
              borderColor: colors.border,
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <span style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 1, color: colors.secondaryText, fontFamily: "system-ui", marginBottom: 5 }}>Hints</span>
            <div style={{ position: "relative", height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{
                position: "absolute",
                fontSize: 32,
                fontWeight: "700",
                color: "#C35DD9",
                fontFamily: "system-ui",
                opacity: noHintsFaceVisible ? 0 : 1,
                transform: noHintsFaceVisible ? "scale(0.98)" : "scale(1)",
                transition: "opacity 200ms ease, transform 200ms ease",
              }}>
                {hints}
              </span>
              <span style={{
                position: "absolute",
                fontSize: 32,
                fontWeight: "700",
                color: "#C35DD9",
                fontFamily: "system-ui",
                opacity: noHintsFaceVisible ? 1 : 0,
                transform: noHintsFaceVisible ? "scale(1)" : "scale(0.98)",
                transition: "opacity 200ms ease, transform 200ms ease",
              }}>
                (¬_¬)
              </span>
            </div>
          </div>
        </div>

        {/* Center Panel: Board & Blocks */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}>
          {/* Game Board */}
          <div
            id="tour-game-board"
            ref={boardRef}
            style={{
              borderRadius: 24,
              padding: 12,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: theme === "dark" ? "rgba(25, 25, 91, 0.7)" : "#f1f1f1ff",
              boxShadow: theme === "dark" ? "0 20px 50px rgba(0,0,0,0.5)" : "0 20px 50px rgba(0,0,0,0.1)",
              width: layoutConfig.boardSize,
              height: layoutConfig.boardSize,
              zIndex: 1,
              position: 'relative',
            }}
          >
            {/* Feedback Overlay */}
            {feedback && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9999,
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  key={feedback.id}
                  style={{
                    animation: "popIn 0.5s ease-out forwards, floatUp 1.5s ease-in 1s forwards",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  <h2
                    style={{
                      fontSize: 56,
                      fontWeight: "900",
                      color: feedback.color,
                      textShadow: "0px 4px 20px rgba(0,0,0,0.4)",
                      margin: 0,
                      fontFamily: "Geist-Regular, system-ui",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {feedback.text}
                  </h2>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column" }}>
              {Array.from({ length: gridSize }, (_, row) => (
                <div key={row} style={{ display: "flex", flexDirection: "row" }}>
                  {Array.from({ length: gridSize }, (_, col) => {
                    const isBulldog = bulldogPositions.some((pos) => pos.row === row && pos.col === col)
                    let letter: string | null = null
                    if (row === center && col >= center - halfWord && col < center - halfWord + word.length) {
                      letter = word[col - (center - halfWord)]
                    }
                    if (col === center && row >= center - halfWord && row < center - halfWord + word.length) {
                      letter = word[row - (center - halfWord)]
                    }

                    const cellColorIndex = gridState[row][col]
                    const isHovered = dragOverCell?.row === row && dragOverCell?.col === col

                    const cellStyle: React.CSSProperties = {
                      width: layoutConfig.cellSize,
                      height: layoutConfig.cellSize,
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor: "#CCDAE466",
                      borderRadius: 8,
                      margin: 3,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: theme === "dark" ? "rgba(25, 25, 91, 0.7)" : "#ffffffff",
                      transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
                    }

                    const isHint = activeHint?.row === row && activeHint?.col === col
                    
                    if (isHovered || isHint) {
                      cellStyle.backgroundColor = theme === "dark" ? "rgba(100, 200, 255, 0.4)" : "rgba(100, 200, 255, 0.3)"
                      cellStyle.borderColor = theme === "dark" ? "rgba(100, 200, 255, 0.8)" : "rgba(50, 150, 255, 0.6)"
                      cellStyle.borderWidth = 2
                      cellStyle.boxShadow = "0 0 12px rgba(74, 158, 255, 0.5)"
                      cellStyle.transform = "scale(1.05)"
                      cellStyle.zIndex = 10
                    }

                    if (isHint) {
                      cellStyle.borderColor = "#FFD700"
                      cellStyle.boxShadow = "0 0 20px rgba(255, 215, 0, 0.6)"
                    }

                    return (
                      <div
                        key={col}
                        onDragOver={(e) => handleDragOver(e, row, col)}
                        onDragEnter={(e) => handleDragEnter(e, row, col)}
                        onDragLeave={(e) => handleDragLeave(e)}
                        onDrop={(e) => handleDrop(e, row, col)}
                        style={cellStyle}
                      >
                        {cellColorIndex !== null && (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: 6,
                              background: `linear-gradient(to right bottom, ${colorGradients[cellColorIndex][0]}, ${colorGradients[cellColorIndex][1]})`,
                              position: "absolute",
                              top: 0,
                              left: 0,
                              zIndex: 0,
                              boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                            }}
                          />
                        )}

                        {isHint && activeHint && (
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: `linear-gradient(to right bottom, ${colorGradients[activeHint.colorIndex][0]}, ${colorGradients[activeHint.colorIndex][1]})`,
                              borderRadius: 6,
                              animation: "pulse 1.5s infinite",
                              zIndex: 1,
                            }}
                          />
                        )}

                        <div style={{
                          zIndex: 2,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          pointerEvents: "none",
                        }}>
                          {isHint && activeHint && colorBlindEnabled && cellColorIndex === null && (
                            <span
                              style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                color: "#FFFFFF",
                                fontWeight: "900",
                                fontSize: layoutConfig.cellSize > 40 ? 18 : 15,
                                textShadow: "0 1px 4px rgba(0,0,0,0.45)",
                                userSelect: "none",
                              }}
                            >
                              {getColorBlindToken(colorBlindMode, activeHint.colorIndex)}
                            </span>
                          )}
                          {cellColorIndex !== null && colorBlindEnabled && !letter && (
                            <span
                              style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                color: "#FFFFFF",
                                fontWeight: "900",
                                fontSize: layoutConfig.cellSize > 40 ? 18 : 15,
                                textShadow: "0 1px 4px rgba(0,0,0,0.45)",
                                userSelect: "none",
                              }}
                            >
                              {getColorBlindToken(colorBlindMode, cellColorIndex)}
                            </span>
                          )}
                          {cellColorIndex !== null && colorBlindEnabled && letter && (
                            <span
                              style={{
                                position: "absolute",
                                right: 4,
                                bottom: 3,
                                color: "#FFFFFF",
                                fontWeight: "900",
                                fontSize: 10,
                                textShadow: "0 1px 4px rgba(0,0,0,0.45)",
                                userSelect: "none",
                              }}
                            >
                              {getColorBlindToken(colorBlindMode, cellColorIndex)}
                            </span>
                          )}
                          {isBulldog && (
                            <img
                              src="/bulldog.png"
                              style={{
                                width: layoutConfig.cellSize - 10,
                                height: layoutConfig.cellSize - 10,
                                objectFit: "contain",
                                filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))"
                              }}
                              alt="bulldog"
                            />
                          )}
                          {letter && (
                            <span
                              style={{
                                color: colors.text,
                                fontSize: layoutConfig.cellSize > 40 ? 18 : 15,
                                fontWeight: "800",
                                fontFamily: "system-ui",
                                textShadow: cellColorIndex !== null ? "0 1px 2px rgba(0,0,0,0.3)" : "none"
                              }}
                            >
                              {letter}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Blocks Row */}
          <div id="tour-game-blocks" style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            padding: "20px 40px",
            backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.5)",
            borderRadius: 30,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            backdropFilter: "blur(10px)",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}>
            {colorGradients.map((gradient, i) => (
              <DraggableBlock
                key={`bottom-${i}`}
                colorIndex={i}
                gradient={gradient}
                count={blockCounts[i]}
                layoutConfig={layoutConfig}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        </div>

        {/* Right Panel: Controls */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          minWidth: 100,
        }}>
           <Pressable onPress={() => {
            if (pause) setPause(false)
            if (!isTimerRunning) setIsTimerRunning(true)
          }}>
            <div id="tour-game-btn-play" style={{
              width: 80,
              height: 80,
              borderRadius: 25,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(to right bottom, #8ed9fc, #3c8dea)",
              cursor: 'pointer',
              boxShadow: "0 8px 16px rgba(60, 141, 234, 0.3)",
              transition: "transform 0.1s",
            }}
             onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
             onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <Ionicons name="play" size={40} color="#fff" />
            </div>
          </Pressable>

          <Pressable onPress={() => setPause(true)}>
            <div id="tour-game-btn-pause" style={{
              width: 80,
              height: 80,
              borderRadius: 25,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(to right bottom, #ffee60, #ffa40b)",
              cursor: 'pointer',
              boxShadow: "0 8px 16px rgba(255, 164, 11, 0.3)",
              transition: "transform 0.1s",
            }}
             onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
             onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <Ionicons name="pause" size={40} color="#fff" />
            </div>
          </Pressable>

          <Pressable onPress={() => router.push("/profile")}>
             <div id="tour-game-btn-profile" style={{
              width: 80,
              height: 80,
              borderRadius: 25,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#fff",
              cursor: 'pointer',
              boxShadow: "0 8px 16px rgba(0,0,0,0.05)",
              border: "1px solid rgba(0,0,0,0.05)",
               transition: "transform 0.1s",
            }}
             onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
             onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <Ionicons name="list" size={32} color={colors.text} />
            </div>
          </Pressable>

          <Pressable onPress={() => setRestartConfirmationVisible(true)}>
             <div id="tour-game-btn-restart" style={{
              width: 80,
              height: 80,
              borderRadius: 25,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#fff",
              cursor: 'pointer',
              boxShadow: "0 8px 16px rgba(0,0,0,0.05)",
               border: "1px solid rgba(0,0,0,0.05)",
                transition: "transform 0.1s",
            }}
             onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
             onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <Ionicons name="refresh" size={32} color={colors.text} />
            </div>
          </Pressable>

          <Pressable onPress={() => setHomeConfirmationVisible(true)}>
             <div id="tour-game-btn-home" style={{
              width: 80,
              height: 80,
              borderRadius: 25,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#fff",
              cursor: 'pointer',
              boxShadow: "0 8px 16px rgba(0,0,0,0.05)",
               border: "1px solid rgba(0,0,0,0.05)",
                transition: "transform 0.1s",
            }}
             onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
             onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <Ionicons name="home" size={32} color={colors.text} />
            </div>
          </Pressable>

          <Pressable onPress={() => setSettingsVisible(true)}>
             <div id="tour-game-btn-settings" style={{
              width: 80,
              height: 80,
              borderRadius: 25,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#fff",
              cursor: 'pointer',
              boxShadow: "0 8px 16px rgba(0,0,0,0.05)",
               border: "1px solid rgba(0,0,0,0.05)",
                transition: "transform 0.1s",
            }}
             onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
             onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <Ionicons name="settings-sharp" size={32} color={colors.text} />
            </div>
          </Pressable>

          <Pressable onPress={openTutorial}>
             <div style={{
              width: 80,
              height: 80,
              borderRadius: 25,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#fff",
              cursor: 'pointer',
              boxShadow: "0 8px 16px rgba(0,0,0,0.05)",
               border: "1px solid rgba(0,0,0,0.05)",
                transition: "transform 0.1s",
            }}
             onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
             onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <Ionicons name="help-circle-outline" size={32} color={colors.text} />
            </div>
          </Pressable>
        </div>

        {/* Settings Modal */}
        {settingsVisible && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
          }}>
            <BlurView
              intensity={20}
              tint="default"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            >
              <div style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 30px",
                height: "100%", 
                width: "100%",
                backgroundColor: "rgba(0,0,0,0.4)"
              }}>
                <div style={{
                  width: "100%",
                  maxWidth: 400,
                  borderRadius: 32,
                  padding: 32,
                  boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.4)",
                  background: theme === "dark"
                    ? "linear-gradient(to right bottom, #000017, #000074)"
                    : "#FFFFFF",
                  display: 'flex',
                  flexDirection: 'column',
                  border: "1px solid rgba(255,255,255,0.1)"
                }}>
                  <div style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                  }}>
                    <span style={{
                      fontSize: 28,
                      fontWeight: "900",
                      fontFamily: "Geist-Regular, system-ui",
                      color: colors.text,
                    }}>Settings</span>
                    <Pressable onPress={() => setSettingsVisible(false)} style={{ 
                        width: 40, height: 40, alignItems: "center", justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 20
                    }}>
                      <span style={{
                        fontSize: 24,
                        fontWeight: "700",
                        color: colors.text,
                        cursor: 'pointer',
                        lineHeight: 1
                      }}>×</span>
                    </Pressable>
                  </div>

                  <div style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 30,
                    padding: 15,
                    backgroundColor: "rgba(0,0,0,0.03)",
                    borderRadius: 20
                  }}>
                    <Image
                      source={avatar ? { uri: avatar } : require("../../assets/images/profile_ph.png")}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        marginRight: 20,
                        resizeMode: 'contain'
                      }}
                      accessibilityLabel="Profile"
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: colors.text,
                        fontFamily: "Geist-Regular, system-ui"
                      }}>{userName}</span>
                      <Pressable onPress={() => router.push("/profile")}>
                        <span style={{
                          fontSize: 14,
                          fontWeight: "600",
                          marginTop: 4,
                          color: colors.accent,
                          cursor: 'pointer',
                          fontFamily: "Geist-Regular, system-ui"
                        }}>View Profile</span>
                      </Pressable>
                    </div>
                  </div>

                  {/* Options */}
                  <div style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 10,
                    marginBottom: 20,
                  }}>
                    <span style={{ fontSize: 16, color: colors.text, fontFamily: "Geist-Regular, system-ui" }}>Sound Effects</span>
                    <Switch
                      value={soundEnabled}
                      onValueChange={setSoundEnabled}
                      circleSize={18}
                      barHeight={22}
                      backgroundActive={colors.accent}
                      backgroundInactive="#ccc"
                      circleActiveColor="#fff"
                      circleInActiveColor="#fff"
                      switchWidthMultiplier={2.5}
                      renderActiveText={false}
                      renderInActiveText={false}
                    />
                  </div>

                  <div style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}>
                    <span style={{ fontSize: 16, color: colors.text, fontFamily: "Geist-Regular, system-ui" }}>Haptic Feedback</span>
                    <Switch
                      value={hapticsEnabled}
                      onValueChange={setHapticsEnabled}
                      circleSize={18}
                      barHeight={22}
                      backgroundActive={colors.accent}
                      backgroundInactive="#ccc"
                      circleActiveColor="#fff"
                      circleInActiveColor="#fff"
                      switchWidthMultiplier={2.5}
                      renderActiveText={false}
                      renderInActiveText={false}
                    />
                  </div>

                  <div style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 16, color: colors.text, fontFamily: "Geist-Regular, system-ui" }}>Color Blind Mode</span>
                      <span style={{ fontSize: 12, marginTop: 4, color: theme === "dark" ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)", fontFamily: "Geist-Regular, system-ui" }}>
                        Preference: {colorBlindMode === "symbols" ? "Symbols" : colorBlindMode === "emojis" ? "Emojis" : colorBlindMode === "cards" ? "Cards" : "Letters"}
                      </span>
                    </div>
                    <Switch
                      value={colorBlindEnabled}
                      onValueChange={setColorBlindEnabled}
                      circleSize={18}
                      barHeight={22}
                      backgroundActive={colors.accent}
                      backgroundInactive="#ccc"
                      circleActiveColor="#fff"
                      circleInActiveColor="#fff"
                      switchWidthMultiplier={2.5}
                      renderActiveText={false}
                      renderInActiveText={false}
                    />
                  </div>


                  <div style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 14,
                    marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 16, color: colors.text, fontFamily: "Geist-Regular, system-ui" }}>Dark Mode</span>
                    <Switch
                      value={theme === "dark"}
                      onValueChange={toggleTheme}
                      circleSize={18}
                      barHeight={22}
                      backgroundActive={colors.accent}
                      backgroundInactive="#E5E5E5"
                      circleActiveColor="#fff"
                      circleInActiveColor="#fff"
                      switchWidthMultiplier={2.5}
                      renderActiveText={false}
                      renderInActiveText={false}
                    />
                  </div>

                  {/* Links */}
                  <Pressable style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 14,
                    marginBottom: 6,
                    cursor: 'pointer'
                  }}>
                    <span style={{ fontSize: 16, color: colors.text, fontFamily: "Geist-Regular, system-ui" }}>Privacy Policy</span>
                    <span style={{ fontSize: 22, fontWeight: "600", color: colors.accent, fontFamily: "Geist-Regular, system-ui" }}>›</span>
                  </Pressable>
                  <Pressable style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 14,
                    marginBottom: 6,
                    cursor: 'pointer'
                  }}>
                    <span style={{ fontSize: 16, color: colors.text, fontFamily: "system-ui" }}>Terms & Conditions</span>
                    <span style={{ fontSize: 22, fontWeight: "600", color: colors.accent, fontFamily: "system-ui" }}>›</span>
                  </Pressable>
                </div>
              </div>
            </BlurView>
          </div>
        )}

        {/* Restart Confirmation Modal */}
        {restartConfirmationVisible && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
          }}>
            <BlurView
              intensity={20}
              tint="default"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            >
              <div style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 30px",
                height: "100%", 
                width: "100%",
                backgroundColor: "rgba(0,0,0,0.4)"
              }}>
                <div style={{
                  width: "100%",
                  maxWidth: 400,
                  borderRadius: 32,
                  padding: 32,
                  boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.4)",
                  background: theme === "dark"
                    ? "linear-gradient(to right bottom, #000017, #000074)"
                    : "#FFFFFF",
                  display: 'flex',
                  flexDirection: 'column',
                  border: "1px solid rgba(255,255,255,0.1)",
                  alignItems: "center",
                }}>
                  <h2 style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: colors.text,
                    fontFamily: "Geist-Regular, system-ui",
                    marginBottom: 16,
                    textAlign: "center",
                    marginTop: 0,
                  }}>Restart Game?</h2>
                  <p style={{
                    fontSize: 16,
                    color: colors.text,
                    opacity: 0.8,
                    fontFamily: "Geist-Regular, system-ui",
                    marginBottom: 32,
                    textAlign: "center",
                  }}>
                    Are you sure you want to restart? Current progress will be lost.
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "row", gap: 20, width: "100%" }}>
                    <Pressable 
                        onPress={() => setRestartConfirmationVisible(false)}
                        style={{ flex: 1 }}
                    >
                        <div style={{
                            padding: "16px",
                            borderRadius: 16,
                            backgroundColor: "rgba(0,0,0,0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "background-color 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.1)"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)"}
                        >
                            <span style={{ fontSize: 16, fontFamily: "Geist-Regular, system-ui", fontWeight: "600", color: colors.text }}>Cancel</span>
                        </div>
                    </Pressable>

                    <Pressable 
                        onPress={() => {
                            initializeGame()
                            setRestartConfirmationVisible(false)
                        }}
                        style={{ flex: 1 }}
                    >
                        <div style={{
                            padding: "16px",
                            borderRadius: 16,
                            background: "linear-gradient(to right, #ff4b4b, #ff0000)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(255, 0, 0, 0.3)",
                            transition: "transform 0.1s"
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
                        onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                        >
                            <span style={{ fontSize: 16, fontFamily: "Geist-Regular, system-ui", fontWeight: "600", color: "#fff" }}>Restart</span>
                        </div>
                    </Pressable>
                  </div>
                </div>
              </div>
            </BlurView>
          </div>
        )}

        {/* Home Confirmation Modal */}
        {homeConfirmationVisible && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
          }}>
            <BlurView
              intensity={20}
              tint="default"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            >
              <div style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 30px",
                height: "100%", 
                width: "100%",
                backgroundColor: "rgba(0,0,0,0.4)"
              }}>
                <div style={{
                  width: "100%",
                  maxWidth: 400,
                  borderRadius: 32,
                  padding: 32,
                  boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.4)",
                  background: theme === "dark"
                    ? "linear-gradient(to right bottom, #000017, #000074)"
                    : "#FFFFFF",
                  display: 'flex',
                  flexDirection: 'column',
                  border: "1px solid rgba(255,255,255,0.1)",
                  alignItems: "center",
                }}>
                  <h2 style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: colors.text,
                    fontFamily: "Geist-Regular, system-ui",
                    marginBottom: 16,
                    textAlign: "center",
                    marginTop: 0,
                  }}>Return to Main Menu?</h2>
                  <p style={{
                    fontSize: 16,
                    color: colors.text,
                    opacity: 0.8,
                    fontFamily: "Geist-Regular, system-ui",
                    marginBottom: 32,
                    textAlign: "center",
                  }}>
                    Are you sure you want to leave? Current game progress will be lost.
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "row", gap: 20, width: "100%" }}>
                    <Pressable 
                        onPress={() => setHomeConfirmationVisible(false)}
                        style={{ flex: 1 }}
                    >
                        <div style={{
                            padding: "16px",
                            borderRadius: 16,
                            backgroundColor: "rgba(0,0,0,0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "background-color 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.1)"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)"}
                        >
                            <span style={{ fontSize: 16, fontFamily: "Geist-Regular, system-ui", fontWeight: "600", color: colors.text }}>Cancel</span>
                        </div>
                    </Pressable>

                    <Pressable 
                        onPress={() => {
                            setHomeConfirmationVisible(false)
                            router.push("/")
                        }}
                        style={{ flex: 1 }}
                    >
                        <div style={{
                            padding: "16px",
                            borderRadius: 16,
                            background: "linear-gradient(to right, #ff4b4b, #ff0000)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(255, 0, 0, 0.3)",
                            transition: "transform 0.1s"
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
                        onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                        >
                            <span style={{ fontSize: 16, fontFamily: "Geist-Regular, system-ui", fontWeight: "600", color: "#fff" }}>Leave</span>
                        </div>
                    </Pressable>
                  </div>
                </div>
              </div>
            </BlurView>
          </div>
        )}
        {pause && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
          }}>
            <BlurView
              intensity={20}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{
                padding: 60,
                borderRadius: 16,
                display: "flex",
                flexDirection: 'column',
                alignItems: "center",
                boxShadow: "0px 8px 8px rgba(0, 0, 0, 0.1)",
                backgroundColor: colors.card,
              }}>
                <span style={{
                  fontSize: 32,
                  fontWeight: "bold",
                  marginBottom: 12,
                  color: colors.text,
                  fontFamily: "system-ui"
                }}>Game Paused</span>
                <Pressable onPress={() => setPause(false)} style={{
                  backgroundColor: "#0060FF",
                  paddingVertical: 15,
                  paddingHorizontal: 30,
                  borderRadius: 12,
                  cursor: 'pointer'
                }}>
                  <span style={{ color: "#fff", fontWeight: "700", fontSize: 16, fontFamily: "system-ui" }}>Resume</span>
                </Pressable>
              </div>
            </div>
          </div>
        )}

        <GameTutorialOverlay
          open={tutorialOpen}
          step={tutorialOpen ? tutorialStep : null}
          stepIndex={tutorialStepIndex}
          stepsCount={tutorialStepsCount}
          accentColor={colors.accent}
          onBack={backTutorial}
          onNext={nextTutorial}
          onSkip={skipTutorial}
          onDone={() => {
            if (tutorialPhase === "ui") {
              setTutorialPhase("placeFirst")
              return
            }
            doneTutorial()
          }}
        />
      </div>
  )
}
