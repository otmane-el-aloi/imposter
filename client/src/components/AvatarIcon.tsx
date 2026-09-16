import React from 'react'

export interface AvatarMeta {
  id: string
  name: string
  bg: string
}

export const AVAILABLE_AVATARS: AvatarMeta[] = [
  { id: 'detective', name: 'Snoop', bg: '#FFE600' },
  { id: 'gamer', name: 'Arcade', bg: '#00F0FF' },
  { id: 'ninja', name: 'Shadow', bg: '#FF2E63' },
  { id: 'cyborg', name: 'Byte', bg: '#00E676' },
  { id: 'feline', name: 'Whiskers', bg: '#FF9900' },
  { id: 'dino', name: 'Rex', bg: '#10B981' },
  { id: 'rebel', name: 'Spike', bg: '#A855F7' },
  { id: 'scientist', name: 'Brain', bg: '#38BDF8' },
  { id: 'alien', name: 'Zog', bg: '#84CC16' },
  { id: 'specter', name: 'Spook', bg: '#F472B6' },
  { id: 'pilot', name: 'Ace', bg: '#F59E0B' },
  { id: 'monocle', name: 'Bonds', bg: '#E2E8F0' },
]

interface AvatarIconProps {
  avatarId?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  showBorder?: boolean
}

