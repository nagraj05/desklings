import React, { useEffect, useState } from 'react'
import type { DetectedApp } from '../../../../shared/ipc-types'

interface Props {
  value: string | null
  onChange: (path: string | null, name?: string) => void
}

export function AppSelector({ value, onChange }: Props): React.JSX.Element {
  const [apps, setApps] = useState<DetectedApp[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const load = async (): Promise<void> => {
    if (searched) return
    setLoading(true)
    setSearched(true)
    try {
      const detected = await window.api.detectApps()
      setApps(detected)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const v = e.target.value
    if (v === '__browse__') {
      handleBrowse()
      return
    }
    if (v === '') {
      onChange(null)
      return
    }
    const app = apps.find((a) => a.path === v)
    onChange(v, app?.name)
  }

  const handleBrowse = async (): Promise<void> => {
    const path = await window.api.browseApp()
    if (path) onChange(path)
  }

  const displayValue = value && !apps.find((a) => a.path === value) ? '__custom__' : (value ?? '')

  return (
    <div className="flex gap-2">
      <select
        className="flex-1 bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
        value={displayValue}
        onChange={handleSelect}
        onFocus={load}
      >
        <option value="">— None —</option>
        {loading && <option disabled>Scanning apps…</option>}
        {apps.map((app) => (
          <option key={app.path} value={app.path}>
            {app.name}
          </option>
        ))}
        {value && !apps.find((a) => a.path === value) && (
          <option value="__custom__">{value.split(/[\\/]/).pop()}</option>
        )}
        <option value="__browse__">Browse…</option>
      </select>
      <button
        onClick={handleBrowse}
        className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-slate-300 transition-colors"
      >
        Browse
      </button>
    </div>
  )
}
