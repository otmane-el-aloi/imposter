import React, { useState, useEffect } from 'react'
import { Clock, ArrowRight, Vote, Sparkles, MessageSquare, Send } from 'lucide-react'
import { GameState, SoundEffects } from '../types/game'
import { AvatarIcon } from './AvatarIcon'
import { ClueHistoryBoard } from './ClueHistoryBoard'

interface TurnPhaseProps {
  gameState: GameState
  onNextTurn: () => void
  onSubmitClue?: (clue: string) => void
  onStartVoting: () => void
  soundEffects: SoundEffects
}

export const TurnPhase: React.FC<TurnPhaseProps> = ({
  gameState,
  onNextTurn,
  onSubmitClue,
  onStartVoting,
  soundEffects
}) => {
  const activePlayer = gameState.players.find((p) => p.id === gameState.active_turn_player_id)
  const isMyTurn = gameState.viewer_id === gameState.active_turn_player_id
  const isHost = gameState.is_host
  const isSilent = gameState.settings.clue_mode === 'silent'
  const timerLimit = gameState.settings.clue_timer_seconds || 30

  const [timeLeft, setTimeLeft] = useState<number>(timerLimit)
  const [clueInput, setClueInput] = useState<string>('')

  // Reset timer and input on turn change
  useEffect(() => {
    setTimeLeft(timerLimit)
    setClueInput('')
  }, [gameState.active_turn_player_id, timerLimit])

  // Timer countdown and sound ticking
  useEffect(() => {
    if (timerLimit <= 0) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          soundEffects.playBuzzer()
          return 0
        }
        if (prev <= 6) {
          soundEffects.playTick()
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [gameState.active_turn_player_id, timerLimit, soundEffects])

  const progressPercent = timerLimit > 0 ? (timeLeft / timerLimit) * 100 : 100

  const handleClueSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clueInput.trim()) return
    soundEffects.playClick()
    if (onSubmitClue) {
      onSubmitClue(clueInput.trim())
    } else {
      onNextTurn()
    }
    setClueInput('')
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-5xl mx-auto w-full space-y-4 pb-20">
      {/* Header Banner */}
      <div className="w-full neo-box p-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#FFE600]" />
          <span className="text-xs font-black uppercase tracking-wider text-white">
            CLUE ROUND {gameState.clue_cycle} / {gameState.total_clue_cycles}
          </span>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase border-2 border-black ${
            isSilent ? 'bg-[#00E676] text-black' : 'bg-[#00F0FF] text-black'
          }`}
        >
          {isSilent ? '🤫 SILENT CLUES' : 'SPEAK ALOUD'}
        </span>
      </div>

      {/* Responsive Grid: Spotlight on Left, Turn Sequence & History on Right */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Column (7 cols): Speaker Spotlight & Actions */}
        <div className="w-full md:col-span-7 space-y-4">
          {/* Speaker Spotlight Card */}
          <div
            className={`w-full neo-box p-6 flex flex-col items-center text-center transition-all ${
              isMyTurn
                ? 'bg-[#1E2337] ring-4 ring-[#FFE600] scale-[1.01]'
                : 'bg-[#171B26]'
            }`}
          >
            {/* Large Character Avatar */}
            <div className="mb-3 relative">
              <AvatarIcon avatarId={activePlayer?.avatar} size="xl" />
              {isMyTurn && (
                <span className="absolute -top-2 -right-3 px-2 py-0.5 rounded-full bg-[#FFE600] text-black font-black text-[10px] border-2 border-black uppercase animate-bounce-short shadow-[0_2px_0_0_#000]">
                  YOU!
                </span>
              )}
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
              {activePlayer?.name || 'Agent'}
            </h3>

            {/* Content: Silent Mode Input vs Speaking Bubble */}
            {isSilent ? (
              isMyTurn ? (
                <form onSubmit={handleClueSubmit} className="w-full mt-4 space-y-3">
                  <div className="relative w-full">
                    <input
                      type="text"
                      maxLength={35}
                      autoFocus
                      value={clueInput}
                      onChange={(e) => setClueInput(e.target.value)}
                      placeholder="Type your 1-word or short clue..."
                      className="w-full py-3 px-4 pr-14 rounded-2xl bg-white text-black font-black text-sm border-[3px] border-black shadow-[0_4px_0_0_#000] focus:outline-none focus:ring-2 focus:ring-[#FFE600] placeholder:text-slate-400 placeholder:font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-300">
                      {clueInput.length}/35
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={!clueInput.trim()}
                    className="w-full py-3.5 neo-btn neo-btn-yellow text-sm"
                  >
                    <Send className="w-4 h-4 mr-1.5 inline" />
                    <span>Submit Clue</span>
                  </button>
                </form>
              ) : (
                <div className="w-full mt-4 comic-bubble p-4 text-center">
                  <p className="text-sm font-black text-black uppercase tracking-wide flex items-center justify-center space-x-1">
                    <span>{activePlayer?.name} is typing a clue</span>
                    <span className="inline-flex">
                      <span className="animate-pulse">.</span>
                      <span className="animate-pulse delay-75">.</span>
                      <span className="animate-pulse delay-150">.</span>
                    </span>
                  </p>
                </div>
              )
            ) : (
              <div className="w-full mt-4 comic-bubble p-4 text-center">
                <p className="text-sm font-black text-black uppercase tracking-wide">
                  {isMyTurn
                    ? '🎤 Say 1 word or brief clue aloud now!'
                    : `Shhh! ${activePlayer?.name} is giving their clue...`}
                </p>
              </div>
            )}

            {/* Timer Bar */}
            {timerLimit > 0 && (
              <div className="w-full mt-6 space-y-2">
                <div className="flex justify-between items-center text-xs font-black uppercase px-1">
                  <span className="flex items-center text-slate-400">
                    <Clock className="w-3.5 h-3.5 mr-1 text-[#00F0FF]" /> Turn Timer
                  </span>
                  <span
                    className={`font-mono text-sm ${
                      timeLeft <= 5 ? 'text-[#FF2E63] font-black animate-pulse' : 'text-[#FFE600]'
                    }`}
                  >
                    {timeLeft}s
                  </span>
                </div>
                <div className="w-full h-4 rounded-full bg-black border-2 border-black overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      timeLeft <= 5
                        ? 'bg-[#FF2E63]'
                        : timeLeft <= 10
                        ? 'bg-[#FFE600]'
                        : 'bg-[#00F0FF]'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Voice Mode Actions (Or Host Override) */}
          <div className="w-full space-y-3 pt-1">
            {!isSilent && (isMyTurn || isHost) && (
              <button
                onClick={() => {
                  soundEffects.playClick()
                  onNextTurn()
                }}
                className="w-full py-4 neo-btn neo-btn-yellow text-base"
              >
                <span>Done Speaking (Next Agent)</span>
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </button>
            )}

            {isHost && (
              <button
                onClick={() => {
                  soundEffects.playClick()
                  onStartVoting()
                }}
                className="w-full py-3.5 neo-btn neo-btn-red text-xs"
              >
                <Vote className="w-4 h-4 mr-1.5 inline" />
                <span>Skip To Accusation & Voting</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Turn Sequence & Live Clue History */}
        <div className="w-full md:col-span-5 space-y-4">
          {/* Turn Order Strip */}
          <div className="w-full neo-box p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 text-center">
              Turn Sequence
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {gameState.players
                .filter((p) => !p.is_eliminated)
                .map((p) => {
                  const isActive = p.id === gameState.active_turn_player_id
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl border-2 border-black text-xs font-black transition-all shadow-[0_2px_0_0_#000] ${
                        isActive
                          ? 'bg-[#FFE600] text-black scale-105 z-10'
                          : 'bg-[#0F111A] text-slate-300'
                      }`}
                    >
                      <AvatarIcon avatarId={p.avatar} size="xs" showBorder={false} />
                      <span className="truncate max-w-[80px]">{p.name}</span>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Clue History Board */}
          {gameState.clue_history && gameState.clue_history.length > 0 && (
            <ClueHistoryBoard clues={gameState.clue_history} initialOpen={true} />
          )}
        </div>
      </div>
    </div>
  )
}
