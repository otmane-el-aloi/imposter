import React, { useState, useEffect, useRef } from 'react'
import { ReactionEvent, SoundEffects } from '../types/game'

interface FloatingItem {
  id: number
  emoji: string
  playerName: string
  x: number
  drift: number
  rot: number
}

const REACTION_EMOJIS = [
  { emoji: '🧐', label: 'Suspect' },
  { emoji: '🤥', label: 'Liar' },
  { emoji: '🚨', label: 'Alert' },
  { emoji: '😱', label: 'Gasp' },
  { emoji: '🍿', label: 'Drama' },
  { emoji: '🤡', label: 'Clown' }
]

interface QuickReactionsProps {
  recentReaction: { id: number; data: ReactionEvent } | null
  onSendReaction: (emoji: string) => void
  soundEffects: SoundEffects
}

export const QuickReactions: React.FC<QuickReactionsProps> = ({
  recentReaction,
  onSendReaction,
  soundEffects
}) => {
  const [floatingList, setFloatingList] = useState<FloatingItem[]>([])
  const [cooldown, setCooldown] = useState<boolean>(false)
  const lastProcessedIdRef = useRef<number | null>(null)

  // Listen to incoming reactions from WebSocket
  useEffect(() => {
    if (!recentReaction || lastProcessedIdRef.current === recentReaction.id) {
      return
    }
    lastProcessedIdRef.current = recentReaction.id

    // Play pop sound effect
    soundEffects.playReactionPop()

    const newItem: FloatingItem = {
      id: recentReaction.id,
      emoji: recentReaction.data.emoji,
      playerName: recentReaction.data.player_name,
      x: 20 + Math.random() * 60, // 20% to 80% screen width
      drift: (Math.random() - 0.5) * 60, // -30px to +30px drift
      rot: (Math.random() - 0.5) * 30 // -15deg to +15deg rotation
    }

    setFloatingList((prev) => [...prev.slice(-15), newItem])

    // Cleanup after animation
    const timer = setTimeout(() => {
      setFloatingList((prev) => prev.filter((item) => item.id !== newItem.id))
    }, 2000)

    return () => clearTimeout(timer)
  }, [recentReaction, soundEffects])

  const handleEmojiClick = (emoji: string) => {
    if (cooldown) return

    setCooldown(true)
    setTimeout(() => setCooldown(false), 350)

    soundEffects.playReactionPop()
    onSendReaction(emoji)
  }

  return (
    <>
      {/* Floating Reactions Overlay (Pointer events none so clicks pass through) */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingList.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-24 flex flex-col items-center animate-float-reaction select-none"
            style={
              {
                left: `${item.x}%`,
                '--drift': `${item.drift}px`,
                '--rot': `${item.rot}deg`
              } as React.CSSProperties
            }
          >
            <span className="text-4xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
              {item.emoji}
            </span>
            <span className="px-2 py-0.5 mt-1 rounded-full bg-black/80 border border-white/20 text-[10px] font-black text-[#FFE600] uppercase tracking-wider backdrop-blur">
              {item.playerName}
            </span>
          </div>
        ))}
      </div>

      {/* Floating Reaction Pill Dock */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 max-w-sm w-auto px-2">
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#0F111A]/95 backdrop-blur-md border-[2.5px] border-black shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
          {REACTION_EMOJIS.map(({ emoji, label }) => (
            <button
              key={emoji}
              type="button"
              disabled={cooldown}
              onClick={() => handleEmojiClick(emoji)}
              title={label}
              className="p-1.5 sm:p-2 rounded-xl text-xl sm:text-2xl hover:bg-white/10 active:scale-125 transition-transform duration-75 select-none focus:outline-none disabled:opacity-60"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
