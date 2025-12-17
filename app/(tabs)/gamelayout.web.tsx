"use client"

import { useThemeContext } from "@/context/ThemeContext"
import { useSound } from "@/hooks/use-sound"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { BlurView } from "expo-blur"
import { useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import {
  Dimensions,
  Pressable, // Keeps Pressable for unified event handling or allows simple onClick
  StyleSheet,
} from "react-native"
// react-native-svg works on web, usually maps to <svg>, but we can also use native <svg> if RN-SVG gives trouble. 
// However, sticking to RN-SVG is usually fine on web if setup correctly. The user snippet used Svg, let's stick to it or standard svg if safer.
// User snippet had Svg imports, let's keep them if they work, but standard SVG is safer for "pure web".
// Actually user snippet imports Svg from react-native-svg. I will try to use it, or fallback to standard svg if I can match styles.
import Svg, { Defs, Stop, LinearGradient as SvgLinearGradient, Text as SvgText } from "react-native-svg"
import { Switch } from "react-native-switch"
import firebaseService from "../../firebaseService"

const { width, height } = Dimensions.get("window")

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
      statusGap: 160,
      mainLayoutGap: 50,
      boardSize: 520,
      cellSize: 40,
      colorBlockWrapper: { width: 110, height: 500 },
      colorBlock: { width: 85, height: 83 },
      controlsBottom: -5,
      statusMargin: { top: 30, bottom: 30 },
    }
  } else if (width >= 1366) {
    return {
      statusGap: 120,
      mainLayoutGap: 30,
      boardSize: 500,
      cellSize: 38,
      colorBlockWrapper: { width: 100, height: 450 },
      colorBlock: { width: 75, height: 73 },
      controlsBottom: 0,
      statusMargin: { top: 25, bottom: 25 },
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
  const [isDragging, setIsDragging] = useState(false)

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
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
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
        }}
      >
        <div
          style={{
            background: `linear-gradient(to right bottom, ${gradient[0]}, ${gradient[1]})`,
            width: "100%",
            height: "100%",
            borderRadius: 10,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            userSelect: "none",
          }}
        >
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

