import React, { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Skull, Shield, RotateCcw, Award, Zap, Check, AlertCircle } from 'lucide-react'
import { GameState, SoundEffects } from '../types/game'
import { AvatarIcon } from './AvatarIcon'

interface ResultPhaseProps {
  gameState: GameState
  onImposterGuess: (guess: string) => void
  onPlayAgain: () => void
  soundEffects: SoundEffects
}

export const ResultPhase: React.FC<ResultPhaseProps> = ({
  gameState,
  onImposterGuess,
  onPlayAgain,
  soundEffects
}) => {
  const [guessInput, setGuessInput] = useState('')
  const isHost = gameState.is_host
  const isEliminated = gameState.eliminated_player_id === gameState.viewer_id
  const eliminatedPlayer = gameState.players.find((p) => p.id === gameState.eliminated_player_id)

  const isStealPhase = gameState.phase === 'IMPOSTER_STEAL'
  const isRevealPhase = gameState.phase === 'REVEAL_RESULT' || gameState.phase === 'ROUND_OVER'

  // Trigger confetti and sound on winner reveal
  useEffect(() => {
    if (isRevealPhase && gameState.winner) {
      soundEffects.playFanfare()
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      })
    }
  }, [isRevealPhase, gameState.winner, soundEffects])

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!guessInput.trim()) return
    soundEffects.playClick()
    onImposterGuess(guessInput.trim())
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-2xl mx-auto w-full space-y-4">
      {/* 1. Imposter Steal Mini-Game Phase */}
      {isStealPhase && (
        <div className="w-full neo-box p-6 text-center space-y-4 border-[#FF2E63]">
          <div className="w-20 h-20 rounded-3xl bg-[#FF2E63] border-[3px] border-black mx-auto flex items-center justify-center shadow-[0_4px_0_0_#000] animate-bounce-short">
            <Skull className="w-10 h-10 text-white" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-[#FFE600] text-black text-xs font-black uppercase tracking-widest inline-block mb-2 border-2 border-black shadow-[0_2px_0_0_#000]">
              FINAL STEAL CHANCE
            </span>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-[0_2px_0_#000]">
              {isEliminated ? 'GUESS & STEAL!' : 'IMPOSTER CAUGHT!'}
            </h2>
          </div>

          <p className="text-xs font-bold text-slate-300">
            {isEliminated ? (
              <span className="text-[#FFE600] block">
                You were exposed! But if you guess the Civilians' secret word right now, you steal the win!
              </span>
            ) : (
              <span>
                <strong className="text-[#FF2E63] uppercase">{eliminatedPlayer?.name}</strong> was exposed! They have one final shot to guess the secret word.
              </span>
            )}
          </p>

          {isEliminated ? (
            <form onSubmit={handleGuessSubmit} className="space-y-3 pt-2">
              <input
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Type the secret word..."
                autoFocus
                className="w-full px-4 py-3.5 rounded-2xl bg-[#0F111A] border-[3px] border-black text-[#FFE600] font-black text-center text-xl uppercase focus:outline-none focus:border-[#FFE600] shadow-[0_4px_0_0_#000]"
              />
              <button
                type="submit"
                disabled={!guessInput.trim()}
                className="w-full py-4 neo-btn neo-btn-yellow text-base"
              >
                <Zap className="w-5 h-5 mr-1.5 inline" />
                <span>STEAL THE VICTORY!</span>
              </button>
            </form>
          ) : (
            <div className="py-5 flex flex-col items-center justify-center space-y-2">
              <div className="w-8 h-8 border-4 border-[#FFE600] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-black uppercase text-slate-400">
                Waiting for the imposter's final guess...
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. Full Round Reveal Phase */}
      {isRevealPhase && (
        <div className="w-full space-y-4">
          {/* Winner Banner */}
          <div
            className={`w-full neo-box p-6 text-center flex flex-col items-center justify-center relative overflow-hidden ${
              gameState.winner === 'CIVILIANS'
                ? 'bg-[#00F0FF] text-black border-black'
                : 'bg-[#FF2E63] text-white border-black'
            }`}
          >
            <div className="w-20 h-20 rounded-3xl bg-white border-[3px] border-black flex items-center justify-center mb-3 shadow-[0_4px_0_0_#000]">
              {gameState.winner === 'CIVILIANS' ? (
                <Shield className="w-10 h-10 text-[#00F0FF] fill-current" />
              ) : (
                <Skull className="w-10 h-10 text-[#FF2E63] fill-current" />
              )}
            </div>

            <span className="px-3 py-1 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-widest mb-1">
              ROUND COMPLETE
            </span>

            <h2 className="text-4xl font-black uppercase tracking-tight drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]">
              {gameState.winner === 'CIVILIANS' ? 'CIVILIANS WIN!' : 'IMPOSTER WINS!'}
            </h2>

            {/* Steal Outcome Annotation */}
            {gameState.imposter_guess && (
              <div className="mt-3 p-2.5 rounded-xl bg-black/30 border border-black/30 text-xs font-black uppercase max-w-xs">
                {gameState.imposter_guess_correct ? (
                  <span className="text-[#FFE600]">
                    🎯 Imposter guessed "{gameState.imposter_guess}" correctly and stole the win!
                  </span>
                ) : (
                  <span>
                    Imposter guessed "{gameState.imposter_guess}" but was WRONG!
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Secret Words Reveal Board */}
          <div className="w-full neo-box p-4 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block text-center">
              The Secret Words
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#00F0FF]/15 border-2 border-black rounded-2xl text-center shadow-[0_3px_0_0_#000]">
                <span className="text-[10px] font-black text-[#00F0FF] uppercase block mb-0.5">
                  Civilians' Word
                </span>
                <span className="text-xl font-black text-white uppercase">
                  {gameState.civilian_word}
                </span>
              </div>

              <div className="p-3 bg-[#FF2E63]/15 border-2 border-black rounded-2xl text-center shadow-[0_3px_0_0_#000]">
                <span className="text-[10px] font-black text-[#FF2E63] uppercase block mb-0.5">
                  Imposter's Word
                </span>
                <span className="text-xl font-black text-white uppercase">
                  {gameState.imposter_word || 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Player Roster & Scores */}
          <div className="w-full neo-box p-4 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase text-white flex items-center">
                <Award className="w-4 h-4 mr-1.5 text-[#FFE600]" />
                Scoreboard & Roles
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {gameState.players.map((p) => {
                const role = gameState.all_roles?.[p.id] || 'CIVILIAN'
                const isImp = role === 'IMPOSTER'
                const isMrW = role === 'MR_WHITE'

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-[#0F111A] border-2 border-black shadow-[0_2px_0_0_#000] text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <AvatarIcon avatarId={p.avatar} size="xs" showBorder={false} />
                      <div>
                        <span className="font-black text-white block">{p.name}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            isImp
                              ? 'bg-[#FF2E63] text-white'
                              : isMrW
                              ? 'bg-[#A855F7] text-white'
                              : 'bg-[#00F0FF] text-black'
                          }`}
                        >
                          {role}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[#FFE600] font-black text-base font-mono">
                        {p.score} <span className="text-xs">PTS</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Play Next Round Button */}
          {isHost ? (
            <button
              onClick={() => {
                soundEffects.playClick()
                onPlayAgain()
              }}
              className="w-full py-4 neo-btn neo-btn-yellow text-base"
            >
              <RotateCcw className="w-5 h-5 mr-2 inline" />
              <span>PLAY NEXT ROUND</span>
            </button>
          ) : (
            <div className="w-full neo-box p-3 text-center text-xs font-black uppercase text-slate-400">
              Waiting for host to start the next round...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
