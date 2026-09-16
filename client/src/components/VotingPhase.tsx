import React, { useState } from 'react'
import { Target, CheckCircle2, AlertTriangle, Check } from 'lucide-react'
import { GameState, SoundEffects } from '../types/game'
import { AvatarIcon } from './AvatarIcon'
import { ClueHistoryBoard } from './ClueHistoryBoard'

interface VotingPhaseProps {
  gameState: GameState
  onVote: (targetId: string) => void
  soundEffects: SoundEffects
}

export const VotingPhase: React.FC<VotingPhaseProps> = ({
  gameState,
  onVote,
  soundEffects
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
  const myPlayer = gameState.players.find((p) => p.id === gameState.viewer_id)
  const hasVoted = myPlayer?.has_voted || false
  const isEliminated = myPlayer?.is_eliminated || false

  const alivePlayers = gameState.players.filter((p) => !p.is_eliminated)
  const totalVotesCast = alivePlayers.filter((p) => p.has_voted).length

  const handleSelect = (playerId: string) => {
    if (hasVoted || isEliminated) return
    soundEffects.playClick()
    setSelectedTargetId(playerId)
  }

  const handleConfirmVote = () => {
    if (!selectedTargetId) return
    soundEffects.playBuzzer()
    onVote(selectedTargetId)
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-5xl mx-auto w-full space-y-4 pb-20">
      {/* Header Banner */}
      <div className="w-full neo-box p-3.5 flex items-center justify-between border-[#FF2E63]">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-[#FF2E63]" />
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-white block">
              ACCUSATION ROUND
            </span>
            <span className="text-[10px] font-black uppercase text-[#FF2E63]">
              Vote for the Imposter
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-[#FF2E63] text-white font-black text-xs uppercase border-2 border-black">
          VOTE NOW
        </span>
      </div>

      {/* Widescreen 2-Column Grid: Suspects Lineup on Left, Clue History on Right */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Column (7 cols): Suspect Lineup & Voting */}
        <div className="w-full md:col-span-7 space-y-4">
          {/* Vote Progress Tracker */}
          <div className="w-full neo-box p-3 flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-300">
              Votes In: <span className="text-[#FFE600] font-black text-sm">{totalVotesCast}</span> / {alivePlayers.length}
            </span>
            <div className="flex items-center space-x-1.5">
              {alivePlayers.map((p) => (
                <span
                  key={p.id}
                  className={`w-4 h-4 rounded-full border-2 border-black transition-all shadow-[0_2px_0_0_#000] ${
                    p.has_voted ? 'bg-[#00E676] scale-110' : 'bg-[#0F111A]'
                  }`}
                  title={`${p.name}: ${p.has_voted ? 'Voted' : 'Thinking'}`}
                />
              ))}
            </div>
          </div>

          {/* Suspects Lineup Grid */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3">
            {alivePlayers.map((p) => {
              const isSelected = selectedTargetId === p.id
              const isMe = p.id === gameState.viewer_id

              return (
                <button
                  key={p.id}
                  disabled={hasVoted || isEliminated}
                  onClick={() => handleSelect(p.id)}
                  className={`p-3.5 rounded-2xl border-[3px] border-black transition-all flex flex-col items-center justify-center text-center relative select-none ${
                    isSelected
                      ? 'bg-[#FF2E63] text-white shadow-[0_6px_0_0_#000] scale-105 z-10'
                      : hasVoted
                      ? 'bg-[#171B26]/60 opacity-65 shadow-[0_2px_0_0_#000]'
                      : 'bg-[#171B26] hover:bg-[#1E2337] active:translate-y-1 active:shadow-[0_1px_0_0_#000] shadow-[0_4px_0_0_#000]'
                  }`}
                >
                  {/* Accused Stamp */}
                  {isSelected && (
                    <div className="absolute -top-3 -right-2 px-2 py-0.5 bg-[#FFE600] text-black font-black text-[10px] uppercase border-2 border-black rounded-lg shadow-[0_2px_0_0_#000] -rotate-6 animate-in zoom-in-75">
                      ACCUSED!
                    </div>
                  )}

                  <AvatarIcon avatarId={p.avatar} size="lg" className="mb-2" />

                  <span className="font-black text-sm uppercase truncate max-w-full block">
                    {p.name} {isMe && '(You)'}
                  </span>

                  <span
                    className={`text-[10px] font-black uppercase mt-1 px-2 py-0.5 rounded-full border border-black/40 ${
                      p.has_voted ? 'bg-[#00E676] text-black' : 'bg-black/40 text-slate-300'
                    }`}
                  >
                    {p.has_voted ? '✓ Cast Vote' : 'Deliberating'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Action Footer */}
          <div className="w-full pt-1">
            {!hasVoted && !isEliminated ? (
              <button
                disabled={!selectedTargetId}
                onClick={handleConfirmVote}
                className={`w-full py-4 neo-btn text-base ${
                  selectedTargetId ? 'neo-btn-red' : 'neo-btn-dark opacity-50'
                }`}
              >
                <Target className="w-5 h-5 mr-2 inline" />
                <span>{selectedTargetId ? 'CONFIRM ACCUSATION' : 'SELECT A SUSPECT'}</span>
              </button>
            ) : (
              <div className="w-full neo-box p-4 flex items-center justify-center space-x-2 text-[#00E676] text-sm font-black uppercase">
                <CheckCircle2 className="w-5 h-5" />
                <span>Accusation Locked! Tallying votes...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Clue Cross-Examination Board */}
        <div className="w-full md:col-span-5 space-y-4">
          {gameState.clue_history && gameState.clue_history.length > 0 ? (
            <ClueHistoryBoard clues={gameState.clue_history} initialOpen={true} />
          ) : (
            <div className="w-full neo-box p-5 space-y-2 text-center text-slate-400">
              <span className="text-xs font-black uppercase tracking-wider text-white block">
                Cross-Examination
              </span>
              <p className="text-xs">
                Reflect on who hesitated, who gave weird clues, and whose words were just slightly off.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
