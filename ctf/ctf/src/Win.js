import React, { useEffect, useRef } from 'react'

export default function Home() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const colors = ['#ff7f00', '#0033a0', '#7c3aed', '#fbbf24', '#34d399', '#f472b6', '#60a5fa']
    const pieces = []

    for (let i = 0; i < 40; i++) {
      const el = document.createElement('div')
      el.style.cssText = `
        position: absolute;
        width: ${6 + Math.random() * 8}px;
        height: ${6 + Math.random() * 8}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * -10}%;
        animation: confettiFall ${2.5 + Math.random() * 3}s ${Math.random() * 4}s linear infinite;
        pointer-events: none;
      `
      container.appendChild(el)
      pieces.push(el)
    }
    return () => pieces.forEach(el => el.remove())
  }, [])

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .trophy { animation: bounce 1.6s ease-in-out infinite; }
        .congrats { animation: pulse 2s ease-in-out infinite, fadeInUp 0.8s ease both; }
        .subtitle { animation: fadeInUp 0.8s ease 0.4s both; }
        .badge { animation: fadeInUp 0.8s ease 0.7s both; }
        .star { animation: shimmer 1.5s ease-in-out infinite; }
        .star:nth-child(2) { animation-delay: 0.3s; }
        .star:nth-child(3) { animation-delay: 0.6s; }
        .star:nth-child(4) { animation-delay: 0.9s; }
        .star:nth-child(5) { animation-delay: 1.2s; }
      `}</style>

      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100vh',
          background: 'linear-gradient(135deg, #d3d0ff, #b0a8ff)',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          padding: '2rem',
          boxSizing: 'border-box',
        }}
      >
        {/* Estrelas */}
        <div style={{ marginBottom: '12px', letterSpacing: '6px', cursor: 'default' }}>
          {['⭐','⭐','⭐','⭐','⭐'].map((s, i) => (
            <span key={i} className="star" style={{ fontSize: '22px' }}>{s}</span>
          ))}
        </div>

        {/* Troféu */}
        <div className="trophy" style={{ fontSize: '80px', lineHeight: 1, cursor: 'default' }}>🏆</div>

        {/* Parabéns */}
        <h1
          className="congrats"
          style={{
            fontSize: '52px',
            fontWeight: 'bold',
            color: '#ff7f00',
            margin: '16px 0 8px',
            textShadow: '0 2px 16px rgba(255,127,0,0.25)',
            cursor: 'default'
          }}
        >
          Parabéns!
        </h1>

        {/* Subtítulo */}
        <p
          className="subtitle"
          style={{
            fontSize: '1.35rem',
            color: '#0033a0',
            fontWeight: 'bold',
            margin: '0 0 24px',
            maxWidth: '400px',
            lineHeight: '1.6',
            cursor: 'default'
          }}
        >
          Você concluiu o CTF Inatel cas@viva
        </p>

        {/* Badge */}
        <div
          className="badge"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255,255,255,0.55)',
            borderRadius: '999px',
            padding: '10px 24px',
            border: '1.5px solid rgba(255,255,255,0.8)',
            cursor: 'default'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="green" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'green' }}>
            Desafio concluído com sucesso
          </span>
        </div>
      </div>
    </>
  )
}