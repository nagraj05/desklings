import React, { useRef, useEffect, useState, useCallback } from 'react'
import { CharacterSprite } from './components/CharacterSprite'
import type { CharacterRenderState } from './components/CharacterSprite'
import { FRAME_WIDTH, FRAME_HEIGHT, PIXEL_SIZE } from './characters'
import type { CharacterConfig, WaterReminderConfig, TaskReminderConfig } from '../../shared/ipc-types'

const CHAR_WIDTH = FRAME_WIDTH * PIXEL_SIZE
const CHAR_HEIGHT = FRAME_HEIGHT * PIXEL_SIZE
const WALK_SPEED = 1.2
const FRAME_TICK_INTERVAL = 10

interface MutableCharState {
  x: number
  direction: 1 | -1
  frameTick: number
  frameIndex: number
  paused: boolean           // true while cursor is hovering over this character
  mode: 'walk' | 'idle' | 'talk'
  speaking: boolean
  message: string
  speakTimer: ReturnType<typeof setTimeout> | null
  popupPhase: 'none' | 'walkin' | 'speaking' | 'walkout'
  role: 'general' | 'water' | 'task'
}

interface Config {
  characters: CharacterConfig[]
  waterReminder: WaterReminderConfig
  taskReminder: TaskReminderConfig
}

