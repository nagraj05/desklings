import React from 'react'
import { CATEGORIES, getByCategory } from '@overlay/characters'
import { CharacterPreview } from '../shared/CharacterPreview'

export function LibraryPanel(): React.JSX.Element {
  return (
    <div className="p-6 flex flex-col gap-8">
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Character Library</h2>
        <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0' }}>
          All available characters. Add any of these as a buddy.
        </p>
      </div>

      {CATEGORIES.map((cat) => {
        const chars = getByCategory(cat)
        return (
          <div key={cat}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {cat}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {chars.map(([key, def]) => (
                <div
                  key={key}
                  style={{
                    background: '#12121f',
                    border: '1px solid #1e1e2e',
                    borderRadius: 10,
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    width: 80,
                  }}
                >
                  <CharacterPreview characterKey={key} scale={2} animated frameIndex={0} />
                  <span style={{ fontSize: 10, color: '#64748b', textAlign: 'center', lineHeight: 1.2 }}>
                    {def.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
