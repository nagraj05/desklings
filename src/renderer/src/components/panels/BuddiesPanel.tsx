import React, { useState, useEffect } from 'react'
import type { BuddyConfig, DetectedApp } from '../../../../shared/ipc-types'
import { CHARACTER_KEYS, CHARACTER_DEFS, CATEGORIES, getByCategory } from '@overlay/characters'
import { CharacterPreview } from '../shared/CharacterPreview'

interface Props {
  buddies: BuddyConfig[]
  onChange: (buddies: BuddyConfig[]) => Promise<void>
}

export function BuddiesPanel({ buddies, onChange }: Props): React.JSX.Element {
  const [showAdd, setShowAdd] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string>(CHARACTER_KEYS[0])
  const [name, setName] = useState('')
  const [apps, setApps] = useState<DetectedApp[]>([])
  const [exePath, setExePath] = useState<string | null>(null)
  const [loadingApps, setLoadingApps] = useState(false)

  useEffect(() => {
    if (showAdd && apps.length === 0) {
      setLoadingApps(true)
      window.api.detectApps().then((a) => { setApps(a); setLoadingApps(false) })
    }
  }, [showAdd])

  const addBuddy = async (): Promise<void> => {
    const buddy: BuddyConfig = {
      id: crypto.randomUUID(),
      name: name.trim() || CHARACTER_DEFS[selectedKey].name,
      characterKey: selectedKey,
      exePath,
      active: true,
    }
    await onChange([...buddies, buddy])
    setShowAdd(false)
    setName('')
    setExePath(null)
    setSelectedKey(CHARACTER_KEYS[0])
  }

  const toggleActive = async (id: string): Promise<void> => {
    await onChange(buddies.map((b) => b.id === id ? { ...b, active: !b.active } : b))
  }

  const deleteBuddy = async (id: string): Promise<void> => {
    await onChange(buddies.filter((b) => b.id !== id))
  }

  const browse = async (): Promise<void> => {
    const path = await window.api.browseApp()
    if (path) setExePath(path)
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>My Buddies</h2>
          <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0' }}>
            Characters that walk across your screen.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Add Buddy
        </button>
      </div>

      {/* Buddy list */}
      {buddies.length === 0 && !showAdd && (
        <div
          style={{
            border: '1px dashed #1e1e2e',
            borderRadius: 12,
            padding: '40px 24px',
            textAlign: 'center',
            color: '#334155',
          }}
        >
          No buddies yet. Add one to get started!
        </div>
      )}

      <div className="flex flex-col gap-3">
        {buddies.map((buddy) => (
          <BuddyRow
            key={buddy.id}
            buddy={buddy}
            onToggle={() => toggleActive(buddy.id)}
            onDelete={() => deleteBuddy(buddy.id)}
          />
        ))}
      </div>

      {/* Add buddy form */}
      {showAdd && (
        <div style={{ background: '#12121f', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px' }}>
            Add a Buddy
          </h3>

          {/* Character picker */}
          <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 8 }}>
            CHARACTER
          </label>
          <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
            {CATEGORIES.map((cat) => (
              <div key={cat} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {cat}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {getByCategory(cat).map(([key, def]) => (
                    <button
                      key={key}
                      title={def.name}
                      onClick={() => { setSelectedKey(key); setName('') }}
                      style={{
                        background: selectedKey === key ? '#1e1e3a' : '#0f0f1c',
                        border: selectedKey === key ? '2px solid #6366f1' : '2px solid transparent',
                        borderRadius: 8,
                        padding: 4,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <CharacterPreview characterKey={key} scale={2} frameIndex={2} />
                      <span style={{ fontSize: 9, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {def.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Name input */}
          <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 6 }}>
            NAME
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={CHARACTER_DEFS[selectedKey]?.name ?? 'Buddy'}
            style={{
              width: '100%',
              background: '#0d0d14',
              border: '1px solid #1e1e2e',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 13,
              color: '#e2e8f0',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 14,
            }}
          />

          {/* App selector */}
          <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 6 }}>
            LAUNCH APP (optional)
          </label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <select
              value={exePath ?? ''}
              onChange={(e) => setExePath(e.target.value || null)}
              style={{
                flex: 1,
                background: '#0d0d14',
                border: '1px solid #1e1e2e',
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 13,
                color: exePath ? '#e2e8f0' : '#334155',
                outline: 'none',
              }}
            >
              <option value="">None</option>
              {loadingApps && <option disabled>Scanning…</option>}
              {apps.map((a) => (
                <option key={a.path} value={a.path}>{a.name}</option>
              ))}
            </select>
            <button
              onClick={browse}
              style={{
                background: '#1e1e2e',
                border: '1px solid #2e2e4a',
                borderRadius: 6,
                padding: '0 14px',
                fontSize: 12,
                color: '#94a3b8',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Browse…
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowAdd(false)}
              style={{
                background: 'transparent',
                border: '1px solid #1e1e2e',
                borderRadius: 6,
                padding: '7px 16px',
                fontSize: 13,
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={addBuddy}
              style={{
                background: '#6366f1',
                border: 'none',
                borderRadius: 6,
                padding: '7px 20px',
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function BuddyRow({
  buddy,
  onToggle,
  onDelete,
}: {
  buddy: BuddyConfig
  onToggle: () => void
  onDelete: () => void
}): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: '#12121f',
        border: '1px solid #1e1e2e',
        borderRadius: 10,
        padding: '10px 14px',
      }}
    >
      <CharacterPreview characterKey={buddy.characterKey} scale={2} animated frameIndex={0} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{buddy.name}</div>
        <div style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>
          {CHARACTER_DEFS[buddy.characterKey]?.name ?? buddy.characterKey}
          {buddy.exePath && <span style={{ color: '#475569' }}> · {buddy.exePath.split(/[/\\]/).pop()}</span>}
        </div>
      </div>
      {/* Active toggle */}
      <button
        onClick={onToggle}
        title={buddy.active ? 'Active — click to hide' : 'Inactive — click to show'}
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          background: buddy.active ? '#6366f1' : '#1e1e2e',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
          padding: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: buddy.active ? 19 : 3,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
          }}
        />
      </button>
      {/* Delete */}
      <button
        onClick={onDelete}
        title="Remove buddy"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#334155',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          padding: '0 2px',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#334155')}
      >
        ✕
      </button>
    </div>
  )
}