export default function GameLayoutWeb() {
  const router = useRouter()
  const { theme, colors, toggleTheme } = useThemeContext()
  const { playPickupSound, playDropSound, playErrorSound } = useSound()

  const [score, setScore] = useState(0)
  const [hints, setHints] = useState(2)
  const [time, setTime] = useState("00:00")
  const [bulldogPositions, setBulldogPositions] = useState<{ row: number; col: number }[]>([])
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [pause, setPause] = useState(false)
  const [userName, setUserName] = useState("")
  const [avatar, setAvatar] = useState<string | null>(null)

  // Drag State
  const [dragOverCell, setDragOverCell] = useState<{ row: number; col: number } | null>(null)
  const [draggedColor, setDraggedColor] = useState<number | null>(null)

  // Game Logic State
  const gridSize = 11
  const [gridState, setGridState] = useState<(number | null)[][]>(
    Array.from({ length: gridSize }, () => Array(gridSize).fill(null)),
  )
  const [blockCounts, setBlockCounts] = useState<number[]>([16, 16, 16, 16, 16])

  const boardRef = useRef<HTMLDivElement>(null)
  const [boardLayout, setBoardLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  const center = Math.floor(gridSize / 2)
  const word = "PALINDROME"
  const halfWord = Math.floor(word.length / 2)

  const layoutConfig = getLayoutConfig()

  const colorGradients = [
    ["#C40111", "#F01D2E"],
    ["#757F35", "#99984D"],
    ["#1177FE", "#48B7FF"],
    ["#111111", "#3C3C3C"],
    ["#E7CC01", "#E7E437"],
  ] as const

  const spawnBulldogs = () => {
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
  }

  useEffect(() => {
    spawnBulldogs()

    const loadUserData = async () => {
      const user = firebaseService.getCurrentUser()

      if (user) {
        if (user.displayName) {
          setUserName(user.displayName)
        } else if (user.email) {
          setUserName(user.email.split("@")[0])
        }

        try {
          const storedAvatar = await AsyncStorage.getItem(`user_avatar_${user.uid}`)
          if (storedAvatar) {
            setAvatar(storedAvatar)
          } else if (user.photoURL) {
            setAvatar(user.photoURL)
          }
        } catch (error) {
          console.error("Error loading avatar", error)
        }
      } else {
        setUserName("User")
      }
    }

    loadUserData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsVisible])

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
  }, [width, height])

  const handleDragStart = (colorIndex: number) => {
    playPickupSound()
    setDraggedColor(colorIndex)
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
      return false
    }

    const colorIndex = parseInt(transferredColor, 10)

    if (isNaN(colorIndex) || colorIndex < 0 || colorIndex >= colorGradients.length) {
      playErrorSound()
      return false
    }

    if (gridState[row][col] !== null) {
      playErrorSound()
      return false
    }

    if (blockCounts[colorIndex] <= 0) {
      playErrorSound()
      return false
    }

    const newGrid = gridState.map((r) => [...r])
    newGrid[row][col] = colorIndex

    setGridState(newGrid)

    setBlockCounts((prev) => {
      const next = [...prev]
      next[colorIndex] = Math.max(0, next[colorIndex] - 1)
      return next
    })

    playDropSound()
    console.log(`Successfully placed color ${colorIndex} at ${row},${col}`)

    const scoreFound = checkAndProcessPalindromes(row, col, colorIndex, newGrid)
    if (scoreFound > 0) {
      setScore(prev => prev + scoreFound)
    }

    return true
  }

  const checkAndProcessPalindromes = (row: number, col: number, colorIdx: number, currentGrid: (number | null)[][]) => {
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
      if (segment.length >= 3) {
        const colors = segment.map((s) => s.color)
        const isPal = colors.join(",") === [...colors].reverse().join(",")

        if (isPal) {
          let segmentScore = segment.length * 10
          let hasBulldog = false
          segment.forEach((b) => {
            if (bulldogPositions.some((bp) => bp.row === b.r && bp.col === b.c)) {
              hasBulldog = true
            }
          })

          if (hasBulldog) segmentScore += 50
          scoreFound += segmentScore
        }
      }
    }

    checkLine(true)
    checkLine(false)

    return scoreFound
  }

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    alignItems: "center",
    paddingTop: 0,
    justifyContent: "space-between",
    background: theme === "dark"
      ? "linear-gradient(to right bottom, #000017, #000074)"
      : "linear-gradient(to right bottom, #FFFFFF, #F5F5F5)",
    minHeight: "100vh",
    width: "100%",
  }

  return (
    <div style={containerStyle}>
      <div style={{
        width: "100%",
        maxWidth: "100vw",
        padding: "20px", // from RN paddingVertical 20? No, original had paddingVertical: -1 which is weird, maybe typo. Let's strictly use 100% width.
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
      }}>
        <h1 style={{
          fontSize: 26,
          fontWeight: "900",
          marginBottom: 10,
          textAlign: "center",
          marginTop: 15,
          color: colors.accent,
          fontFamily: "system-ui, -apple-system, sans-serif", // Approximate RN font
          margin: "15px 0 10px 0",
        }}>PALINDROME</h1>

        <div style={{
          height: 1,
          width: "100%",
          backgroundColor: theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
        }} />

        {/* Status Row */}
        <div style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          gap: layoutConfig.statusGap,
          marginTop: layoutConfig.statusMargin.top,
          marginBottom: layoutConfig.statusMargin.bottom,
        }}>
          <div style={{
            display: "flex",
            flexDirection: "row",
            borderWidth: 1,
            borderStyle: "solid",
            borderRadius: 16,
            width: 120,
            height: 60,
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0px 3px 3px rgba(0, 0, 0, 0.1)",
            backgroundColor: theme === "dark" ? "rgba(25, 25, 91, 0.7)" : "#ffffffff",
            borderColor: colors.border,
          }}>
            <span style={{ fontSize: 16, color: colors.secondaryText, fontFamily: "system-ui" }}>Score</span>
            <span style={{ marginLeft: 16, fontSize: 28, fontWeight: "600", color: colors.accent, fontFamily: "system-ui" }}>{score}</span>
          </div>

          <div style={{}}>
            <Svg height="60" width="300">
              <Defs>
                <SvgLinearGradient id="timeGradWeb" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#95DEFE" stopOpacity="1" />
                  <Stop offset="1" stopColor="#419EEF" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              <SvgText
                fill="url(#timeGradWeb)"
                fontSize="34"
                fontFamily="Geist-Regular"
                fontWeight="bold"
                x="50%"
                y="60%"
                textAnchor="middle"
              >
                {time}
              </SvgText>
            </Svg>
          </div>

          <div style={{
            display: "flex",
            flexDirection: "row",
            borderWidth: 1,
            borderStyle: "solid",
            borderRadius: 16,
            width: 120,
            height: 60,
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0px 3px 3px rgba(0, 0, 0, 0.1)",
            backgroundColor: theme === "dark" ? "rgba(25, 25, 91, 0.7)" : "#ffffffff",
            borderColor: colors.border,
          }}>
            <span style={{ fontSize: 16, color: colors.secondaryText, fontFamily: "system-ui" }}>Hints</span>
            <span style={{ marginLeft: 16, fontSize: 28, fontWeight: "600", color: "#C35DD9", fontFamily: "system-ui" }}>{hints}</span>
          </div>
        </div>

        {/* Main Game Area */}
        <div style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
          margin: "10px 0",
          gap: layoutConfig.mainLayoutGap,
          zIndex: 1,
        }}>
          {/* Left Color Blocks */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{
              borderRadius: 14,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "Geist-Regular",
              backgroundColor: theme === "dark" ? "rgba(25, 25, 91, 0.7)" : "#f1f1f1ff",
              width: layoutConfig.colorBlockWrapper.width,
              height: layoutConfig.colorBlockWrapper.height,
            }}>
              <div style={{
                display: "flex",
                flexDirection: 'column',
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}>
                {colorGradients.map((gradient, i) => (
                  <DraggableBlock
                    key={`left-${i}`}
                    colorIndex={i}
                    gradient={gradient}
                    count={blockCounts[i]}
                    layoutConfig={layoutConfig}

                    onDragStart={handleDragStart}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Game Board */}
          <div
            ref={boardRef}
            style={{
              borderRadius: 16,
              padding: 6,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: theme === "dark" ? "rgba(25, 25, 91, 0.7)" : "#f1f1f1ff",
              width: layoutConfig.boardSize,
              height: layoutConfig.boardSize,
              zIndex: 1,
            }}
          >
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
                      borderRadius: 6,
                      margin: 3,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: theme === "dark" ? "rgba(25, 25, 91, 0.7)" : "#ffffffff",
                      transition: "all 0.1s ease",
                    }

                    if (isHovered) {
                      cellStyle.backgroundColor = theme === "dark" ? "rgba(100, 200, 255, 0.4)" : "rgba(100, 200, 255, 0.3)"
                      cellStyle.borderColor = theme === "dark" ? "rgba(100, 200, 255, 0.8)" : "rgba(50, 150, 255, 0.6)"
                      cellStyle.borderWidth = 2
                      cellStyle.boxShadow = "0 0 4px #4A9EFF"
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
                        {cellColorIndex !== null ? (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: 4,
                              background: `linear-gradient(to right bottom, ${colorGradients[cellColorIndex][0]}, ${colorGradients[cellColorIndex][1]})`,
                            }}
                          />
                        ) : (
                          <>
                            {isBulldog && (
                              <img
                                src="/bulldog.png"
                                style={{
                                  width: layoutConfig.cellSize - 14,
                                  height: layoutConfig.cellSize - 14,
                                  objectFit: "contain",
                                }}
                                alt="bulldog"
                              />
                            )}
                            {letter && (
                              <span
                                style={{
                                  color: colors.text,
                                  fontSize: layoutConfig.cellSize > 40 ? 16 : 14,
                                  fontWeight: "700",
                                  fontFamily: "system-ui",
                                }}
                              >
                                {letter}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right Color Blocks */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{
              borderRadius: 14,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "Geist-Regular",
              backgroundColor: theme === "dark" ? "rgba(25, 25, 91, 0.7)" : "#f1f1f1ff",
              width: layoutConfig.colorBlockWrapper.width,
              height: layoutConfig.colorBlockWrapper.height,
            }}>
              <div style={{
                display: "flex",
                flexDirection: 'column',
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}>
                {colorGradients.map((gradient, i) => (
                  <DraggableBlock
                    key={`right-${i}`}
                    colorIndex={i}
                    gradient={gradient}
                    count={blockCounts[i]}
                    layoutConfig={layoutConfig}
                    onDragStart={handleDragStart}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div style={{
          position: "relative",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          gap: 18,
          padding: "20px 0",
          bottom: layoutConfig.controlsBottom,
        }}>
          <Pressable>
            <div style={{
              width: 35,
              height: 35,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(to right bottom, #8ed9fc, #3c8dea)",
              cursor: 'pointer'
            }}>
              <Ionicons name="play" size={20} color="#1a63cc" />
            </div>
          </Pressable>
          <Pressable onPress={() => setPause(true)}>
            <div style={{
              width: 35,
              height: 35,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(to right bottom, #ffee60, #ffa40b)",
              cursor: 'pointer'
            }}>
              <Ionicons name="pause" size={20} color="#de5f07" />
            </div>
          </Pressable>
          <Pressable onPress={() => router.push("/profile")}>
            <div style={{
              width: 35,
              height: 35,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(to right bottom, #8ed9fc, #3c8dea)",
              cursor: 'pointer'
            }}>
              <Ionicons name="list" size={20} color="#1a63cc" />
            </div>
          </Pressable>
          <Pressable onPress={() => setSettingsVisible(true)}>
            <div style={{
              width: 35,
              height: 35,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(to right bottom, #8ed9fc, #3c8dea)",
              cursor: 'pointer'
            }}>
              <Ionicons name="settings" size={20} color="#1a63cc" />
            </div>
          </Pressable>
        </div>

        {/* Settings Modal - using fixed position div overlay */}
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
                height: "100%", // ensure center
                width: "100%",
              }}>
                <div style={{
                  width: "100%",
                  maxWidth: 340,
                  borderRadius: 24,
                  padding: 24,
                  boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.25)",
                  maxHeight: 500,
                  background: theme === "dark"
                    ? "linear-gradient(to right bottom, #000017, #000074)"
                    : "linear-gradient(to right bottom, #FFFFFF, #F5F5F5)",
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 10,
                  }}>
                    <div style={{ flex: 1 }} />
                    <span style={{
                      fontSize: 22,
                      fontWeight: "900",
                      fontFamily: "Geist-Regular, system-ui",
                      color: colors.text,
                    }}>Settings</span>
                    <Pressable onPress={() => setSettingsVisible(false)} style={{ flex: 1, alignItems: "flex-end" }}>
                      <span style={{
                        fontSize: 26,
                        fontWeight: "700",
                        fontFamily: "Geist-Regular, system-ui",
                        color: colors.accent,
                        cursor: 'pointer'
                      }}>×</span>
                    </Pressable>
                  </div>

                  <div style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 20,
                  }}>
                    <img
                      src={avatar ? avatar : require("../../assets/images/profile.jpg")}
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 25,
                        marginRight: 15,
                        objectFit: 'contain'
                      }}
                      alt="Profile"
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: colors.text,
                        fontFamily: "Geist-Regular, system-ui"
                      }}>{userName}</span>
                      <Pressable onPress={() => router.push("/profile")}>
                        <span style={{
                          fontSize: 14,
                          textDecoration: "underline",
                          marginTop: 4,
                          color: colors.accent,
                          cursor: 'pointer',
                          fontFamily: "Geist-Regular, system-ui"
                        }}>Edit Profile</span>
                      </Pressable>
                    </div>
                  </div>

                  {/* Options */}
                  <div style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 12,
                    marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 16, color: colors.text, fontFamily: "Geist-Regular, system-ui" }}>Sound</span>
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
                    marginTop: 12,
                    marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 16, color: colors.text, fontFamily: "Geist-Regular, system-ui" }}>Vibration</span>
                    <Switch
                      value={vibrationEnabled}
                      onValueChange={setVibrationEnabled}
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
                    marginTop: 12,
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

        {/* Pause Overlay */}
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
      </div>
    </div>
  )
}
