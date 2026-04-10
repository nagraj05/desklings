import React from 'react'

interface Props {
  message: string
  direction: 1 | -1
}

export function SpeechBubble({ message, direction }: Props): React.JSX.Element {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: direction === 1 ? '50%' : 'auto',
        right: direction === -1 ? '50%' : 'auto',
        transform: direction === 1 ? 'translateX(-10%)' : 'translateX(10%)',
        marginBottom: 6,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: '#fff',
          border: '2px solid #1a1a2e',
          borderRadius: 8,
          padding: '4px 8px',
          fontSize: 11,
          fontFamily: 'monospace',
          color: '#1a1a2e',
          fontWeight: 'bold',
          imageRendering: 'pixelated',
          boxShadow: '2px 2px 0 #1a1a2e',
        }}
      >
        {message}
      </div>
      {/* Tail */}
      <div
        style={{
          position: 'absolute',
          bottom: -7,
          left: direction === 1 ? 10 : 'auto',
          right: direction === -1 ? 10 : 'auto',
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '6px solid #1a1a2e',
        }}
      />
    </div>
  )
}
