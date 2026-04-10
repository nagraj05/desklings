import React, { useRef, useEffect, useState, useCallback } from 'react'
import { CharacterSprite } from './components/CharacterSprite'
import type { CharacterRenderState } from './components/CharacterSprite'
import { SCALE, FRAME_SIZE } from './characters'
import type { BuddyConfig, WaterReminderConfig, TaskReminderConfig } from '../../shared/ipc-types'

const CHAR_SIZE = FRAME_SIZE * SCALE  // 48px
const CHAR_HEIGHT = CHAR_SIZE + 14    // canvas + name label
const WALK_SPEED = 1.2
const FRAME_TICK_INTERVAL = 10

interface MutableCharState {
  buddyId: string
  characterKey: string
  name: string
  x: number
  direction: 1 | -1
  frameTick: number
  frameIndex: number  // 0=walk0,1=walk1,2=idle,3=talk
  paused: boolean
  speaking: boolean
  message: string
  speakTimer: ReturnType<typeof setTimeout> | null
  popupPhase: 'none' | 'walkin' | 'speaking' | 'walkout'
  role: 'general' | 'water' | 'task'
}

interface Config {
  buddies: BuddyConfig[]
  waterReminder: WaterReminderConfig
  taskReminder: TaskReminderConfig
}

export function OverlayApp(): React.JSX.Element {
  const screenWidth = window.screen.width
  const stateMapRef = useRef<Map<string, MutableCharState>>(new Map())
  const rafRef = useRef<number>(0)
  const configRef = useRef<Config | null>(null)
  const clickThroughRef = useRef(true)

  const [renderStates, setRenderStates] = useState<CharacterRenderState[]>([])

  const syncActiveBuddies = useCallback(
    (config: Config) => {
      configRef.current = config
      const stateMap = stateMapRef.current
      const activeIds = new Set<string>()

      for (const buddy of config.buddies) {
        if (!buddy.active) continue
        activeIds.add(buddy.id)
        if (!stateMap.has(buddy.id)) {
          stateMap.set(buddy.id, makeInitialState(
            buddy.id,
            buddy.characterKey,
            buddy.name,
            Math.random() * (screenWidth - CHAR_SIZE),
            'general',
          ))
        } else {
          // Update characterKey/name if changed
          const s = stateMap.get(buddy.id)!
          s.characterKey = buddy.characterKey
          s.name = buddy.name
        }
      }

      // Always-visible water buddy
      const wr = config.waterReminder
      if (wr.active && wr.alwaysVisible && wr.buddyId) {
        const wrKey = `water-${wr.buddyId}`
        activeIds.add(wrKey)
        if (!stateMap.has(wrKey)) {
          const buddy = config.buddies.find((b) => b.id === wr.buddyId)
          stateMap.set(wrKey, makeInitialState(
            wrKey,
            buddy?.characterKey ?? 'classic',
            buddy?.name ?? 'Water',
            Math.random() * (screenWidth - CHAR_SIZE),
            'water',
          ))
        }
      }

      // Always-visible task buddy
      const tr = config.taskReminder
      if (tr.active && tr.alwaysVisible && tr.buddyId) {
        const trKey = `task-${tr.buddyId}`
        activeIds.add(trKey)
        if (!stateMap.has(trKey)) {
          const buddy = config.buddies.find((b) => b.id === tr.buddyId)
          stateMap.set(trKey, makeInitialState(
            trKey,
            buddy?.characterKey ?? 'classic',
            buddy?.name ?? 'Tasks',
            Math.random() * (screenWidth - CHAR_SIZE),
            'task',
          ))
        }
      }

      for (const key of stateMap.keys()) {
        if (!activeIds.has(key)) stateMap.delete(key)
      }
    },
    [screenWidth],
  )

  // ── Hover detection via pointermove ─────────────────────────────────────────
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent): void => {
      const stateMap = stateMapRef.current
      const windowHeight = window.innerHeight
      let anyHovered = false

      for (const [, s] of stateMap) {
        const hitLeft = s.x
        const hitRight = s.x + CHAR_SIZE
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
        if (s.paused) continue

        if (s.speaking || s.frameIndex === 2 /* idle */) {
          // Stationary — cycle between idle(2) and talk(3) frames only
          s.frameTick++
          if (s.frameTick >= FRAME_TICK_INTERVAL) {
            s.frameTick = 0
            s.frameIndex = s.speaking ? 3 : 2
          }
        } else if (s.popupPhase === 'walkin' || s.popupPhase === 'walkout') {
          const targetX = s.popupPhase === 'walkin' ? screenWidth * 0.65 : screenWidth + CHAR_SIZE
          s.x += s.direction * WALK_SPEED

          if (s.direction === -1 && s.x <= targetX && s.popupPhase === 'walkin') {
            s.popupPhase = 'speaking'
            s.frameIndex = 2
            s.speaking = true
            s.speakTimer = setTimeout(() => {
              s.speaking = false
              s.popupPhase = 'walkout'
              s.direction = 1
              s.frameIndex = 0
            }, 8000)
          } else if (s.direction === 1 && s.x >= screenWidth + CHAR_SIZE && s.popupPhase === 'walkout') {
            stateMap.delete(key)
          }

          s.frameTick++
          if (s.frameTick >= FRAME_TICK_INTERVAL) {
            s.frameTick = 0
            s.frameIndex = s.frameIndex === 0 ? 1 : 0
          }
        } else {
          // Normal walking
          s.x += s.direction * WALK_SPEED
          if (s.x <= 0) {
            s.x = 0
            s.direction = 1
          } else if (s.x >= screenWidth - CHAR_SIZE) {
            s.x = screenWidth - CHAR_SIZE
            s.direction = -1
          }

          s.frameTick++
          if (s.frameTick >= FRAME_TICK_INTERVAL) {
            s.frameTick = 0
            s.frameIndex = s.frameIndex === 0 ? 1 : 0
          }
        }
      }

      tickCount++
      if (tickCount - lastRenderTick >= 2) {
        lastRenderTick = tickCount
        const snap: CharacterRenderState[] = []
        for (const [, s] of stateMap) {
          snap.push({
            buddyId: s.buddyId,
            characterKey: s.characterKey,
            name: s.name,
            x: s.x,
            direction: s.direction,
            frameIndex: s.paused ? 2 : s.frameIndex,
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

    overlayApi.onConfigUpdate((config) => syncActiveBuddies(config))

    overlayApi.onFireWaterReminder(({ buddyId }) => {
      const config = configRef.current
      if (!config) return
      if (config.waterReminder.alwaysVisible) {
        const s = stateMapRef.current.get(`water-${buddyId}`)
        if (s) triggerSpeak(s, 'Time to drink water! 💧')
      } else {
        spawnPopup(`popup-water-${Date.now()}`, 'Time to drink water! 💧', 'water', buddyId, config)
      }
    })

    overlayApi.onFireTaskReminder(({ task, buddyId }) => {
      const config = configRef.current
      if (!config) return
      const msg = `Task due: ${task.title} ⏰`
      if (config.taskReminder.alwaysVisible) {
        const s = stateMapRef.current.get(`task-${buddyId}`)
        if (s) triggerSpeak(s, msg)
      } else {
        spawnPopup(`popup-task-${task.id}`, msg, 'task', buddyId, config)
      }
    })

    overlayApi.sendReady()
  }, [syncActiveBuddies])

  const handleClick = useCallback((state: CharacterRenderState): void => {
    window.overlayApi.characterClicked({ buddyId: state.buddyId, role: state.role })
  }, [])

  const spawnPopup = (
    key: string,
    message: string,
    role: 'water' | 'task',
    buddyId: string,
    config: Config,
  ): void => {
    const buddy = config.buddies.find((b) => b.id === buddyId)
    const s = makeInitialState(
      key,
      buddy?.characterKey ?? 'classic',
      buddy?.name ?? role,
      screenWidth + CHAR_SIZE,
      role,
    )
    s.direction = -1
    s.popupPhase = 'walkin'
    s.message = message
    stateMapRef.current.set(key, s)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {renderStates.map((s) => (
        <CharacterSprite
          key={`${s.buddyId}`}
          state={s}
          onClick={() => handleClick(s)}
        />
      ))}
    </div>
  )
}

function makeInitialState(
  buddyId: string,
  characterKey: string,
  name: string,
  x: number,
  role: 'general' | 'water' | 'task',
): MutableCharState {
  return {
    buddyId,
    characterKey,
    name,
    x,
    direction: Math.random() > 0.5 ? 1 : -1,
    frameTick: 0,
    frameIndex: 0,
    paused: false,
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
  s.frameIndex = 3
  s.speakTimer = setTimeout(() => {
    s.speaking = false
    s.frameIndex = 0
    s.speakTimer = null
  }, 8000)
}
