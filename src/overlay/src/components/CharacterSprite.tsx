import React, { useRef, useEffect } from 'react'
import { CHARACTER_DEFS, SCALE, FRAME_SIZE } from '../characters'
import { SpeechBubble } from './SpeechBubble'

export interface CharacterRenderState {
  buddyId: string
  characterKey: string
  name: string
  x: number
  direction: 1 | -1
  frameIndex: number  // 0=walk0, 1=walk1, 2=idle, 3=talk
  speaking: boolean
  message: string
  role: 'general' | 'water' | 'task'
}

interface Props {
  state: CharacterRenderState
  onClick: () => void
}

const PX = SCALE       // pixels per "pixel"
const SIZE = FRAME_SIZE * SCALE  // canvas size in real pixels

export function CharacterSprite({ state, onClick }: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const def = CHARACTER_DEFS[state.characterKey] ?? CHARACTER_DEFS['classic']

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, SIZE, SIZE)

    const frame = def.frames[state.frameIndex]
    if (!frame) return

    for (let row = 0; row < frame.length; row++) {
      for (let col = 0; col < frame[row].length; col++) {
        const color = frame[row][col]
        if (color === 'transparent') continue
        ctx.fillStyle = color
        ctx.fillRect(col * PX, row * PX, PX, PX)
      }
    }
  }, [def, state.frameIndex])

  return (
    <div
      style={{
        position: 'absolute',
        left: state.x,
        bottom: 0,
        width: SIZE,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
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
        width={SIZE}
        height={SIZE}
        style={{ imageRendering: 'pixelated', display: 'block' }}
      />
      <div
        style={{
          color: '#fff',
          fontSize: '10px',
          fontFamily: 'monospace',
          textShadow: '0 1px 2px #000',
          marginTop: 1,
          pointerEvents: 'none',
          transform: state.direction === -1 ? 'scaleX(-1)' : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {state.name}
      </div>
    </div>
  )
}
