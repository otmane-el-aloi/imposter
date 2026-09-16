import React, { useState } from 'react'
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { ClueEntry } from '../types/game'
import { AvatarIcon } from './AvatarIcon'

interface ClueHistoryBoardProps {
  clues: ClueEntry[]
  initialOpen?: boolean
}

export const ClueHistoryBoard: React.FC<ClueHistoryBoardProps> = ({
  clues,
  initialOpen = false
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen)

  if (!clues || clues.length === 0) {
    return null
  }

  return (
    <div className="w-full neo-box overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-[#0F111A] flex items-center justify-between font-black text-xs uppercase tracking-wider text-slate-300 hover:text-white transition-colors"
      >
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-[#00F0FF]" />
          <span>Clue History ({clues.length})</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-3.5 bg-[#171B26] border-t-2 border-black space-y-2.5 max-h-56 overflow-y-auto">
          {clues.map((item, idx) => (
            <div
              key={`${item.player_id}-${idx}`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#0F111A] border-2 border-black/80 shadow-[0_2px_0_0_#000]"
            >
              <div className="flex items-center space-x-2 min-w-0 pr-2">
                <AvatarIcon avatarId={item.avatar} size="xs" showBorder={false} />
                <div className="truncate">
                  <span className="text-xs font-black text-white block truncate">
                    {item.player_name}
                  </span>
                  <span className="text-[9px] font-black uppercase text-slate-500 block">
                    Round {item.cycle}
                  </span>
                </div>
              </div>

              <div className="px-3 py-1 rounded-lg bg-[#FFE600] text-black font-black text-xs border-2 border-black max-w-[50%] truncate text-right shadow-[0_1px_0_0_#000]">
                "{item.clue}"
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
