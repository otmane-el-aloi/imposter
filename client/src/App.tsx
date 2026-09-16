import React, { useEffect } from 'react'
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom'
import { useGameSocket } from './hooks/useGameSocket'
import { useSoundEffects } from './hooks/useSoundEffects'
import { LobbyView } from './components/LobbyView'
import { SecretWordCard } from './components/SecretWordCard'
import { TurnPhase } from './components/TurnPhase'
import { VotingPhase } from './components/VotingPhase'
import { ResultPhase } from './components/ResultPhase'
import { QuickReactions } from './components/QuickReactions'
import { Volume2, VolumeX, Wifi, WifiOff, ArrowRight } from 'lucide-react'
import { GameSettings } from './types/game'

export default function App() {
  const {
    clientId,
    isConnected,
    gameState,
    errorMessage,
    networkInfo,
    recentReaction,
    clearError,
    sendAction
  } = useGameSocket()

  const soundEffects = useSoundEffects()
  const navigate = useNavigate()

  // Actions
  const handleCreateRoom = (name: string, avatar: string) => {
    sendAction('create_room', { name, avatar })
  }

  const handleJoinRoom = (room_code: string, name: string, avatar: string) => {
    sendAction('join_room', { room_code, name, avatar })
    navigate(`/room/${room_code}`)
  }

  const handleAddBot = () => {
    if (!gameState) return
    sendAction('add_bot', { room_code: gameState.room_code })
  }

  const handleRemoveBot = (bot_id?: string) => {
    if (!gameState) return
    sendAction('remove_bot', { room_code: gameState.room_code, bot_id })
  }

  const handleUpdateSettings = (settings: Partial<GameSettings>) => {
    if (!gameState) return
    sendAction('update_settings', { room_code: gameState.room_code, settings })
  }

  const handleStartGame = () => {
    if (!gameState) return
    sendAction('start_game', { room_code: gameState.room_code })
  }

  const handleMarkSeen = () => {
    if (!gameState) return
    sendAction('mark_role_seen', { room_code: gameState.room_code })
  }

  const handleAdvanceToClues = () => {
    if (!gameState) return
    sendAction('advance_to_clues', { room_code: gameState.room_code })
  }

  const handleNextTurn = () => {
    if (!gameState) return
    sendAction('next_turn', { room_code: gameState.room_code })
  }

  const handleSubmitClue = (clue: string) => {
    if (!gameState) return
    sendAction('submit_clue', { room_code: gameState.room_code, clue })
  }

  const handleSendReaction = (emoji: string) => {
    if (!gameState) return
    sendAction('reaction', { room_code: gameState.room_code, emoji })
  }

  const handleStartVoting = () => {
    if (!gameState) return
    sendAction('next_turn', { room_code: gameState.room_code })
  }

  const handleVote = (target_id: string) => {
    if (!gameState) return
    sendAction('vote', { room_code: gameState.room_code, target_id })
  }

  const handleImposterGuess = (guess: string) => {
    if (!gameState) return
    sendAction('imposter_steal', { room_code: gameState.room_code, guess })
  }

  const handlePlayAgain = () => {
    if (!gameState) return
    sendAction('play_again', { room_code: gameState.room_code })
  }

  // When room is created from '/', navigate to /room/:code
  useEffect(() => {
    if (gameState?.room_code && window.location.pathname === '/') {
      navigate(`/room/${gameState.room_code}`)
    }
  }, [gameState?.room_code, navigate])

  return (
    <div className="min-h-screen bg-halftone text-slate-100 flex flex-col justify-between selection:bg-[#FFE600] selection:text-black">
      {/* Error Banner */}
      {errorMessage && (
        <div className="max-w-xl mx-auto w-full px-4 pt-2 z-50">
          <div className="neo-box p-3 bg-[#FF2E63] text-white text-xs font-black uppercase flex items-center justify-between shadow-[0_4px_0_0_#000]">
            <span>{errorMessage}</span>
            <button onClick={clearError} className="text-white ml-2 font-black text-lg leading-none">×</button>
          </div>
        </div>
      )}

      {/* Routes */}
      <Routes>
        {/* 1. Home / Join Route */}
        <Route
          path="/"
          element={
            <div className="flex-1 flex flex-col justify-between">
              <header className="px-4 sm:px-6 py-3 border-b-2 border-black bg-[#0F111A]/90 backdrop-blur sticky top-0 z-50 flex items-center justify-between max-w-5xl mx-auto w-full shadow-[0_2px_0_0_#000]">
                <div className="flex items-center space-x-2.5">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-xl border-2 border-black object-cover" />
                  <span className="font-black tracking-tight text-white text-base uppercase drop-shadow-[0_1px_0_#000]">IMPOSTER</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border-2 border-black ${
                    isConnected ? 'bg-[#00E676] text-black' : 'bg-[#FF2E63] text-white'
                  }`}>
                    {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    <span>{isConnected ? 'LAN' : 'Connecting'}</span>
                  </div>
                  <button onClick={soundEffects.toggleMute} className="p-1.5 rounded-xl bg-[#1E2337] border-2 border-black text-white shadow-[0_2px_0_0_#000]">
                    {soundEffects.isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-white" />}
                  </button>
                </div>
              </header>

              <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 max-w-5xl mx-auto w-full">
                <LobbyView
                  gameState={gameState}
                  networkInfo={networkInfo}
                  onJoinRoom={handleJoinRoom}
                  onCreateRoom={handleCreateRoom}
                  onAddBot={handleAddBot}
                  onRemoveBot={handleRemoveBot}
                  onUpdateSettings={handleUpdateSettings}
                  onStartGame={handleStartGame}
                  soundEffects={soundEffects}
                />
              </main>

              <footer className="py-2 text-center text-[10px] text-slate-400">
                Offline Local Network Mode &bull; Built with FastAPI & React
              </footer>
            </div>
          }
        />

        {/* 2. Player Game Room Route */}
        <Route
          path="/room/:roomCode"
          element={
            <PlayerRoomRouteWrapper
              gameState={gameState}
              networkInfo={networkInfo}
              isConnected={isConnected}
              soundEffects={soundEffects}
              recentReaction={recentReaction}
              onSendReaction={handleSendReaction}
              onSubmitClue={handleSubmitClue}
              onAddBot={handleAddBot}
              onRemoveBot={handleRemoveBot}
              onUpdateSettings={handleUpdateSettings}
              onStartGame={handleStartGame}
              onMarkSeen={handleMarkSeen}
              onAdvanceToClues={handleAdvanceToClues}
              onNextTurn={handleNextTurn}
              onStartVoting={handleStartVoting}
              onVote={handleVote}
              onImposterGuess={handleImposterGuess}
              onPlayAgain={handlePlayAgain}
              onAutoJoin={(code) => {
                const name = localStorage.getItem('imposter_player_name') || 'Player'
                const avatar = localStorage.getItem('imposter_avatar') || '🦊'
                sendAction('join_room', { room_code: code, name, avatar })
              }}
            />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

// Wrapper for Player Room Route
interface PlayerRoomProps {
  gameState: any
  networkInfo: any
  isConnected: boolean
  soundEffects: any
  recentReaction: any
  onSendReaction: (emoji: string) => void
  onSubmitClue: (clue: string) => void
  onAddBot: () => void
  onRemoveBot: (id?: string) => void
  onUpdateSettings: (settings: any) => void
  onStartGame: () => void
  onMarkSeen: () => void
  onAdvanceToClues: () => void
  onNextTurn: () => void
  onStartVoting: () => void
  onVote: (id: string) => void
  onImposterGuess: (guess: string) => void
  onPlayAgain: () => void
  onAutoJoin: (code: string) => void
}

const PlayerRoomRouteWrapper: React.FC<PlayerRoomProps> = (props) => {
  const { roomCode } = useParams<{ roomCode: string }>()
  const upperCode = roomCode?.toUpperCase() || ''
  const navigate = useNavigate()

  useEffect(() => {
    if (upperCode && (!props.gameState || props.gameState.room_code !== upperCode)) {
      props.onAutoJoin(upperCode)
    }
  }, [upperCode, props.gameState])

  if (!props.gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <h2 className="text-xl font-bold text-white">Connecting to Room {upperCode}...</h2>
      </div>
    )
  }

  const isHost = props.gameState.is_host
  const phase = props.gameState.phase

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Header */}
      <header className="px-4 sm:px-6 py-3 border-b-2 border-black bg-[#0F111A]/90 backdrop-blur sticky top-0 z-50 flex items-center justify-between max-w-5xl mx-auto w-full shadow-[0_2px_0_0_#000]">
        <div className="flex items-center space-x-2.5">
          <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity" title="Home">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-xl border-2 border-black object-cover" />
          </button>
          <span className="font-black tracking-tight text-white text-base uppercase drop-shadow-[0_1px_0_#000]">IMPOSTER</span>
          <span className="text-xs px-2.5 py-0.5 rounded-xl bg-[#FFE600] text-black font-mono font-black border-2 border-black shadow-[0_2px_0_0_#000]">
            {props.gameState.room_code}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border-2 border-black ${
            props.isConnected ? 'bg-[#00E676] text-black' : 'bg-[#FF2E63] text-white'
          }`}>
            {props.isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{props.isConnected ? 'LAN' : 'Connecting'}</span>
          </div>

          <button onClick={props.soundEffects.toggleMute} className="p-1.5 rounded-xl bg-[#1E2337] border-2 border-black text-white shadow-[0_2px_0_0_#000]">
            {props.soundEffects.isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>
        </div>
      </header>

      {/* Main View Router */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 max-w-5xl mx-auto w-full">
        {phase === 'LOBBY' && (
          <LobbyView
            gameState={props.gameState}
            networkInfo={props.networkInfo}
            onJoinRoom={() => {}}
            onCreateRoom={() => {}}
            onAddBot={props.onAddBot}
            onRemoveBot={props.onRemoveBot}
            onUpdateSettings={props.onUpdateSettings}
            onStartGame={props.onStartGame}
            soundEffects={props.soundEffects}
          />
        )}

        {phase === 'ROLE_REVEAL' && (
          <div className="w-full flex flex-col items-center">
            <SecretWordCard
              gameState={props.gameState}
              onMarkSeen={props.onMarkSeen}
              soundEffects={props.soundEffects}
            />

            {isHost && (
              <div className="w-full max-w-md px-4 mt-3 mb-6">
                <button
                  onClick={() => {
                    props.soundEffects.playClick()
                    props.onAdvanceToClues()
                  }}
                  className="w-full py-4 neo-btn neo-btn-yellow text-base"
                >
                  <span>Ready? Start Giving Clues</span>
                  <ArrowRight className="w-5 h-5 ml-2 inline" />
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'CLUE_TURNS' && (
          <TurnPhase
            gameState={props.gameState}
            onNextTurn={props.onNextTurn}
            onSubmitClue={props.onSubmitClue}
            onStartVoting={props.onStartVoting}
            soundEffects={props.soundEffects}
          />
        )}

        {phase === 'VOTING' && (
          <VotingPhase
            gameState={props.gameState}
            onVote={props.onVote}
            soundEffects={props.soundEffects}
          />
        )}

        {(phase === 'IMPOSTER_STEAL' || phase === 'REVEAL_RESULT' || phase === 'ROUND_OVER') && (
          <ResultPhase
            gameState={props.gameState}
            onImposterGuess={props.onImposterGuess}
            onPlayAgain={props.onPlayAgain}
            soundEffects={props.soundEffects}
          />
        )}
      </main>

      {/* Floating Quick Reactions overlay & dock (Active during gameplay) */}
      {phase !== 'LOBBY' && (
        <QuickReactions
          recentReaction={props.recentReaction}
          onSendReaction={props.onSendReaction}
          soundEffects={props.soundEffects}
        />
      )}

      <footer className="py-2 text-center text-[10px] text-slate-400">
        Offline Local Network Mode &bull; Built with FastAPI & React
      </footer>
    </div>
  )
}
