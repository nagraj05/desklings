import React from 'react'
import { CharacterCard } from '../shared/CharacterCard'
import { AppSelector } from '../shared/AppSelector'
import { Toggle } from '../shared/Toggle'
import type { CharacterConfig, CharacterId } from '../../../../shared/ipc-types'

const ALL_IDS: CharacterId[] = ['ninja', 'samurai', 'robot', 'android', 'hero', 'astronaut']

interface Props {
  characters: CharacterConfig[]
  onChange: (updated: CharacterConfig[]) => void
}

export function GeneralTab({ characters, onChange }: Props): React.JSX.Element {
  const update = (id: CharacterId, patch: Partial<CharacterConfig>): void => {
    onChange(characters.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-1">Characters</h2>
        <p className="text-sm text-slate-400 mb-4">
          Pick a character, assign an app to launch when clicked, then activate it.
        </p>
      </div>

      <div className="space-y-4">
        {ALL_IDS.map((id) => {
          const char = characters.find((c) => c.id === id)!
          return (
            <div
              key={id}
              className="flex items-center gap-4 bg-slate-800/60 border border-slate-700 rounded-xl p-4"
            >
              {/* Character preview */}
              <CharacterCard id={id} selected={char.active} onClick={() => {}} size={4} />

              {/* Config */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{char.name}</span>
                  <Toggle
                    checked={char.active}
                    onChange={(v) => update(id, { active: v })}
                    label={char.active ? 'Active' : 'Inactive'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Assigned App</label>
                  <AppSelector
                    value={char.assignedAppPath}
                    onChange={(path) => update(id, { assignedAppPath: path })}
                  />
                </div>
                {!char.assignedAppPath && (
                  <p className="text-xs text-amber-400">No app assigned — click will do nothing.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
