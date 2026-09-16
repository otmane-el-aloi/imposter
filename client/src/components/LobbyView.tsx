import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Users, Play, Settings, Shield, Skull, Copy, Check, Plus, Minus, QrCode, Mic, MessageSquare } from 'lucide-react'
import { GameState, GameSettings, NetworkInfo, SoundEffects } from '../types/game'
import { AvatarIcon, AVAILABLE_AVATARS } from './AvatarIcon'

interface LobbyViewProps {
  gameState: GameState | null
  networkInfo: NetworkInfo | null
  onJoinRoom: (roomCode: string, name: string, avatar: string) => void
  onCreateRoom: (name: string, avatar: string) => void
  onAddBot: () => void
  onRemoveBot: (botId?: string) => void
  onUpdateSettings: (settings: Partial<GameSettings>) => void
  onStartGame: () => void
  soundEffects: SoundEffects
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  gameState,
  networkInfo,
  onJoinRoom,
  onCreateRoom,
  onAddBot,
  onRemoveBot,
  onUpdateSettings,
  onStartGame,
  soundEffects
}) => {
  const [tab, setTab] = useState<'join' | 'create'>('join')
  const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem('imposter_player_name') || '')
  const [selectedAvatar, setSelectedAvatar] = useState<string>(() => {
    const saved = localStorage.getItem('imposter_avatar')
    if (saved && AVAILABLE_AVATARS.some((a) => a.id === saved)) return saved
    return 'detective'
  })
  const [roomCodeInput, setRoomCodeInput] = useState<string>('')
  const [copied, setCopied] = useState<boolean>(false)

  const isInRoom = Boolean(gameState && gameState.room_code)
  const isHost = gameState?.is_host || false
  const playerCount = gameState?.players?.length || 0
  const canStart = playerCount >= 3

  const joinUrl = networkInfo?.server_url || window.location.origin

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId)
    localStorage.setItem('imposter_avatar', avatarId)
    soundEffects.playClick()
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setPlayerName(val)
    localStorage.setItem('imposter_player_name', val)
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomCodeInput.trim()) return
    soundEffects.playClick()
    onJoinRoom(roomCodeInput.trim().toUpperCase(), playerName || 'Agent', selectedAvatar)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    soundEffects.playClick()
    onCreateRoom(playerName || 'Host Agent', selectedAvatar)
  }

  const copyRoomLink = () => {
    navigator.clipboard.writeText(`${joinUrl}`)
    setCopied(true)
    soundEffects.playClick()
    setTimeout(() => setCopied(false), 2000)
  }

  // 1. Initial Screen: Join or Host
  if (!gameState || !gameState.room_code) {
    return (
      <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full">
        {/* Arcade Neo-Pop Game Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            <img
              src="/logo.png"
              alt="Imposter Game Logo"
              className="w-24 h-24 rounded-3xl mx-auto border-[3px] border-black shadow-[0_6px_0_0_#000] object-cover bg-amber-400"
            />
            <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-[#FFE600] text-black font-black text-[10px] border-2 border-black tracking-wider uppercase shadow-[0_2px_0_0_#000]">
              LAN Edition
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase italic drop-shadow-[0_4px_0_#000]">
            IMPOSTER
          </h1>
          <p className="text-xs font-black tracking-widest text-[#00F0FF] uppercase mt-1">
            Social Deception Party Game
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="w-full grid grid-cols-2 gap-2 mb-5">
          <button
            type="button"
            onClick={() => {
              setTab('join')
              soundEffects.playClick()
            }}
            className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-[3px] border-black shadow-[0_4px_0_0_#000] ${
              tab === 'join'
                ? 'bg-[#FFE600] text-black translate-y-0.5'
                : 'bg-[#1E2337] text-slate-400 hover:text-white'
            }`}
          >
            Join Room
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('create')
              soundEffects.playClick()
            }}
            className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-[3px] border-black shadow-[0_4px_0_0_#000] ${
              tab === 'create'
                ? 'bg-[#FF2E63] text-white translate-y-0.5'
                : 'bg-[#1E2337] text-slate-400 hover:text-white'
            }`}
          >
            Host Room
          </button>
        </div>

        {/* Form Container */}
        <div className="w-full neo-box p-6 space-y-5">
          {/* Avatar Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                Choose Operative
              </label>
              <span className="text-[10px] font-black uppercase text-[#FFE600]">
                {AVAILABLE_AVATARS.find((a) => a.id === selectedAvatar)?.name}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2.5">
              {AVAILABLE_AVATARS.map((avatar) => {
                const isSelected = selectedAvatar === avatar.id
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => handleAvatarSelect(avatar.id)}
                    className={`rounded-2xl transition-all p-0.5 flex items-center justify-center ${
                      isSelected
                        ? 'ring-4 ring-[#FFE600] scale-110 z-10'
                        : 'opacity-75 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <AvatarIcon avatarId={avatar.id} size="sm" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nickname Input */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-300 block mb-1.5">
              Operative Callsign
            </label>
            <input
              type="text"
              value={playerName}
              onChange={handleNameChange}
              placeholder="e.g. Agent Specter"
              maxLength={15}
              className="w-full px-4 py-3 rounded-2xl bg-[#0F111A] border-[2.5px] border-black text-white font-black text-sm focus:outline-none focus:border-[#FFE600] shadow-[0_3px_0_0_#000]"
            />
          </div>

          {/* Tab Form: Join */}
          {tab === 'join' && (
            <form onSubmit={handleJoin} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 block mb-1.5">
                  4-Letter Room Code
                </label>
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  maxLength={4}
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#0F111A] border-[2.5px] border-black text-[#FFE600] font-mono font-black text-center text-2xl tracking-[0.25em] focus:outline-none focus:border-[#FFE600] uppercase shadow-[0_3px_0_0_#000]"
                />
              </div>

              <button
                type="submit"
                disabled={!roomCodeInput.trim()}
                className="w-full py-4 neo-btn neo-btn-yellow text-base"
              >
                ENTER GAME ROOM
              </button>
            </form>
          )}

          {/* Tab Form: Create */}
          {tab === 'create' && (
            <form onSubmit={handleCreate} className="pt-2">
              <button
                type="submit"
                className="w-full py-4 neo-btn neo-btn-red text-base"
              >
                CREATE GAME ROOM
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-5xl mx-auto w-full space-y-4">
      {/* Top Room Code Banner */}
      <div className="w-full neo-box p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#00F0FF] block">
            ROOM CODE
          </span>
          <span className="text-3xl sm:text-4xl font-mono font-black text-[#FFE600] tracking-wider drop-shadow-[0_2px_0_#000]">
            {gameState.room_code}
          </span>
        </div>

        <button
          onClick={copyRoomLink}
          className="neo-btn neo-btn-dark px-3 py-2 sm:px-4 sm:py-2.5 text-xs flex items-center space-x-1.5"
          title="Copy LAN link"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-[#00E676]" />
              <span className="text-[#00E676]">COPIED</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>COPY LINK</span>
            </>
          )}
        </button>
      </div>

      {/* Responsive 2-Column Grid on Tablet/Desktop */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-start">
        {/* Left Column: QR Code & Operatives Roster */}
        <div className="w-full space-y-4">

      {/* QR Code Card */}
      <div className="w-full neo-box p-5 text-center flex flex-col items-center">
        <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-slate-300 mb-3">
          <QrCode className="w-4 h-4 text-[#FFE600]" />
          <span>Scan to Connect on Wi-Fi</span>
        </div>
        <div className="p-3 bg-white rounded-2xl border-[3px] border-black shadow-[0_4px_0_0_#000]">
          <QRCodeSVG value={joinUrl} size={135} level="M" />
        </div>
        <p className="text-[11px] font-mono font-bold text-slate-400 mt-2 truncate max-w-full">
          {joinUrl}
        </p>
      </div>

      {/* Connected Players Roster */}
      <div className="w-full neo-box p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-white flex items-center">
            <Users className="w-4 h-4 mr-1.5 text-[#00F0FF]" />
            Players ({playerCount})
          </span>
          <span className="text-[11px] font-black text-[#FFE600] uppercase">
            Min 3 Players
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
          {gameState.players.map((p) => {
            const isMe = p.id === gameState.viewer_id
            return (
              <div
                key={p.id}
                className={`p-2.5 rounded-2xl border-[2.5px] border-black flex items-center space-x-2 shadow-[0_3px_0_0_#000] ${
                  isMe
                    ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white'
                    : p.is_bot
                    ? 'bg-[#A855F7]/15 text-purple-200'
                    : 'bg-[#0F111A] text-slate-200'
                }`}
              >
                <AvatarIcon avatarId={p.avatar} size="xs" showBorder={false} />
                <div className="truncate flex-1 min-w-0">
                  <span className="font-black text-xs block truncate">
                    {p.name}
                  </span>
                  <div className="flex items-center space-x-1 mt-0.5">
                    {p.is_host && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#FFE600] text-black font-black uppercase">
                        Host
                      </span>
                    )}
                    {p.is_bot && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#A855F7] text-white font-black uppercase">
                        BOT
                      </span>
                    )}
                    {isMe && (
                      <span className="text-[9px] text-[#00F0FF] font-bold">
                        (You)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Dev Bot Controls */}
        {isHost && (
          <div className="flex items-center space-x-2 pt-2 border-t-2 border-black/50">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick()
                onAddBot()
              }}
              className="flex-1 py-2 neo-btn neo-btn-cyan text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Add Bot</span>
            </button>
            {gameState.players.some((p) => p.is_bot) && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick()
                  onRemoveBot()
                }}
                className="py-2 px-3 neo-btn neo-btn-dark text-xs"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Right Column: Host Settings & Game Launch */}
    <div className="w-full space-y-4">
      {/* Host Room Settings */}
      {isHost ? (
        <div className="w-full neo-box p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center">
              <Settings className="w-4 h-4 mr-1.5 text-[#FFE600]" />
              Game Settings
            </span>
          </div>

          {/* Mode Switch (Undercover vs Chameleon) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick()
                onUpdateSettings({ mode: 'undercover' })
              }}
              className={`py-2.5 px-3 rounded-2xl border-[2.5px] border-black font-black text-xs uppercase flex items-center justify-center space-x-1.5 shadow-[0_3px_0_0_#000] ${
                gameState.settings.mode === 'undercover'
                  ? 'bg-[#00F0FF] text-black'
                  : 'bg-[#0F111A] text-slate-400'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Undercover</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick()
                onUpdateSettings({ mode: 'chameleon' })
              }}
              className={`py-2.5 px-3 rounded-2xl border-[2.5px] border-black font-black text-xs uppercase flex items-center justify-center space-x-1.5 shadow-[0_3px_0_0_#000] ${
                gameState.settings.mode === 'chameleon'
                  ? 'bg-[#FF2E63] text-white'
                  : 'bg-[#0F111A] text-slate-400'
              }`}
            >
              <Skull className="w-3.5 h-3.5" />
              <span>Chameleon</span>
            </button>
          </div>

          {/* Clue Delivery Switch (Voice vs Silent) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick()
                onUpdateSettings({ clue_mode: 'voice' })
              }}
              className={`py-2.5 px-3 rounded-2xl border-[2.5px] border-black font-black text-xs uppercase flex items-center justify-center space-x-1.5 shadow-[0_3px_0_0_#000] ${
                (gameState.settings.clue_mode || 'voice') === 'voice'
                  ? 'bg-[#FFE600] text-black'
                  : 'bg-[#0F111A] text-slate-400'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Speak Aloud</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick()
                onUpdateSettings({ clue_mode: 'silent' })
              }}
              className={`py-2.5 px-3 rounded-2xl border-[2.5px] border-black font-black text-xs uppercase flex items-center justify-center space-x-1.5 shadow-[0_3px_0_0_#000] ${
                gameState.settings.clue_mode === 'silent'
                  ? 'bg-[#00E676] text-black'
                  : 'bg-[#0F111A] text-slate-400'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Silent (Text)</span>
            </button>
          </div>

          {/* Clue Rounds & Timer */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                Clue Rounds
              </label>
              <select
                value={gameState.settings.rounds_of_clues || 1}
                onChange={(e) => onUpdateSettings({ rounds_of_clues: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-[#0F111A] border-2 border-black font-black text-xs text-white focus:outline-none focus:border-[#FFE600] shadow-[0_2px_0_0_#000]"
              >
                <option value={1}>1 Round (Fast)</option>
                <option value={2}>2 Rounds (Standard)</option>
                <option value={3}>3 Rounds (Deep)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                Clue Timer
              </label>
              <select
                value={gameState.settings.clue_timer_seconds ?? 30}
                onChange={(e) => onUpdateSettings({ clue_timer_seconds: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-[#0F111A] border-2 border-black font-black text-xs text-white focus:outline-none focus:border-[#FFE600] shadow-[0_2px_0_0_#000]"
              >
                <option value={15}>15s Speed</option>
                <option value={30}>30s Standard</option>
                <option value={45}>45s Relaxed</option>
                <option value={0}>Unlimited</option>
              </select>
            </div>
          </div>

          {/* Imposter Count & Language */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                Imposters
              </label>
              <select
                value={gameState.settings.imposter_count}
                onChange={(e) => onUpdateSettings({ imposter_count: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-[#0F111A] border-2 border-black font-black text-xs text-white focus:outline-none focus:border-[#FFE600] shadow-[0_2px_0_0_#000]"
              >
                <option value={1}>1 Imposter</option>
                <option value={2}>2 Imposters</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                Language
              </label>
              <select
                value={gameState.settings.language}
                onChange={(e) => onUpdateSettings({ language: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#0F111A] border-2 border-black font-black text-xs text-white focus:outline-none focus:border-[#FFE600] shadow-[0_2px_0_0_#000]"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full neo-box p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center">
              <Shield className="w-4 h-4 mr-1.5 text-[#00F0FF]" />
              Match Settings
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0F111A] text-xs space-y-2.5 border-2 border-black">
            <div className="flex justify-between text-slate-300 font-bold">
              <span>Game Mode:</span>
              <span className="text-[#00F0FF] uppercase font-black">{gameState.settings.mode}</span>
            </div>
            <div className="flex justify-between text-slate-300 font-bold">
              <span>Clue Delivery:</span>
              <span className="text-[#00E676] uppercase font-black">
                {gameState.settings.clue_mode === 'silent' ? 'Silent (Text)' : 'Speak Aloud'}
              </span>
            </div>
            <div className="flex justify-between text-slate-300 font-bold">
              <span>Clue Rounds:</span>
              <span className="text-white font-black">{gameState.settings.rounds_of_clues || 1}</span>
            </div>
            <div className="flex justify-between text-slate-300 font-bold">
              <span>Turn Timer:</span>
              <span className="text-[#FFE600] font-black">
                {gameState.settings.clue_timer_seconds ? `${gameState.settings.clue_timer_seconds}s` : 'Unlimited'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Start Button (Host) or Waiting Banner */}
      {isHost ? (
        <button
          disabled={!canStart}
          onClick={() => {
            soundEffects.playFanfare()
            onStartGame()
          }}
          className={`w-full py-4 neo-btn text-base ${
            canStart ? 'neo-btn-yellow' : 'neo-btn-dark opacity-60'
          }`}
        >
          <Play className="w-5 h-5 fill-current mr-2 inline" />
          <span>{canStart ? 'START ROUND' : `WAITING FOR ${3 - playerCount} MORE PLAYERS`}</span>
        </button>
      ) : (
        <div className="w-full neo-box p-4 text-center text-xs font-black text-[#FFE600] uppercase tracking-wider animate-pulse">
          Waiting for host to start the game...
        </div>
      )}
    </div>
  </div>
</div>
)
}
