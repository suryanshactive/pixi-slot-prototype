import React, { useEffect, useState } from 'react';

export default function Hud({ state, subscribe }: any) {
  const [localState, setLocalState] = useState(state)

  useEffect(() => {
    // listen to game updates
    return subscribe(setLocalState)
  }, [subscribe])

  const isSpinning = localState.spinning === true

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '14px 26px',
        borderRadius: 14,
        background: 'linear-gradient(135deg, #2b2f5a, #151833)',
        color: '#f5c542',
        textAlign: 'center'
      }}
    >
      <div>Balance: {localState.balance}</div>
      <div>Win: {localState.win}</div>

      <button
        onClick={() => (window as any).spin()}
        disabled={isSpinning}
        style={{
          marginTop: 8,
          padding: '6px 14px',
          opacity: isSpinning ? 0.5 : 1,
          cursor: isSpinning ? 'not-allowed' : 'pointer'
        }}
      >
        SPIN
      </button>
    </div>
  )
}