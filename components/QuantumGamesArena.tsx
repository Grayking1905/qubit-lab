'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Flame,
  HelpCircle,
  Lock,
  Maximize2,
  Minimize2,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
  Zap,
} from 'lucide-react'
import type { Circuit, GateOp, GateType } from '@/lib/api'
import { simulateLocal } from '@/lib/simulator'
import { blochFromStatevector, type BlochCoords } from '@/lib/quantum'
import {
  QUANTUM_GAMES,
  loadGamesProgress,
  saveGamesProgress,
  isLevelUnlocked,
  calculateGameStats,
  type GameDef,
  type GameLevel,
  type GamesProgressState,
} from '@/lib/quantumGames'
import { playPopUp, playPopDown, playSuccess, playError } from '@/lib/sounds'
import BlochNavigator3DClient from '@/components/games/BlochNavigator3DClient'
import EntanglementNetwork3DClient from '@/components/games/EntanglementNetwork3DClient'
import OracleHunter3DClient from '@/components/games/OracleHunter3DClient'
import QuantumShield3DClient from '@/components/games/QuantumShield3DClient'

interface QuantumGamesArenaProps {
  onAwardXp?: (xp: number) => void
  onOpenBuilder?: (c: Circuit) => void
}

export default function QuantumGamesArena({ onAwardXp, onOpenBuilder }: QuantumGamesArenaProps) {
  const [progress, setProgress] = useState<GamesProgressState>({ totalXp: 0, gameProgress: {} })
  const [activeGameId, setActiveGameId] = useState<string | null>(null)
  const [activeLevelNumber, setActiveLevelNumber] = useState<number>(1)

  // In-game circuit & multi-qubit management state
  const [circuit, setCircuit] = useState<Circuit>({ qubits: 1, gates: [] })
  const [selectedQubit, setSelectedQubit] = useState<number>(0)
  const [pendingCnot, setPendingCnot] = useState<{ control: number } | null>(null)
  const [winModalOpen, setWinModalOpen] = useState(false)
  const [winDetails, setWinDetails] = useState<{ stars: number; xpEarned: number; gates: number } | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [verifyFeedback, setVerifyFeedback] = useState<string | null>(null)
  const [expandedStage, setExpandedStage] = useState(false)

  // Load progress on mount
  useEffect(() => {
    setProgress(loadGamesProgress())
  }, [])

  const activeGame: GameDef | undefined = useMemo(
    () => QUANTUM_GAMES.find(g => g.id === activeGameId),
    [activeGameId]
  )

  const activeLevel: GameLevel | undefined = useMemo(
    () => activeGame?.levels.find(l => l.levelNumber === activeLevelNumber),
    [activeGame, activeLevelNumber]
  )

  // Initialize circuit when level changes
  useEffect(() => {
    if (!activeLevel) return
    const initial: Circuit = activeLevel.initialCircuit
      ? {
          qubits: activeLevel.initialCircuit.qubits,
          gates: activeLevel.initialCircuit.gates.map(g => ({ ...g })),
        }
      : { qubits: activeLevel.qubits, gates: [] }

    setCircuit(initial)
    setSelectedQubit(0)
    setPendingCnot(null)
    setWinModalOpen(false)
    setWinDetails(null)
    setShowHint(false)
    setVerifyFeedback(null)
  }, [activeLevel])

  // Run local zero-latency simulation on circuit
  const simResult = useMemo(() => {
    if (!activeLevel) return null
    try {
      return simulateLocal(circuit)
    } catch {
      return null
    }
  }, [circuit, activeLevel])

  // Derive per-qubit Bloch coordinates based on actual circuit qubits
  const blochCoords: BlochCoords[] = useMemo(() => {
    if (!simResult) return []
    return Array.from({ length: circuit.qubits }, (_, q) =>
      blochFromStatevector(simResult.finalStatevector, q, circuit.qubits)
    )
  }, [simResult, circuit.qubits])

  // Distance calculation for bloch_target
  const targetDistance = useMemo(() => {
    if (!activeLevel?.goal.targetBloch || blochCoords.length === 0) return null
    const c = blochCoords[selectedQubit] ?? blochCoords[0]
    return Math.hypot(
      c.x - activeLevel.goal.targetBloch.x,
      c.y - activeLevel.goal.targetBloch.y,
      c.z - activeLevel.goal.targetBloch.z
    )
  }, [activeLevel, blochCoords, selectedQubit])

  // Check goal satisfaction
  const isGoalSatisfied = useMemo(() => {
    if (!activeLevel || !simResult) return false
    const { goal } = activeLevel

    if (goal.type === 'bloch_target' && goal.targetBloch) {
      // Check if target reached on any qubit or selected qubit
      const tol = goal.tolerance ?? 0.2
      return blochCoords.some(c => {
        const dist = Math.hypot(
          c.x - goal.targetBloch!.x,
          c.y - goal.targetBloch!.y,
          c.z - goal.targetBloch!.z
        )
        return dist <= tol
      })
    }

    if (goal.type === 'probability' && goal.targetProbability) {
      const probs = simResult.probabilities
      for (const [state, expected] of Object.entries(goal.targetProbability)) {
        const actual = probs[state] ?? 0
        if (Math.abs(actual - expected) > 0.12) return false
      }
      return true
    }

    return false
  }, [activeLevel, simResult, blochCoords])

  // Total player metrics across all games
  const overallStats = useMemo(() => {
    let totalCompleted = 0
    let totalStars = 0
    let totalLevels = 0

    QUANTUM_GAMES.forEach(g => {
      const stats = calculateGameStats(progress, g.id)
      totalCompleted += stats.completedLevels
      totalStars += stats.stars
      totalLevels += stats.totalLevels
    })

    return { totalCompleted, totalStars, totalLevels, totalXp: progress.totalXp }
  }, [progress])

  // Add or remove qubits
  const changeQubits = (delta: number) => {
    const minQubits = activeLevel ? activeLevel.qubits : 1
    const next = Math.max(minQubits, Math.min(5, circuit.qubits + delta))
    if (next === circuit.qubits) return
    const filteredGates = circuit.gates.filter(
      g => g.qubit < next && (g.target === undefined || g.target === null || g.target < next)
    )
    setCircuit({ qubits: next, gates: filteredGates })
    if (selectedQubit >= next) setSelectedQubit(next - 1)
    playPopUp()
  }

  // User places a single-qubit gate on the selected qubit
  const handlePlaceGate = (type: GateType, targetQubit = selectedQubit) => {
    if (!activeLevel) return
    if (circuit.gates.length >= activeLevel.maxGates) {
      playError()
      setVerifyFeedback(`Maximum pulse budget reached (${activeLevel.maxGates} gates). Reset to try again.`)
      return
    }

    const nextStep = circuit.gates.length
    const newGate: GateOp = { type, qubit: targetQubit, step: nextStep }
    setCircuit(prev => ({
      ...prev,
      gates: [...prev.gates, newGate],
    }))
    playPopDown()
    setVerifyFeedback(null)
  }

  // Handle CNOT placement across any two qubits
  const handleCnotClick = (qubit: number) => {
    if (!activeLevel) return
    if (circuit.gates.length >= activeLevel.maxGates) {
      playError()
      setVerifyFeedback(`Maximum pulse budget reached (${activeLevel.maxGates} gates).`)
      return
    }

    if (!pendingCnot) {
      setPendingCnot({ control: qubit })
      playPopUp()
    } else {
      if (pendingCnot.control === qubit) {
        setPendingCnot(null)
        playPopDown()
        return
      }
      const nextStep = circuit.gates.length
      const newGate: GateOp = {
        type: 'CNOT',
        qubit: pendingCnot.control,
        target: qubit,
        step: nextStep,
      }
      setCircuit(prev => ({
        ...prev,
        gates: [...prev.gates, newGate],
      }))
      setPendingCnot(null)
      playPopDown()
      setVerifyFeedback(null)
    }
  }

  // Remove a specific gate by index
  const handleRemoveGate = (gateIndex: number) => {
    setCircuit(prev => ({
      ...prev,
      gates: prev.gates.filter((_, idx) => idx !== gateIndex),
    }))
    setPendingCnot(null)
    playPopDown()
    setVerifyFeedback(null)
  }

  // Remove the most recent gate
  const handleUndo = () => {
    if (circuit.gates.length === 0) return
    setCircuit(prev => ({
      ...prev,
      gates: prev.gates.slice(0, -1),
    }))
    setPendingCnot(null)
    playPopDown()
    setVerifyFeedback(null)
  }

  // Reset circuit to level initial state
  const handleReset = () => {
    if (!activeLevel) return
    const initial: Circuit = activeLevel.initialCircuit
      ? {
          qubits: activeLevel.initialCircuit.qubits,
          gates: activeLevel.initialCircuit.gates.map(g => ({ ...g })),
        }
      : { qubits: activeLevel.qubits, gates: [] }
    setCircuit(initial)
    setSelectedQubit(0)
    setPendingCnot(null)
    playPopDown()
    setVerifyFeedback(null)
  }

  // Verify solution and trigger win state
  const handleVerify = () => {
    if (!activeGame || !activeLevel) return

    if (isGoalSatisfied) {
      const gatesCount = circuit.gates.length
      let stars = 1
      if (gatesCount <= activeLevel.threeStarMaxGates) stars = 3
      else if (gatesCount <= activeLevel.twoStarMaxGates) stars = 2

      const prevProg = progress.gameProgress[activeGame.id]?.[activeLevel.levelNumber]
      const wasCompleted = !!prevProg?.completed
      const xpGained = wasCompleted ? 0 : activeLevel.xpReward

      const updatedProgress: GamesProgressState = {
        totalXp: progress.totalXp + xpGained,
        gameProgress: {
          ...progress.gameProgress,
          [activeGame.id]: {
            ...(progress.gameProgress[activeGame.id] ?? {}),
            [activeLevel.levelNumber]: {
              completed: true,
              stars: Math.max(stars, prevProg?.stars ?? 0),
              bestGateCount: Math.min(gatesCount, prevProg?.bestGateCount ?? 999),
              xpEarned: Math.max(activeLevel.xpReward, prevProg?.xpEarned ?? 0),
            },
          },
        },
      }

      setProgress(updatedProgress)
      saveGamesProgress(updatedProgress)

      if (xpGained > 0 && onAwardXp) {
        onAwardXp(xpGained)
      }

      setWinDetails({ stars, xpEarned: xpGained, gates: gatesCount })
      setWinModalOpen(true)
      playSuccess()
    } else {
      playError()
      setVerifyFeedback('Target not reached yet. Inspect the 3D model, review the hint, and refine your gate pulses!')
    }
  }

  // Next level navigation
  const handleNextLevel = () => {
    if (!activeGame) return
    const nextNum = activeLevelNumber + 1
    if (nextNum <= activeGame.levels.length) {
      setActiveLevelNumber(nextNum)
      setWinModalOpen(false)
      playPopUp()
    } else {
      setActiveGameId(null)
      setWinModalOpen(false)
      playSuccess()
    }
  }

  // Non-zero probability entries
  const probEntries = useMemo(() => {
    if (!simResult) return []
    return Object.entries(simResult.probabilities)
      .filter(([, p]) => p > 0.01)
      .sort(([a], [b]) => a.localeCompare(b))
  }, [simResult])

  // ─────────────────────────────────────────────────────────────────────────
  // View 1: Master Games Catalog
  // ─────────────────────────────────────────────────────────────────────────
  if (!activeGame) {
    return (
      <div className="games-arena-container">
        {/* Arena Hero */}
        <div className="arena-hero">
          <div className="arena-hero-copy">
            <div className="arena-badge-row">
              <span className="arena-badge">
                <Trophy size={13} /> QUANTUM ARCADE & 3D SIMULATOR
              </span>
              <span className="arena-badge orange">
                <Flame size={13} /> {overallStats.totalXp} TOTAL GAMES XP
              </span>
            </div>
            <h1>
              Quantum <em>Games Arena</em>
            </h1>
            <p className="arena-lede">
              Play your way into quantum computing mastery. Control superconducting transmons, route satellite quantum internet repeaters, screen drug molecules with Grover search, and defuse cosmic errors with surface codes across 48 immersive 3D challenges.
            </p>
          </div>

          {/* Player Stats Podium */}
          <div className="arena-stats-podium">
            <div className="podium-item">
              <span className="podium-num">{overallStats.totalCompleted}/{overallStats.totalLevels}</span>
              <span className="podium-label">LEVELS BEATEN</span>
            </div>
            <div className="podium-item highlight">
              <span className="podium-num">⭐ {overallStats.totalStars}</span>
              <span className="podium-label">STARS EARNED</span>
            </div>
            <div className="podium-item">
              <span className="podium-num">+{overallStats.totalXp}</span>
              <span className="podium-label">XP REWARDED</span>
            </div>
          </div>
        </div>

        {/* 4 Games Grid */}
        <div className="games-catalog-grid">
          {QUANTUM_GAMES.map(game => {
            const stats = calculateGameStats(progress, game.id)
            const percent = Math.round((stats.completedLevels / stats.totalLevels) * 100)

            return (
              <motion.div
                key={game.id}
                className="game-catalog-card"
                whileHover={{ y: -5, borderColor: 'var(--orange)' }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  setActiveGameId(game.id)
                  const firstIncomplete = game.levels.find(
                    lvl => !progress.gameProgress[game.id]?.[lvl.levelNumber]?.completed
                  )
                  setActiveLevelNumber(firstIncomplete ? firstIncomplete.levelNumber : 1)
                  playPopUp()
                }}
              >
                <div className="game-card-head">
                  <div className="game-card-icon">{game.icon}</div>
                  <div className="game-card-tags">
                    <span className="tag orange">{game.badge}</span>
                    <span className="tag blue">{game.levels.length} LEVELS</span>
                  </div>
                </div>

                <h3>{game.title}</h3>
                <p className="game-card-desc">{game.description}</p>

                {/* Real Life Implementation Highlight */}
                <div className="hardware-callout">
                  <strong className="hardware-label">REAL-WORLD IMPLEMENTATION:</strong>
                  <span className="hardware-text">{game.hardwareImplementation}</span>
                </div>

                {/* Level Progress Bar & Stars */}
                <div className="game-card-progress">
                  <div className="progress-info">
                    <span>
                      {stats.completedLevels} / {stats.totalLevels} Levels
                    </span>
                    <span className="stars-earned">
                      ⭐ {stats.stars} / {stats.maxStars}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <div className="game-card-footer">
                  <button className="pill-btn small full-width">
                    Play Game <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // View 2: In-Game Level Player
  // ─────────────────────────────────────────────────────────────────────────
  const gameStats = calculateGameStats(progress, activeGame.id)

  return (
    <div className="game-player-container">
      {/* Game Header Bar */}
      <div className="game-player-head">
        <button
          className="outline-btn small back-btn"
          onClick={() => {
            setActiveGameId(null)
            playPopDown()
          }}
        >
          <ArrowLeft size={14} /> Back to Games Arena
        </button>

        <div className="game-title-strip">
          <span className="game-icon-small">{activeGame.icon}</span>
          <div>
            <h2>{activeGame.title}</h2>
            <p className="muted-small">{activeGame.category}</p>
          </div>
        </div>

        <div className="game-stars-tally">
          <span>⭐ {gameStats.stars} / {gameStats.maxStars} Stars</span>
          <span className="xp-tally">+{gameStats.xp} XP</span>
        </div>
      </div>

      {/* 12-Level Selector Strip */}
      <div className="levels-scroller">
        {activeGame.levels.map(lvl => {
          const unlocked = isLevelUnlocked(progress, activeGame.id, lvl.levelNumber)
          const lvlProg = progress.gameProgress[activeGame.id]?.[lvl.levelNumber]
          const isCurrent = lvl.levelNumber === activeLevelNumber

          return (
            <button
              key={lvl.levelNumber}
              className={`level-pill ${isCurrent ? 'active' : ''} ${unlocked ? 'unlocked' : 'locked'} ${lvlProg?.completed ? 'completed' : ''}`}
              disabled={!unlocked}
              onClick={() => {
                setActiveLevelNumber(lvl.levelNumber)
                playPopUp()
              }}
            >
              <div className="level-pill-num">
                {unlocked ? (
                  <span>{lvl.levelNumber}</span>
                ) : (
                  <Lock size={11} className="lock-icon" />
                )}
              </div>
              <div className="level-pill-stars">
                {lvlProg?.completed ? (
                  Array.from({ length: 3 }, (_, i) => (
                    <span
                      key={i}
                      className={i < lvlProg.stars ? 'star-gold' : 'star-dim'}
                    >
                      ★
                    </span>
                  ))
                ) : (
                  <span className="level-xp-badge">+{lvl.xpReward}XP</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Active Level Arena Grid */}
      {activeLevel && (
        <div className="level-arena-grid">
          {/* Left Column: Mission Brief, Qubit Selector, & Pulse Controls */}
          <div className="arena-left-pane">
            {/* Mission Objective Card */}
            <div className="mission-card">
              <div className="mission-card-head">
                <span className="tag orange">LEVEL {activeLevel.levelNumber}</span>
                <span className="tag blue">{activeLevel.subtitle.toUpperCase()}</span>
                <span className="xp-reward-tag">+{activeLevel.xpReward} XP</span>
              </div>

              <h3>{activeLevel.title}</h3>
              <p className="mission-concept">
                <strong>Core Concept:</strong> {activeLevel.concept}
              </p>
              <p className="mission-instructions">{activeLevel.instructions}</p>

              {/* Real-Life Implementation Callout */}
              <div className="real-life-box">
                <div className="real-life-head">
                  <Zap size={14} className="real-life-icon" />
                  <strong>Real-World Hardware Application:</strong>
                </div>
                <p>{activeLevel.realLifeApplication}</p>
              </div>

              {/* Hint Box Toggle */}
              <div className="hint-section">
                <button
                  className="hint-toggle-btn"
                  onClick={() => setShowHint(!showHint)}
                >
                  <HelpCircle size={14} />
                  <span>{showHint ? 'Hide Quantum Hint' : 'Need a Hint?'}</span>
                </button>
                {showHint && (
                  <motion.div
                    className="hint-content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    {activeLevel.hint}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Qubit Manager & Active Wire Selector */}
            <div className="qubit-management-card">
              <div className="qubit-management-head">
                <span className="muted-label">ACTIVE TARGET QUBIT</span>
                <div className="add-qubit-controls">
                  <button
                    className="outline-btn tiny"
                    onClick={() => changeQubits(-1)}
                    disabled={circuit.qubits <= (activeLevel?.qubits ?? 1)}
                    title="Remove auxiliary qubit"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="qubit-count-badge">{circuit.qubits} Qubits</span>
                  <button
                    className="outline-btn tiny"
                    onClick={() => changeQubits(1)}
                    disabled={circuit.qubits >= 5}
                    title="Add auxiliary qubit"
                  >
                    <Plus size={11} /> Add Qubit
                  </button>
                </div>
              </div>

              {/* Select target qubit pill row */}
              <div className="qubit-selector-row">
                {Array.from({ length: circuit.qubits }, (_, q) => (
                  <button
                    key={q}
                    className={`qubit-select-btn ${selectedQubit === q ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedQubit(q)
                      playPopDown()
                    }}
                  >
                    <strong>q{q}</strong>
                    <span>{q === 0 ? 'Data' : 'Ancilla'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gate Controls Card */}
            <div className="gate-controls-card">
              <div className="controls-card-head">
                <span className="muted-label">PULSE PALETTE (TARGET: Q{selectedQubit})</span>
                <span className="gate-counter-badge">
                  {circuit.gates.length} / {activeLevel.maxGates} Gates
                </span>
              </div>

              {/* Star Thresholds Bar */}
              <div className="star-thresholds">
                <span className={circuit.gates.length <= activeLevel.threeStarMaxGates ? 'threshold active' : 'threshold'}>
                  ⭐⭐⭐ ≤ {activeLevel.threeStarMaxGates} gates
                </span>
                <span className={circuit.gates.length <= activeLevel.twoStarMaxGates ? 'threshold active' : 'threshold'}>
                  ⭐⭐ ≤ {activeLevel.twoStarMaxGates} gates
                </span>
              </div>

              {/* Gate Palette Buttons */}
              <div className="gate-palette-row">
                {activeLevel.allowedGates.map(gType => {
                  if (gType === 'CNOT') {
                    return (
                      <button
                        key="cnot"
                        className={`game-gate-btn cnot ${pendingCnot ? 'pending' : ''}`}
                        onClick={() => handleCnotClick(selectedQubit)}
                        title="Click control qubit then target"
                      >
                        <b>CNOT</b>
                        <span>
                          {pendingCnot
                            ? `q${pendingCnot.control} → q?`
                            : `Control q${selectedQubit}`}
                        </span>
                      </button>
                    )
                  }

                  return (
                    <button
                      key={gType}
                      className="game-gate-btn"
                      onClick={() => handlePlaceGate(gType, selectedQubit)}
                      disabled={circuit.gates.length >= activeLevel.maxGates}
                    >
                      <b>{gType}</b>
                      <span>on q{selectedQubit}</span>
                    </button>
                  )
                })}
              </div>

              {/* Multi-Wire Circuit Timeline Grid */}
              <div className="circuit-wires-card">
                <span className="muted-label">CIRCUIT TIMELINE WIRES</span>
                <div className="wires-container">
                  {Array.from({ length: circuit.qubits }, (_, q) => {
                    const wireGates = circuit.gates
                      .map((g, idx) => ({ ...g, originalIndex: idx }))
                      .filter(g => g.qubit === q || g.target === q)

                    return (
                      <div
                        key={q}
                        className={`wire-row ${selectedQubit === q ? 'active-wire' : ''}`}
                        onClick={() => setSelectedQubit(q)}
                      >
                        <span className="wire-label">q{q}</span>
                        <div className="wire-line">
                          <div className="wire-lead">|0⟩</div>
                          <div className="wire-gates-area">
                            {wireGates.length === 0 ? (
                              <span className="empty-wire-text">Click palette to pulse q{q}</span>
                            ) : (
                              wireGates.map(g => {
                                const isControl = g.type === 'CNOT' && g.qubit === q
                                const isTarget = g.type === 'CNOT' && g.target === q

                                return (
                                  <div
                                    key={g.originalIndex}
                                    className="gate-wire-chip"
                                    onClick={e => {
                                      e.stopPropagation()
                                      handleRemoveGate(g.originalIndex)
                                    }}
                                    title="Click to remove gate"
                                  >
                                    <span>
                                      {isControl ? '•' : isTarget ? '⊕' : g.type}
                                    </span>
                                    <X size={10} className="remove-x-icon" />
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="game-action-buttons">
                <button
                  className="outline-btn small"
                  onClick={handleUndo}
                  disabled={circuit.gates.length === 0}
                >
                  Undo
                </button>
                <button
                  className="outline-btn small"
                  onClick={handleReset}
                  disabled={circuit.gates.length === 0}
                >
                  <RotateCcw size={13} /> Reset
                </button>
                <button
                  className="pill-btn verify-btn"
                  onClick={handleVerify}
                >
                  <CheckCircle2 size={16} /> Test & Verify Solution
                </button>
              </div>

              {verifyFeedback && (
                <div className="verify-feedback-banner">
                  {verifyFeedback}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: 3D Quantum Visualization Stage & Measurement Readout */}
          <div className="arena-right-pane">
            <div className={`stage-3d-card ${expandedStage ? 'expanded' : ''}`}>
              <div className="stage-head">
                <span className="stage-live-badge">● LIVE 3D QUANTUM MODEL</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {activeLevel.goal.targetKet && (
                    <span className="target-goal-badge">
                      GOAL: {activeLevel.goal.targetKet}
                    </span>
                  )}
                  <button
                    className="icon-btn tiny"
                    onClick={() => setExpandedStage(!expandedStage)}
                    title={expandedStage ? 'Collapse view' : 'Expand view'}
                  >
                    {expandedStage ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  </button>
                </div>
              </div>

              <div className={`game-3d-canvas-wrap ${expandedStage ? 'expanded' : ''}`}>
                {activeGame.id === 'bloch-navigator' && (
                  <BlochNavigator3DClient
                    currentCoords={blochCoords[selectedQubit] ?? blochCoords[0] ?? { x: 0, y: 0, z: 1 }}
                    targetCoords={activeLevel.goal.targetBloch}
                    obstacles={activeLevel.goal.obstacles}
                    isSuccess={isGoalSatisfied}
                  />
                )}

                {activeGame.id === 'entanglement-network' && (
                  <EntanglementNetwork3DClient
                    qubits={circuit.qubits}
                    blochCoords={blochCoords}
                    isEntangled={circuit.gates.some(g => g.type === 'CNOT')}
                    isSuccess={isGoalSatisfied}
                  />
                )}

                {activeGame.id === 'oracle-hunter' && simResult && (
                  <OracleHunter3DClient
                    probabilities={simResult.probabilities}
                    targetKet={activeLevel.goal.targetKet}
                    isSuccess={isGoalSatisfied}
                  />
                )}

                {activeGame.id === 'quantum-shield' && (
                  <QuantumShield3DClient
                    qubits={circuit.qubits}
                    blochCoords={blochCoords}
                    isSuccess={isGoalSatisfied}
                    initialErrors={activeLevel.initialCircuit?.gates.map(g => g.qubit) ?? []}
                  />
                )}
              </div>

              {/* Real-time State & Probability Readout */}
              <div className="stage-readout-panel">
                <div className="readout-header">
                  <span className="muted-label">MEASUREMENT PROBABILITIES</span>
                  {targetDistance !== null && (
                    <span className="distance-label">
                      Distance to Target: <strong>{targetDistance.toFixed(3)}</strong> (Tol: ≤ {activeLevel.goal.tolerance ?? 0.2})
                    </span>
                  )}
                </div>

                <div className="prob-micro-bars">
                  {probEntries.map(([state, p]) => (
                    <div key={state} className="micro-bar-item">
                      <span className="micro-bar-ket">|{state}⟩</span>
                      <div className="micro-bar-track">
                        <motion.div
                          className="micro-bar-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${p * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="micro-bar-pct">{(p * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Metric Footer */}
              <div className="stage-footer">
                <div className="status-metric">
                  <span className="metric-label">STATUS</span>
                  <strong className={isGoalSatisfied ? 'metric-val success' : 'metric-val'}>
                    {isGoalSatisfied ? 'TARGET ACQUIRED (100% FIDELITY)' : 'NAVIGATING...'}
                  </strong>
                </div>
                {onOpenBuilder && (
                  <button
                    className="outline-btn tiny"
                    onClick={() => onOpenBuilder(circuit)}
                  >
                    Open in Builder →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Level Win Modal */}
      <AnimatePresence>
        {winModalOpen && winDetails && activeLevel && (
          <div className="game-win-overlay">
            <motion.div
              className="game-win-modal"
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
            >
              <div className="win-modal-header">
                <Sparkles size={32} className="win-sparkle-icon" />
                <h2>LEVEL COMPLETE!</h2>
                <p className="muted">Quantum fidelity verified at 100% accuracy</p>
              </div>

              {/* Star Rating Animation */}
              <div className="win-stars-row">
                {Array.from({ length: 3 }, (_, i) => (
                  <motion.span
                    key={i}
                    className={i < winDetails.stars ? 'win-star active' : 'win-star dim'}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2 + i * 0.15 }}
                  >
                    ⭐
                  </motion.span>
                ))}
              </div>

              {/* XP Award Pill */}
              <div className="win-xp-badge">
                <Flame size={18} className="xp-flame" />
                <span>+{winDetails.xpEarned} XP AWARDED</span>
              </div>

              <div className="win-summary-box">
                <div className="win-summary-item">
                  <span className="summary-label">PULSES USED</span>
                  <strong className="summary-val">{winDetails.gates} gates</strong>
                </div>
                <div className="win-summary-item">
                  <span className="summary-label">3-STAR BUDGET</span>
                  <strong className="summary-val">≤ {activeLevel.threeStarMaxGates} gates</strong>
                </div>
                <div className="win-summary-item">
                  <span className="summary-label">DIFFICULTY</span>
                  <strong className="summary-val">{activeLevel.subtitle}</strong>
                </div>
              </div>

              {/* Real World Impact Reminder */}
              <div className="win-impact-box">
                <strong>Physics Milestone:</strong>
                <p>{activeLevel.realLifeApplication}</p>
              </div>

              <div className="win-modal-actions">
                <button
                  className="outline-btn"
                  onClick={() => setWinModalOpen(false)}
                >
                  Review Circuit
                </button>
                <button
                  className="pill-btn win-next-btn"
                  onClick={handleNextLevel}
                >
                  Next Level <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