export const AvatarIcon: React.FC<AvatarIconProps> = ({
  avatarId = 'detective',
  size = 'md',
  className = '',
  showBorder = true
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28'
  }

  // Find metadata or default to first
  const meta = AVAILABLE_AVATARS.find((a) => a.id === avatarId) || AVAILABLE_AVATARS[0]

  // Render SVG based on id
  const renderGraphic = () => {
    switch (avatarId) {
      case 'detective':
        return (
          <g>
            {/* Fedora Hat */}
            <ellipse cx="50" cy="30" rx="36" ry="10" fill="#262b3d" stroke="#000" strokeWidth="4" />
            <path d="M28 30 C28 14 36 10 50 10 C64 10 72 14 72 30 Z" fill="#3b425b" stroke="#000" strokeWidth="4" />
            <rect x="30" y="24" width="40" height="6" fill="#ffe600" stroke="#000" strokeWidth="2" />
            {/* Face */}
            <circle cx="50" cy="56" r="22" fill="#ffd199" stroke="#000" strokeWidth="4" />
            {/* Sunglasses */}
            <rect x="34" y="48" width="14" height="11" rx="2" fill="#111" stroke="#000" strokeWidth="3" />
            <rect x="52" y="48" width="14" height="11" rx="2" fill="#111" stroke="#000" strokeWidth="3" />
            <line x1="48" y1="52" x2="52" y2="52" stroke="#000" strokeWidth="3" />
            {/* Smirk */}
            <path d="M46 68 Q54 72 58 66" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            {/* Collar */}
            <path d="M30 76 L40 68 L50 78 L60 68 L70 76" fill="#ffe600" stroke="#000" strokeWidth="4" />
          </g>
        )

      case 'gamer':
        return (
          <g>
            {/* Headphones band */}
            <path d="M22 48 A30 30 0 0 1 78 48" fill="none" stroke="#000" strokeWidth="6" strokeLinecap="round" />
            <path d="M22 48 A30 30 0 0 1 78 48" fill="none" stroke="#ff2e63" strokeWidth="3" strokeLinecap="round" />
            {/* Face */}
            <circle cx="50" cy="52" r="22" fill="#ffe0bd" stroke="#000" strokeWidth="4" />
            {/* Visor */}
            <rect x="32" y="44" width="36" height="14" rx="4" fill="#00f0ff" stroke="#000" strokeWidth="3" />
            <line x1="36" y1="48" x2="48" y2="48" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            {/* Headphone earcups */}
            <rect x="18" y="42" width="10" height="20" rx="4" fill="#ff2e63" stroke="#000" strokeWidth="3" />
            <rect x="72" y="42" width="10" height="20" rx="4" fill="#ff2e63" stroke="#000" strokeWidth="3" />
            {/* Smile */}
            <path d="M42 66 Q50 72 58 66" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
          </g>
        )

      case 'ninja':
        return (
          <g>
            {/* Ninja Hood / Face */}
            <circle cx="50" cy="50" r="30" fill="#1b1d28" stroke="#000" strokeWidth="4" />
            {/* Headband */}
            <rect x="20" y="32" width="60" height="10" fill="#ff2e63" stroke="#000" strokeWidth="3" />
            {/* Eye Slit */}
            <rect x="30" y="45" width="40" height="13" rx="3" fill="#ffd199" stroke="#000" strokeWidth="3" />
            {/* Glowing Slit Eyes */}
            <ellipse cx="40" cy="51" rx="4" ry="2" fill="#000" />
            <ellipse cx="60" cy="51" rx="4" ry="2" fill="#000" />
            <circle cx="41" cy="50" r="1.5" fill="#ff2e63" />
            <circle cx="61" cy="50" r="1.5" fill="#ff2e63" />
          </g>
        )

      case 'cyborg':
        return (
          <g>
            {/* Antenna */}
            <line x1="50" y1="12" x2="50" y2="24" stroke="#000" strokeWidth="5" />
            <circle cx="50" cy="10" r="6" fill="#ffe600" stroke="#000" strokeWidth="3" />
            {/* Robot Head */}
            <rect x="25" y="24" width="50" height="48" rx="8" fill="#a0aec0" stroke="#000" strokeWidth="4" />
            {/* Bolt Ears */}
            <rect x="17" y="40" width="8" height="16" rx="2" fill="#ffe600" stroke="#000" strokeWidth="3" />
            <rect x="75" y="40" width="8" height="16" rx="2" fill="#ffe600" stroke="#000" strokeWidth="3" />
            {/* Eye Screen */}
            <rect x="32" y="34" width="36" height="14" rx="3" fill="#111" stroke="#000" strokeWidth="3" />
            <rect x="36" y="38" width="10" height="6" fill="#00e676" />
            <rect x="54" y="38" width="10" height="6" fill="#00e676" />
            {/* Grid Mouth */}
            <rect x="36" y="56" width="28" height="8" rx="2" fill="#4a5568" stroke="#000" strokeWidth="2" />
            <line x1="43" y1="56" x2="43" y2="64" stroke="#000" strokeWidth="2" />
            <line x1="50" y1="56" x2="50" y2="64" stroke="#000" strokeWidth="2" />
            <line x1="57" y1="56" x2="57" y2="64" stroke="#000" strokeWidth="2" />
          </g>
        )

      case 'feline':
        return (
          <g>
            {/* Cat Ears */}
            <polygon points="26,40 32,16 48,34" fill="#ff9900" stroke="#000" strokeWidth="4" />
            <polygon points="74,40 68,16 52,34" fill="#ff9900" stroke="#000" strokeWidth="4" />
            <polygon points="30,36 34,22 44,34" fill="#ffb84d" />
            <polygon points="70,36 66,22 56,34" fill="#ffb84d" />
            {/* Cat Face */}
            <circle cx="50" cy="54" r="26" fill="#ff9900" stroke="#000" strokeWidth="4" />
            {/* Eye Mask */}
            <path d="M28 50 Q50 60 72 50 Q76 40 64 42 Q50 48 36 42 Q24 40 28 50 Z" fill="#111" stroke="#000" strokeWidth="3" />
            {/* Glowing Slit Eyes */}
            <ellipse cx="40" cy="48" rx="4" ry="6" fill="#00e676" stroke="#000" strokeWidth="1.5" />
            <ellipse cx="60" cy="48" rx="4" ry="6" fill="#00e676" stroke="#000" strokeWidth="1.5" />
            <ellipse cx="40" cy="48" rx="1.5" ry="5" fill="#000" />
            <ellipse cx="60" cy="48" rx="1.5" ry="5" fill="#000" />
            {/* Nose & Whiskers */}
            <polygon points="48,60 52,60 50,63" fill="#000" />
            <line x1="22" y1="62" x2="36" y2="60" stroke="#000" strokeWidth="2.5" />
            <line x1="22" y1="68" x2="36" y2="64" stroke="#000" strokeWidth="2.5" />
            <line x1="78" y1="62" x2="64" y2="60" stroke="#000" strokeWidth="2.5" />
            <line x1="78" y1="68" x2="64" y2="64" stroke="#000" strokeWidth="2.5" />
          </g>
        )

      case 'dino':
        return (
          <g>
            {/* Dino Hood Spikes */}
            <polygon points="46,14 50,4 54,14" fill="#ffe600" stroke="#000" strokeWidth="3" />
            <polygon points="32,22 30,12 38,20" fill="#ffe600" stroke="#000" strokeWidth="3" />
            {/* Dino Head */}
            <circle cx="50" cy="48" r="28" fill="#10b981" stroke="#000" strokeWidth="4" />
            {/* Face Opening */}
            <ellipse cx="50" cy="50" rx="18" ry="16" fill="#d1fae5" stroke="#000" strokeWidth="3" />
            {/* Cartoon Eyes */}
            <circle cx="42" cy="46" r="4" fill="#000" />
            <circle cx="58" cy="46" r="4" fill="#000" />
            <circle cx="43" cy="44" r="1.5" fill="#fff" />
            <circle cx="59" cy="44" r="1.5" fill="#fff" />
            {/* Sharp Teeth on top */}
            <polygon points="38,56 42,62 46,56" fill="#fff" stroke="#000" strokeWidth="2" />
            <polygon points="46,56 50,62 54,56" fill="#fff" stroke="#000" strokeWidth="2" />
            <polygon points="54,56 58,62 62,56" fill="#fff" stroke="#000" strokeWidth="2" />
          </g>
        )

      case 'rebel':
        return (
          <g>
            {/* Punk Mohawk */}
            <path d="M42 28 L46 6 L52 24 L56 10 L60 28" fill="#a855f7" stroke="#000" strokeWidth="4" />
            {/* Face */}
            <circle cx="50" cy="52" r="22" fill="#fed7aa" stroke="#000" strokeWidth="4" />
            {/* Dark Shades */}
            <polygon points="32,46 48,46 46,58 36,58" fill="#1e1b4b" stroke="#000" strokeWidth="3" />
            <polygon points="52,46 68,46 64,58 54,58" fill="#1e1b4b" stroke="#000" strokeWidth="3" />
            <line x1="48" y1="49" x2="52" y2="49" stroke="#000" strokeWidth="3" />
            {/* Smirk & Piercing */}
            <path d="M44 66 Q52 70 56 64" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            <circle cx="30" cy="58" r="2.5" fill="#ffe600" stroke="#000" strokeWidth="1.5" />
          </g>
        )

      case 'scientist':
        return (
          <g>
            {/* Wild Hair */}
            <circle cx="28" cy="38" r="12" fill="#e2e8f0" stroke="#000" strokeWidth="3" />
            <circle cx="72" cy="38" r="12" fill="#e2e8f0" stroke="#000" strokeWidth="3" />
            <circle cx="50" cy="30" r="14" fill="#e2e8f0" stroke="#000" strokeWidth="3" />
            {/* Face */}
            <circle cx="50" cy="54" r="22" fill="#fed7aa" stroke="#000" strokeWidth="4" />
            {/* Big Round Goggles */}
            <circle cx="40" cy="50" r="11" fill="#38bdf8" stroke="#000" strokeWidth="3.5" />
            <circle cx="60" cy="50" r="11" fill="#38bdf8" stroke="#000" strokeWidth="3.5" />
            <line x1="51" y1="50" x2="49" y2="50" stroke="#000" strokeWidth="4" />
            {/* Pupil Glare */}
            <circle cx="42" cy="48" r="3" fill="#fff" />
            <circle cx="62" cy="48" r="3" fill="#fff" />
            {/* Open Mouth */}
            <ellipse cx="50" cy="67" rx="6" ry="4" fill="#ff2e63" stroke="#000" strokeWidth="2.5" />
          </g>
        )

      case 'alien':
        return (
          <g>
            {/* Single Antenna */}
            <line x1="50" y1="10" x2="50" y2="24" stroke="#000" strokeWidth="4" />
            <circle cx="50" cy="8" r="5" fill="#ff2e63" stroke="#000" strokeWidth="3" />
            {/* Green Alien Head */}
            <ellipse cx="50" cy="52" rx="26" ry="24" fill="#84cc16" stroke="#000" strokeWidth="4" />
            {/* Huge Big Black Eyes */}
            <ellipse cx="38" cy="50" rx="8" ry="12" transform="rotate(-15 38 50)" fill="#000" stroke="#000" strokeWidth="2" />
            <ellipse cx="62" cy="50" rx="8" ry="12" transform="rotate(15 62 50)" fill="#000" stroke="#000" strokeWidth="2" />
            <circle cx="36" cy="46" r="3" fill="#fff" />
            <circle cx="60" cy="46" r="3" fill="#fff" />
            {/* Tiny Smile */}
            <path d="M46 66 Q50 69 54 66" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )

      case 'specter':
        return (
          <g>
            {/* Ghost Sheet Head */}
            <path d="M24 64 C24 30 34 18 50 18 C66 18 76 30 76 64 C70 60 64 68 58 64 C52 60 48 68 42 64 C36 60 30 68 24 64 Z" fill="#f472b6" stroke="#000" strokeWidth="4" />
            {/* Black Domino Mask */}
            <path d="M30 40 Q50 48 70 40 Q74 34 66 34 Q50 38 34 34 Q26 34 30 40 Z" fill="#111" stroke="#000" strokeWidth="2.5" />
            {/* Glowing Eyes */}
            <circle cx="40" cy="38" r="3.5" fill="#ffe600" />
            <circle cx="60" cy="38" r="3.5" fill="#ffe600" />
            {/* O-Mouth */}
            <ellipse cx="50" cy="52" rx="4" ry="6" fill="#111" />
          </g>
        )

      case 'pilot':
        return (
          <g>
            {/* Leather Helmet */}
            <path d="M24 50 C24 24 36 18 50 18 C64 18 76 24 76 50 L76 64 L68 60 L68 46 L32 46 L32 60 L24 64 Z" fill="#78350f" stroke="#000" strokeWidth="4" />
            {/* Face */}
            <circle cx="50" cy="52" r="18" fill="#ffd199" stroke="#000" strokeWidth="3" />
            {/* Aviator Goggles */}
            <rect x="30" y="32" width="18" height="12" rx="3" fill="#38bdf8" stroke="#000" strokeWidth="3" />
            <rect x="52" y="32" width="18" height="12" rx="3" fill="#38bdf8" stroke="#000" strokeWidth="3" />
            <line x1="48" y1="38" x2="52" y2="38" stroke="#000" strokeWidth="3" />
            {/* Eyes */}
            <circle cx="42" cy="52" r="3" fill="#000" />
            <circle cx="58" cy="52" r="3" fill="#000" />
            {/* Confident Smile */}
            <path d="M44 62 Q50 67 56 62" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )

      case 'monocle':
      default:
        return (
          <g>
            {/* Bowler Hat */}
            <ellipse cx="50" cy="32" rx="32" ry="8" fill="#1e293b" stroke="#000" strokeWidth="4" />
            <path d="M30 32 C30 14 38 10 50 10 C62 10 70 14 70 32 Z" fill="#334155" stroke="#000" strokeWidth="4" />
            {/* Face */}
            <circle cx="50" cy="54" r="22" fill="#ffd199" stroke="#000" strokeWidth="4" />
            {/* Golden Monocle */}
            <circle cx="40" cy="50" r="9" fill="none" stroke="#ffe600" strokeWidth="3.5" />
            <line x1="32" y1="56" x2="26" y2="74" stroke="#ffe600" strokeWidth="2.5" />
            {/* Eyes */}
            <circle cx="40" cy="50" r="3" fill="#000" />
            <circle cx="60" cy="50" r="3" fill="#000" />
            {/* Twisted Mustache */}
            <path d="M38 64 Q46 60 50 64 Q54 60 62 64 Q68 58 66 68 Q54 68 50 66 Q46 68 34 68 Q32 58 38 64 Z" fill="#334155" stroke="#000" strokeWidth="2" />
          </g>
        )
    }
  }

  // Handle fallback if avatarId is a legacy emoji
  if (avatarId && avatarId.length > 0 && !AVAILABLE_AVATARS.some((a) => a.id === avatarId)) {
    // If it's an emoji or unknown text, render inside styled badge
    return (
      <div
        className={`${sizeMap[size]} rounded-2xl flex items-center justify-center font-black ${
          showBorder ? 'border-2 border-black shadow-[0_3px_0_0_#000]' : ''
        } ${className}`}
        style={{ backgroundColor: meta.bg }}
      >
        <span className="text-xl leading-none">{avatarId}</span>
      </div>
    )
  }

  return (
    <div
      className={`${sizeMap[size]} rounded-2xl flex items-center justify-center relative overflow-hidden flex-shrink-0 ${
        showBorder ? 'border-2 sm:border-[2.5px] border-black shadow-[0_3px_0_0_#000]' : ''
      } ${className}`}
      style={{ backgroundColor: meta.bg }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full object-contain"
        xmlns="http://www.w3.org/2000/svg"
      >
        {renderGraphic()}
      </svg>
    </div>
  )
}
