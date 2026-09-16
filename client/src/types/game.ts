export type GamePhase =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'CLUE_TURNS'
  | 'VOTING'
  | 'IMPOSTER_STEAL'
  | 'REVEAL_RESULT'
  | 'ROUND_OVER'

export type PlayerRole = 'CIVILIAN' | 'IMPOSTER' | 'MR_WHITE' | 'SPECTATOR'

export interface Player {
  id: string
  name: string
  avatar: string
  is_host: boolean
  is_bot?: boolean
  is_connected: boolean
  score: number
  has_seen_role: boolean
  has_voted: boolean
  is_eliminated: boolean
}

export interface ClueEntry {
  player_id: string
  player_name: string
  avatar: string
  cycle: number
  clue: string
}

export interface ReactionEvent {
  player_id: string
  player_name: string
  avatar: string
  emoji: string
}

export interface GameSettings {
  mode: 'undercover' | 'chameleon'
  clue_mode?: 'voice' | 'silent'
  language: string
  imposter_count: number
  mr_white_enabled: boolean
  clue_timer_seconds: number
  rounds_of_clues: number
}

export interface GameState {
  room_code: string
  phase: GamePhase
  round_number: number
  settings: GameSettings
  category: string
  hint?: string | null
  players: Player[]
  viewer_id: string
  is_host: boolean
  my_role: PlayerRole
  my_word: string
  active_turn_player_id?: string | null
  clue_cycle: number
  total_clue_cycles: number
  clue_history?: ClueEntry[]
  vote_counts?: Record<string, number> | null
  eliminated_player_id?: string | null
  winner?: 'CIVILIANS' | 'IMPOSTER' | 'MR_WHITE' | null
  imposter_guess?: string | null
  imposter_guess_correct?: boolean | null
  civilian_word?: string | null
  imposter_word?: string | null
  all_roles?: Record<string, string>
}

export interface NetworkInfo {
  local_ip: string
  port: number
  server_url: string
  is_offline_capable: boolean
}

export interface SoundEffects {
  isMuted: boolean
  toggleMute: () => void
  playClick: () => void
  playCardFlip: () => void
  playTick: () => void
  playBuzzer: () => void
  playFanfare: () => void
  playReactionPop: () => void
}
