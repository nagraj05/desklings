import React, { useRef, useEffect } from 'react'
import { CHARACTER_DEFS, PIXEL_SIZE, FRAME_WIDTH, FRAME_HEIGHT } from '../../../../overlay/src/characters'
import type { CharacterId } from '../../../../shared/ipc-types'

interface Props {
  id: CharacterId
  selected: boolean
  onClick: () => void
  size?: number
}

export function CharacterCard({ id, selected, onClick, size = 3 }: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const def = CHARACTER_DEFS[id]
  const ps = size // pixel multiplier
  const w = FRAME_WIDTH * ps
  const h = FRAME_HEIGHT * ps

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)

    const frame = def.idle
    for (let row = 0; row < frame.rows.length; row++) {
      const rowStr = frame.rows[row]
      for (let col = 0; col < rowStr.length; col++) {
        const idx = parseInt(rowStr[col], 10)
        const color = def.palette[idx]
        if (color === 'transparent') continue
        ctx.fillStyle = color
        ctx.fillRect(col * ps, row * ps, ps, ps)
      }
    }
  }, [def, ps, w, h])

  void PIXEL_SIZE // imported for side effect

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer
        ${selected
          ? 'border-indigo-500 bg-indigo-950/60'
          : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
        }`}
    >
      <canvas
        ref={canvasRef}
        width={w}
        height={h}
        className="pixel-art"
      />
      <span className="text-xs text-slate-300 font-bold">{def.name}</span>
    </button>
  )
}
