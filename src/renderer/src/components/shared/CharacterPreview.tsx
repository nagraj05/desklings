import React, { useRef, useEffect } from 'react'
import { CHARACTER_DEFS } from '@overlay/characters'

interface Props {
  characterKey: string
  scale?: number       // pixels per "pixel", default 2
  frameIndex?: number  // 0=walk0, 1=walk1, 2=idle, 3=talk
  animated?: boolean   // auto-cycle walk frames
  style?: React.CSSProperties
}

const FRAME_SIZE = 16

export function CharacterPreview({
  characterKey,
  scale = 2,
  frameIndex = 2,
  animated = false,
  style,
}: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(frameIndex)
  const rafRef = useRef<number>(0)
  const tickRef = useRef(0)

  const size = FRAME_SIZE * scale

  useEffect(() => {
    const def = CHARACTER_DEFS[characterKey] ?? CHARACTER_DEFS['classic']
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = (fi: number): void => {
      ctx.clearRect(0, 0, size, size)
      const frame = def.frames[fi]
      if (!frame) return
      for (let row = 0; row < frame.length; row++) {
        for (let col = 0; col < frame[row].length; col++) {
          const color = frame[row][col]
          if (color === 'transparent') continue
          ctx.fillStyle = color
          ctx.fillRect(col * scale, row * scale, scale, scale)
        }
      }
    }

    if (!animated) {
      draw(frameIndex)
      return
    }

    const loop = (): void => {
      tickRef.current++
      if (tickRef.current % 12 === 0) {
        frameRef.current = frameRef.current === 0 ? 1 : 0
        draw(frameRef.current)
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    draw(frameRef.current)
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [characterKey, scale, animated, frameIndex, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated', display: 'block', ...style }}
    />
  )
}
