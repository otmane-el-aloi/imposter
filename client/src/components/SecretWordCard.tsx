import React, { useState } from 'react'
import { Eye, EyeOff, Shield, Skull, HelpCircle, Check, Lock } from 'lucide-react'
import { GameState, SoundEffects } from '../types/game'
import { AvatarIcon } from './AvatarIcon'

interface SecretWordCardProps {
  gameState: GameState
  onMarkSeen: () => void
  soundEffects: SoundEffects
}

export const SecretWordCard: React.FC<SecretWordCardProps> = ({
  gameState,
  onMarkSeen,
  soundEffects
}) => {
  const [isRevealed, setIsRevealed] = useState(false)
  const myPlayer = gameState.players.find((p) => p.id === gameState.viewer_id)
  const hasSeen = myPlayer?.has_seen_role || false

  const handleTouchStart = (e: React.SyntheticEvent) => {
    if (e.cancelable) e.preventDefault()
    setIsRevealed(true)
    soundEffects.playCardFlip()
  }

  const handleTouchEnd = () => {
    setIsRevealed(false)
  }

  const isImposter = gameState.my_role === 'IMPOSTER'
  const isMrWhite = gameState.my_role === 'MR_WHITE'

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto w-full space-y-4">
      {/* Category Header */}
      <div className="w-full neo-box p-3.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#00F0FF] block">
            ROUND {gameState.round_number}
          </span>
          <span className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
            {gameState.category}
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-xl bg-[#FFE600] text-black font-black text-xs uppercase border-2 border-black shadow-[0_2px_0_0_#000]">
          CLASSIFIED
        </span>
      </div>

      {/* Secret Card Container */}
      <div
        className={`w-full aspect-[4/5] max-h-[420px] rounded-3xl border-[3.5px] border-black transition-all duration-150 flex flex-col items-center justify-center p-6 sm:p-8 relative cursor-pointer select-none ${
          isRevealed
            ? isImposter
              ? 'bg-[#FF2E63] text-white shadow-[0_8px_0_0_#000]'
              : isMrWhite
              ? 'bg-[#A855F7] text-white shadow-[0_8px_0_0_#000]'
              : 'bg-[#00F0FF] text-black shadow-[0_8px_0_0_#000]'
            : 'bg-[#171B26] hover:bg-[#1E2337] active:translate-y-2 active:shadow-[0_2px_0_0_#000] shadow-[0_8px_0_0_#000]'
        }`}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {!isRevealed ? (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-[#FFE600] border-[3px] border-black flex items-center justify-center shadow-[0_4px_0_0_#000] animate-bounce-short">
              <EyeOff className="w-10 h-10 text-black stroke-[2.5]" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-black/40 text-[#FFE600] text-xs font-black uppercase tracking-widest inline-block mb-2">
                TOP SECRET
              </span>
              <h3 className="text-2xl font-black text-white tracking-wide uppercase drop-shadow-[0_2px_0_#000]">
                HOLD TO PEEK
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-1 max-w-[220px]">
                Keep screen tilted away. Releasing hides the word instantly!
              </p>
            </div>

            {/* Tap prompt bar */}
            <div className="w-full max-w-[200px] h-3 rounded-full bg-black/40 border-2 border-black overflow-hidden mt-2">
              <div className="h-full w-full bg-[#FFE600] animate-pulse" />
            </div>
          </div>
        ) : (
          /* Revealed Card State */
          <div className="flex flex-col items-center text-center space-y-3 animate-in zoom-in-95 duration-100 w-full">
            {/* Role Stamp */}
            <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-2xl bg-black text-white text-xs font-black tracking-widest uppercase border-2 border-white/20 shadow-[0_3px_0_0_rgba(0,0,0,0.5)]">
              {isImposter ? (
                <>
                  <Skull className="w-4 h-4 text-[#FF2E63]" />
                  <span className="text-[#FF2E63]">YOU ARE THE IMPOSTER</span>
                </>
              ) : isMrWhite ? (
                <>
                  <HelpCircle className="w-4 h-4 text-[#FFE600]" />
                  <span className="text-[#FFE600]">YOU ARE MR. WHITE</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-[#00F0FF]" />
                  <span className="text-[#00F0FF]">YOU ARE A CIVILIAN</span>
                </>
              )}
            </div>

            {/* Secret Word Box */}
            <div className="w-full py-4 px-2 bg-white/90 border-[3px] border-black rounded-2xl shadow-[0_4px_0_0_#000]">
              <span className="text-[10px] font-black text-black/60 uppercase tracking-widest block mb-0.5">
                YOUR SECRET WORD
              </span>
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-black uppercase break-words block drop-shadow-sm">
                {gameState.my_word}
              </span>
            </div>

            {/* Chameleon Hint */}
            {gameState.hint && (
              <div className="bg-black/80 px-3 py-1.5 rounded-xl border border-white/20">
                <p className="text-xs font-bold text-white">
                  Topic: <span className="text-[#FFE600] font-black">{gameState.hint}</span>
                </p>
              </div>
            )}

            <p className="text-xs font-black uppercase tracking-wider text-black/80">
              {isImposter
                ? 'Blend in! Guess what they have.'
                : 'Give subtle clues. Catch the spy!'}
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Button */}
      <button
        onClick={() => {
          soundEffects.playClick()
          onMarkSeen()
        }}
        className={`w-full py-4 neo-btn text-base ${
          hasSeen ? 'neo-btn-dark' : 'neo-btn-lime'
        }`}
      >
        <Check className="w-5 h-5 mr-1.5 inline" />
        <span>{hasSeen ? 'WORD MEMORIZED (WAITING)' : 'I MEMORIZED MY WORD'}</span>
      </button>

      {/* Roster of who has memorized */}
      <div className="w-full neo-box p-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">
          Operatives Status
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {gameState.players.map((p) => (
            <div
              key={p.id}
              className={`px-2.5 py-1 rounded-xl border-2 border-black text-xs font-black flex items-center space-x-1.5 shadow-[0_2px_0_0_#000] ${
                p.has_seen_role
                  ? 'bg-[#00E676] text-black'
                  : 'bg-[#0F111A] text-slate-400'
              }`}
            >
              <AvatarIcon avatarId={p.avatar} size="xs" showBorder={false} />
              <span>{p.name}</span>
              {p.has_seen_role && <span>✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
