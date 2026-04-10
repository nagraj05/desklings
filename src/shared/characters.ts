// 16×16 pixel-art robot character system.
// buildFrames(primary, secondary, visor, body, tip) → 4 frames (walk0, walk1, idle, talk)
// Each frame is a 16×16 array of CSS color strings or 'transparent'.

export type Color = string
export type Frame = Color[][] // [row][col]

export interface CharacterDef {
  name: string
  category: 'Robots' | 'Star Wars' | 'Marvel' | 'DC'
  frames: Frame[] // [0]=walk0, [1]=walk1, [2]=idle, [3]=talk
}

export const SCALE = 3
export const FRAME_SIZE = 16 // 16×16 pixels per frame

// ─── Template builder ─────────────────────────────────────────────────────────
// Template cell codes:
//   '.' = transparent
//   'T' = tip (antenna)
//   'A' = secondary / outline
//   'P' = primary (arms, legs)
//   'V' = visor
//   'B' = body plate
//   'X' = talk visor (brighter visor when speaking)

const UPPER_BODY: string[] = [
  '......TT........', // 0  antenna tip
  '.....TTTT.......', // 1  antenna base
  '....AAAAAA......', // 2  head top
  '....APPPPA......', // 3  head sides
  '....APVVPA......', // 4  visor row 1
  '....APVVPA......', // 5  visor row 2
  '....APPPPA......', // 6  head lower
  '....AAAAAA......', // 7  chin / neck
  '...BBBBBBBB.....', // 8  shoulders
  '...BPPPPPPB.....', // 9  body
  '...BPPPPPPB.....', // 10 body
  '...BBBBBBBB.....', // 11 waist
]

const UPPER_BODY_TALK: string[] = [
  '......TT........',
  '.....TTTT.......',
  '....AAAAAA......',
  '....APPPPA......',
  '....APXXPA......', // visor open / lit
  '....APXXPA......',
  '....APPPPA......',
  '....AAAAAA......',
  '...BBBBBBBB.....',
  '...BPPPPPPB.....',
  '...BPPPPPPB.....',
  '...BBBBBBBB.....',
]

// Leg rows for 4 frames (rows 12-15)
const LEGS: string[][] = [
  // Frame 0: stand (used for idle too)
  [
    '....PP..PP......',
    '....PP..PP......',
    '....PP..PP......',
    '...PPP..PPP.....',
  ],
  // Frame 1: left foot forward
  [
    '...PP...PP......',
    '..PP....PP......',
    '.PP.....PP......',
    'PP......PPP.....',
  ],
  // Frame 2: stand
  [
    '....PP..PP......',
    '....PP..PP......',
    '....PP..PP......',
    '...PPP..PPP.....',
  ],
  // Frame 3: right foot forward
  [
    '....PP...PP.....',
    '....PP....PP....',
    '....PP.....PP...',
    '...PPP......PPP.',
  ],
]

function makeFrame(
  rows: string[],
  P: Color,
  A: Color,
  V: Color,
  B: Color,
  T: Color,
  X: Color,
): Frame {
  return rows.map((row) =>
    row.split('').map((ch) => {
      if (ch === '.') return 'transparent'
      if (ch === 'P') return P
      if (ch === 'A') return A
      if (ch === 'V') return V
      if (ch === 'B') return B
      if (ch === 'T') return T
      if (ch === 'X') return X
      return 'transparent'
    }),
  )
}

function buildFrames(
  primary: Color,
  secondary: Color,
  visor: Color,
  body: Color,
  tip: Color,
  talkVisor: Color = '#ffffff',
): Frame[] {
  const walk0 = makeFrame([...UPPER_BODY, ...LEGS[0]], primary, secondary, visor, body, tip, talkVisor)
  const walk1 = makeFrame([...UPPER_BODY, ...LEGS[1]], primary, secondary, visor, body, tip, talkVisor)
  const idle  = makeFrame([...UPPER_BODY, ...LEGS[2]], primary, secondary, visor, body, tip, talkVisor)
  const talk  = makeFrame([...UPPER_BODY_TALK, ...LEGS[2]], primary, secondary, visor, body, tip, talkVisor)
  return [walk0, walk1, idle, talk]
}

// ─── Character library ─────────────────────────────────────────────────────────

