import React, { useRef, useEffect } from 'react'
import { CHARACTER_DEFS, PIXEL_SIZE, FRAME_WIDTH, FRAME_HEIGHT } from '../characters'
import { SpeechBubble } from './SpeechBubble'
import type { CharacterId } from '../../../shared/ipc-types'

export interface CharacterRenderState {
  id: CharacterId
  x: number
  direction: 1 | -1
  frameIndex: number
  mode: 'walk' | 'idle' | 'talk'
  speaking: boolean
  message: string
  role: 'general' | 'water' | 'task'
}

interface Props {
  state: CharacterRenderState
  onClick: () => void
}

export function CharacterSprite({ state, onClick }: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const def = CHARACTER_DEFS[state.id]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const frame =
      state.mode === 'talk'
        ? def.talk
        : state.mode === 'idle'
          ? def.idle
          : def.walk[state.frameIndex % 2]

    for (let row = 0; row < frame.rows.length; row++) {
      const rowStr = frame.rows[row]
      for (let col = 0; col < rowStr.length; col++) {
        const paletteIdx = parseInt(rowStr[col], 10)
        const color = def.palette[paletteIdx]
        if (color === 'transparent') continue
        ctx.fillStyle = color
        ctx.fillRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
      }
    }
  }, [def, state.frameIndex, state.mode])

  const width = FRAME_WIDTH * PIXEL_SIZE
  const height = FRAME_HEIGHT * PIXEL_SIZE

  return (
    <div
      style={{
        position: 'absolute',
        left: state.x,
        bottom: 0,
        width,
        height,
        transform: state.direction === -1 ? 'scaleX(-1)' : 'none',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={onClick}
    >
      {state.speaking && (
        <div style={{ transform: state.direction === -1 ? 'scaleX(-1)' : 'none' }}>
          <SpeechBubble message={state.message} direction={state.direction} />
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ imageRendering: 'pixelated', display: 'block' }}
      />
    </div>
  )
}