export function OverlayApp(): React.JSX.Element {
  const screenWidth = window.screen.width
  const stateMapRef = useRef<Map<string, MutableCharState>>(new Map())
  const rafRef = useRef<number>(0)
  const configRef = useRef<Config | null>(null)
  const clickThroughRef = useRef(true) // tracks current ignore-mouse state

  const [renderStates, setRenderStates] = useState<CharacterRenderState[]>([])

  const syncActiveChars = useCallback(
    (config: Config) => {
      configRef.current = config
      const stateMap = stateMapRef.current
      const activeIds = new Set<string>()

      for (const char of config.characters) {
        if (!char.active) continue
        activeIds.add(char.id)
        if (!stateMap.has(char.id)) {
          stateMap.set(char.id, makeInitialState(Math.random() * (screenWidth - CHAR_WIDTH), 'general'))
        }
      }

      const wr = config.waterReminder
      if (wr.active && wr.alwaysVisible) {
        const wrKey = `water-${wr.characterId}`
        activeIds.add(wrKey)
        if (!stateMap.has(wrKey)) {
          stateMap.set(wrKey, makeInitialState(Math.random() * (screenWidth - CHAR_WIDTH), 'water'))
        }
      }

      const tr = config.taskReminder
      if (tr.active && tr.alwaysVisible) {
        const trKey = `task-${tr.characterId}`
        activeIds.add(trKey)
        if (!stateMap.has(trKey)) {
          stateMap.set(trKey, makeInitialState(Math.random() * (screenWidth - CHAR_WIDTH), 'task'))
        }
      }

      for (const key of stateMap.keys()) {
        if (!activeIds.has(key)) stateMap.delete(key)
      }
    },
    [screenWidth],
  )

  // ── Hover detection via pointermove ─────────────────────────────────────────
  // When setIgnoreMouseEvents(true, { forward: true }) is active on Windows,
  // mousemove events still fire in the renderer for hit-testing purposes,
  // but mouseenter/mouseleave do NOT. We detect hover manually here.
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent): void => {
      const stateMap = stateMapRef.current
      const windowHeight = window.innerHeight
      let anyHovered = false

      for (const [, s] of stateMap) {
        const hitLeft = s.x
        const hitRight = s.x + CHAR_WIDTH
        const hitTop = windowHeight - CHAR_HEIGHT
        const hitBottom = windowHeight

        const over =
          e.clientX >= hitLeft &&
          e.clientX <= hitRight &&
          e.clientY >= hitTop &&
          e.clientY <= hitBottom

        s.paused = over
        if (over) anyHovered = true
      }

      // Only invoke IPC when the state actually changes to avoid spamming
      if (anyHovered && clickThroughRef.current) {
        clickThroughRef.current = false
        window.overlayApi.setIgnoreMouseEvents(false)
      } else if (!anyHovered && !clickThroughRef.current) {
        clickThroughRef.current = true
        window.overlayApi.setIgnoreMouseEvents(true)
      }
    }

    document.addEventListener('pointermove', handlePointerMove)
    return () => document.removeEventListener('pointermove', handlePointerMove)
  }, [])

  // ── rAF animation loop ───────────────────────────────────────────────────────
  useEffect(() => {
    let tickCount = 0
    let lastRenderTick = 0

    const loop = (): void => {
      const stateMap = stateMapRef.current

      for (const [key, s] of stateMap) {
        // Skip all movement/animation updates while paused (hovered)
        if (s.paused) {
          rafRef.current = requestAnimationFrame(loop)
          continue
        }

        if (s.speaking || s.mode === 'idle') {
          // stationary — only advance frame for talk animation
          s.frameTick++
          if (s.frameTick >= FRAME_TICK_INTERVAL) {
            s.frameTick = 0
            s.frameIndex = (s.frameIndex + 1) % 2
          }
        } else if (s.popupPhase === 'walkin' || s.popupPhase === 'walkout') {
          const targetX = s.popupPhase === 'walkin' ? screenWidth * 0.65 : screenWidth + CHAR_WIDTH
          s.x += s.direction * WALK_SPEED

          if (s.direction === -1 && s.x <= targetX && s.popupPhase === 'walkin') {
            s.popupPhase = 'speaking'
            s.mode = 'idle'
            s.speaking = true
            s.speakTimer = setTimeout(() => {
              s.speaking = false
              s.popupPhase = 'walkout'
              s.direction = 1
              s.mode = 'walk'
            }, 8000)
          } else if (s.direction === 1 && s.x >= screenWidth + CHAR_WIDTH && s.popupPhase === 'walkout') {
            stateMap.delete(key)
          }

          s.frameTick++
          if (s.frameTick >= FRAME_TICK_INTERVAL) {
            s.frameTick = 0
            s.frameIndex = (s.frameIndex + 1) % 2
          }
        } else {
          // Normal walking
          s.x += s.direction * WALK_SPEED
          if (s.x <= 0) {
            s.x = 0
            s.direction = 1
          } else if (s.x >= screenWidth - CHAR_WIDTH) {
            s.x = screenWidth - CHAR_WIDTH
            s.direction = -1
          }

          s.frameTick++
          if (s.frameTick >= FRAME_TICK_INTERVAL) {
            s.frameTick = 0
            s.frameIndex = (s.frameIndex + 1) % 2
          }
        }
      }

      // Sync to React at ~30fps
      tickCount++
      if (tickCount - lastRenderTick >= 2) {
        lastRenderTick = tickCount
        const snap: CharacterRenderState[] = []
        for (const [key, s] of stateMap) {
          const charId = key.replace(/^(water|task)-/, '') as CharacterRenderState['id']
          snap.push({
            id: charId,
            x: s.x,
            direction: s.direction,
            frameIndex: s.frameIndex,
            mode: s.paused ? 'idle' : s.mode,  // show idle frame while paused
            speaking: s.speaking,
            message: s.message,
            role: s.role,
          })
        }
        setRenderStates(snap)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [screenWidth])

  // ── IPC listeners ────────────────────────────────────────────────────────────
  useEffect(() => {
    const overlayApi = window.overlayApi

    overlayApi.onConfigUpdate((config) => syncActiveChars(config))

    overlayApi.onFireWaterReminder(({ characterId }) => {
      const config = configRef.current
      if (!config) return
      if (config.waterReminder.alwaysVisible) {
        const s = stateMapRef.current.get(`water-${characterId}`)
        if (s) triggerSpeak(s, 'Time to drink water! 💧')
      } else {
        spawnPopup(`popup-water-${Date.now()}`, 'Time to drink water! 💧', 'water')
      }
    })

    overlayApi.onFireTaskReminder(({ task, characterId }) => {
      const config = configRef.current
      if (!config) return
      const msg = `Task due: ${task.title} ⏰`
      if (config.taskReminder.alwaysVisible) {
        const s = stateMapRef.current.get(`task-${characterId}`)
        if (s) triggerSpeak(s, msg)
      } else {
        spawnPopup(`popup-task-${task.id}`, msg, 'task')
      }
    })

    overlayApi.sendReady()
  }, [syncActiveChars])

  const handleClick = useCallback(
    (state: CharacterRenderState): void => {
      window.overlayApi.characterClicked({ characterId: state.id, role: state.role })
    },
    [],
  )

  const spawnPopup = (key: string, message: string, role: 'water' | 'task'): void => {
    const s = makeInitialState(screenWidth + CHAR_WIDTH, role)
    s.direction = -1
    s.popupPhase = 'walkin'
    s.message = message
    stateMapRef.current.set(key, s)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {renderStates.map((s) => (
        <CharacterSprite
          key={`${s.id}-${s.role}`}
          state={s}
          onClick={() => handleClick(s)}
        />
      ))}
    </div>
  )
}

function makeInitialState(x: number, role: 'general' | 'water' | 'task'): MutableCharState {
  return {
    x,
    direction: Math.random() > 0.5 ? 1 : -1,
    frameTick: 0,
    frameIndex: 0,
    paused: false,
    mode: 'walk',
    speaking: false,
    message: '',
    speakTimer: null,
    popupPhase: 'none',
    role,
  }
}

function triggerSpeak(s: MutableCharState, message: string): void {
  if (s.speakTimer) clearTimeout(s.speakTimer)
  s.message = message
  s.speaking = true
  s.mode = 'talk'
  s.speakTimer = setTimeout(() => {
    s.speaking = false
    s.mode = 'walk'
    s.speakTimer = null
  }, 8000)
}
