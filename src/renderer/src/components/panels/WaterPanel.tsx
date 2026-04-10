import React from 'react'
import type { BuddyConfig, WaterReminderConfig } from '../../../../shared/ipc-types'

interface Props {
  config: WaterReminderConfig
  buddies: BuddyConfig[]
  onChange: (config: WaterReminderConfig) => Promise<void>
}

const PRESETS = [15, 30, 45, 60, 90, 120]

export function WaterPanel({ config, buddies, onChange }: Props): React.JSX.Element {
  const activeBuddies = buddies.filter((b) => b.active)

  const update = (partial: Partial<WaterReminderConfig>): void => {
    onChange({ ...config, ...partial })
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-lg">
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Water Reminder</h2>
        <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0' }}>
          Your buddy will remind you to stay hydrated.
        </p>
      </div>

      {/* Enable toggle */}
      <Row label="Enable reminders">
        <Toggle checked={config.active} onChange={(v) => update({ active: v })} />
      </Row>

      {config.active && (
        <>
          {/* Buddy selector */}
          <Row label="Reminder buddy">
            <select
              value={config.buddyId ?? ''}
              onChange={(e) => update({ buddyId: e.target.value || null })}
              style={selectStyle}
            >
              <option value="">Any active buddy</option>
              {activeBuddies.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </Row>

          {/* Interval presets */}
          <div>
            <label style={labelStyle}>INTERVAL</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {PRESETS.map((min) => (
                <button
                  key={min}
                  onClick={() => update({ intervalMinutes: min })}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 13,
                    border: '1px solid',
                    cursor: 'pointer',
                    background: config.intervalMinutes === min ? '#6366f1' : '#12121f',
                    borderColor: config.intervalMinutes === min ? '#6366f1' : '#1e1e2e',
                    color: config.intervalMinutes === min ? '#fff' : '#64748b',
                    fontWeight: config.intervalMinutes === min ? 600 : 400,
                  }}
                >
                  {min < 60 ? `${min}m` : `${min / 60}h`}
                </button>
              ))}
            </div>
          </div>

          {/* Always visible */}
          <Row label="Always keep buddy on screen">
            <Toggle
              checked={config.alwaysVisible}
              onChange={(v) => update({ alwaysVisible: v })}
            />
          </Row>
          {!config.alwaysVisible && (
            <p style={{ fontSize: 12, color: '#334155', margin: '-12px 0 0' }}>
              Buddy will walk in when it\u2019s time to drink water, then leave.
            </p>
          )}
        </>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ fontSize: 14, color: '#94a3b8' }}>{label}</span>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }): React.JSX.Element {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: checked ? '#6366f1' : '#1e1e2e',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        flexShrink: 0,
        padding: 0,
        transition: 'background 0.2s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const selectStyle: React.CSSProperties = {
  background: '#0d0d14',
  border: '1px solid #1e1e2e',
  borderRadius: 6,
  padding: '7px 10px',
  fontSize: 13,
  color: '#e2e8f0',
  outline: 'none',
  minWidth: 180,
}
