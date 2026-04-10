import React from 'react'
import { CharacterCard } from '../shared/CharacterCard'
import { Toggle } from '../shared/Toggle'
import type { WaterReminderConfig, CharacterId } from '../../../../shared/ipc-types'

const CHARACTER_IDS: CharacterId[] = ['ninja', 'samurai', 'robot', 'android', 'hero', 'astronaut']
const PRESETS = [15, 30, 45, 60]

interface Props {
  config: WaterReminderConfig
  onChange: (updated: WaterReminderConfig) => void
}

export function WaterReminderTab({ config, onChange }: Props): React.JSX.Element {
  const update = (patch: Partial<WaterReminderConfig>): void =>
    onChange({ ...config, ...patch })

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-1">Water Reminder</h2>
        <p className="text-sm text-slate-400">
          A character will remind you to stay hydrated at your chosen interval.
        </p>
      </div>

      {/* Enable / visibility */}
      <div className="flex gap-6">
        <Toggle
          checked={config.active}
          onChange={(v) => update({ active: v })}
          label="Enable water reminder"
        />
        <Toggle
          checked={config.alwaysVisible}
          onChange={(v) => update({ alwaysVisible: v })}
          label="Always visible on screen"
        />
      </div>

      {/* Interval */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-300">Reminder interval</label>
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((min) => (
            <button
              key={min}
              onClick={() => update({ intervalMinutes: min })}
              className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                config.intervalMinutes === min
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              {min} min
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="number"
            min={1}
            max={480}
            value={config.intervalMinutes}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              if (!isNaN(v) && v > 0) update({ intervalMinutes: v })
            }}
            className="w-24 bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <span className="text-sm text-slate-400">minutes (custom)</span>
        </div>
      </div>

      {/* Character picker */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-300">Choose your reminder buddy</label>
        <div className="grid grid-cols-6 gap-3">
          {CHARACTER_IDS.map((id) => (
            <CharacterCard
              key={id}
              id={id}
              selected={config.characterId === id}
              onClick={() => update({ characterId: id })}
              size={3}
            />
          ))}
        </div>
      </div>

      {config.active && (
        <div className="rounded-lg bg-blue-950/60 border border-blue-800 p-3 text-sm text-blue-300">
          💧 Reminder active — every <strong>{config.intervalMinutes} min</strong>.{' '}
          {config.alwaysVisible
            ? 'Character walks on screen continuously.'
            : "Character will pop up when it\u2019s time to drink."}
        </div>
      )}
    </div>
  )
}