export const CHARACTER_DEFS: Record<string, CharacterDef> = {
  // ── Robots ──────────────────────────────────────────────────────────────────
  'classic': {
    name: 'Classic',
    category: 'Robots',
    frames: buildFrames('#c0c0c0', '#808080', '#00bfff', '#909090', '#ffff00'),
  },
  'red-robot': {
    name: 'Blaze',
    category: 'Robots',
    frames: buildFrames('#dc2626', '#7f1d1d', '#fbbf24', '#b91c1c', '#f97316'),
  },
  'blue-robot': {
    name: 'Hydro',
    category: 'Robots',
    frames: buildFrames('#3b82f6', '#1e3a8a', '#7dd3fc', '#2563eb', '#93c5fd'),
  },
  'green-robot': {
    name: 'Verdant',
    category: 'Robots',
    frames: buildFrames('#10b981', '#064e3b', '#34d399', '#059669', '#6ee7b7'),
  },
  'purple-robot': {
    name: 'Void',
    category: 'Robots',
    frames: buildFrames('#8b5cf6', '#4c1d95', '#c4b5fd', '#7c3aed', '#ddd6fe'),
  },
  'gold-robot': {
    name: 'Aurum',
    category: 'Robots',
    frames: buildFrames('#f59e0b', '#78350f', '#fef9c3', '#d97706', '#fde68a'),
  },

  // ── Star Wars ────────────────────────────────────────────────────────────────
  'stormtrooper': {
    name: 'Stormtrooper',
    category: 'Star Wars',
    frames: buildFrames('#f8fafc', '#cbd5e1', '#1e293b', '#e2e8f0', '#94a3b8'),
  },
  'darth-vader': {
    name: 'Darth Vader',
    category: 'Star Wars',
    frames: buildFrames('#1e1e2e', '#0f0f1a', '#dc2626', '#111127', '#e11d48'),
  },
  'r2d2': {
    name: 'R2-D2',
    category: 'Star Wars',
    frames: buildFrames('#f8fafc', '#1e3a8a', '#60a5fa', '#cbd5e1', '#f59e0b'),
  },
  'c3po': {
    name: 'C-3PO',
    category: 'Star Wars',
    frames: buildFrames('#f59e0b', '#92400e', '#fef3c7', '#d97706', '#fbbf24'),
  },
  'boba-fett': {
    name: 'Boba Fett',
    category: 'Star Wars',
    frames: buildFrames('#4d7c0f', '#1a2e05', '#f59e0b', '#365314', '#a16207'),
  },
  'clone-trooper': {
    name: 'Clone Trooper',
    category: 'Star Wars',
    frames: buildFrames('#f1f5f9', '#1d4ed8', '#bfdbfe', '#e2e8f0', '#93c5fd'),
  },
  'ig88': {
    name: 'IG-88',
    category: 'Star Wars',
    frames: buildFrames('#374151', '#111827', '#fbbf24', '#1f2937', '#f59e0b'),
  },
  'battle-droid': {
    name: 'Battle Droid',
    category: 'Star Wars',
    frames: buildFrames('#d2b48c', '#8b6914', '#dc2626', '#c19a6b', '#f59e0b'),
  },

  // ── Marvel ───────────────────────────────────────────────────────────────────
  'iron-man': {
    name: 'Iron Man',
    category: 'Marvel',
    frames: buildFrames('#dc2626', '#7f1d1d', '#fbbf24', '#b91c1c', '#fbbf24'),
  },
  'spider-man': {
    name: 'Spider-Man',
    category: 'Marvel',
    frames: buildFrames('#dc2626', '#1d4ed8', '#f8fafc', '#b91c1c', '#f8fafc'),
  },
  'captain-america': {
    name: 'Cap America',
    category: 'Marvel',
    frames: buildFrames('#1d4ed8', '#1e3a8a', '#f8fafc', '#dc2626', '#f8fafc'),
  },
  'thor': {
    name: 'Thor',
    category: 'Marvel',
    frames: buildFrames('#1d4ed8', '#1e40af', '#c0c0c0', '#1e3a8a', '#fbbf24'),
  },
  'hulk': {
    name: 'Hulk',
    category: 'Marvel',
    frames: buildFrames('#16a34a', '#14532d', '#86efac', '#15803d', '#4ade80'),
  },
  'black-panther': {
    name: 'Black Panther',
    category: 'Marvel',
    frames: buildFrames('#1e1b4b', '#0f0a2e', '#7c3aed', '#16103a', '#a78bfa'),
  },
  'scarlet-witch': {
    name: 'Scarlet Witch',
    category: 'Marvel',
    frames: buildFrames('#dc2626', '#7f1d1d', '#f43f5e', '#9f1239', '#fca5a5'),
  },
  'captain-marvel': {
    name: 'Capt Marvel',
    category: 'Marvel',
    frames: buildFrames('#1d4ed8', '#7f1d1d', '#fbbf24', '#dc2626', '#fde68a'),
  },

  // ── DC ───────────────────────────────────────────────────────────────────────
  'batman': {
    name: 'Batman',
    category: 'DC',
    frames: buildFrames('#1c1917', '#0c0a09', '#fbbf24', '#111110', '#f59e0b'),
  },
  'superman': {
    name: 'Superman',
    category: 'DC',
    frames: buildFrames('#1d4ed8', '#dc2626', '#fbbf24', '#1e3a8a', '#fde68a'),
  },
  'wonder-woman': {
    name: 'Wonder Woman',
    category: 'DC',
    frames: buildFrames('#dc2626', '#1d4ed8', '#fbbf24', '#b91c1c', '#fde68a'),
  },
  'flash': {
    name: 'The Flash',
    category: 'DC',
    frames: buildFrames('#dc2626', '#7f1d1d', '#fbbf24', '#b91c1c', '#fde68a'),
  },
  'green-lantern': {
    name: 'Green Lantern',
    category: 'DC',
    frames: buildFrames('#16a34a', '#14532d', '#4ade80', '#15803d', '#86efac'),
  },
  'aquaman': {
    name: 'Aquaman',
    category: 'DC',
    frames: buildFrames('#0284c7', '#7c5c00', '#7dd3fc', '#0369a1', '#fbbf24'),
  },
  'cyborg': {
    name: 'Cyborg',
    category: 'DC',
    frames: buildFrames('#374151', '#1d4ed8', '#60a5fa', '#1f2937', '#93c5fd'),
  },
  'harley-quinn': {
    name: 'Harley Quinn',
    category: 'DC',
    frames: buildFrames('#dc2626', '#1d4ed8', '#f8fafc', '#7f1d1d', '#f43f5e'),
  },
}

export const CHARACTER_KEYS = Object.keys(CHARACTER_DEFS)

export const CATEGORIES = ['Robots', 'Star Wars', 'Marvel', 'DC'] as const
export type Category = (typeof CATEGORIES)[number]

export function getByCategory(cat: Category): [string, CharacterDef][] {
  return Object.entries(CHARACTER_DEFS).filter(([, def]) => def.category === cat)
}
