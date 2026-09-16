import React, { useLayoutEffect, useRef, useState } from 'react'

// Measure full titles in the card's actual font and available space. Keep the
// complete application array in the caller for My Schemes and text sharing.
export default function WelfareCardSchemes({ titles, moreLabel }) {
  const hostRef = useRef(null)
  const measureRef = useRef(null)
  const moreRef = useRef(null)
  const [visibleCount, setVisibleCount] = useState(0)
  const candidates = titles.slice(0, 6)

  useLayoutEffect(() => {
    let active = true
    const measure = () => {
      if (!active) return
      const host = hostRef.current
      const rows = Array.from(measureRef.current.children)
      const top = measureRef.current.getBoundingClientRect().top
      const available = host.clientHeight
      const fits = (count, reserve) => count === 0 ||
        rows[count - 1].getBoundingClientRect().bottom - top <= available - reserve - 1
      let count = rows.length
      if (titles.length > count || !fits(count, 0)) {
        const reserve = moreRef.current.getBoundingClientRect().height + 8
        while (count > 0 && !fits(count, reserve)) count--
      }
      setVisibleCount(count)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(hostRef.current)
    observer.observe(measureRef.current)
    observer.observe(moreRef.current)
    document.fonts?.ready.then(measure)
    return () => { active = false; observer.disconnect() }
  }, [titles, moreLabel])

  const row = (title, index) => (
    <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
      <span style={{ color: '#f76201', fontSize: 10, flexShrink: 0, marginTop: 2 }}>✦</span>
      <span style={{ minWidth: 0, overflowWrap: 'anywhere', fontSize: 11.5, color: '#0f172a', lineHeight: 1.4, fontWeight: 500 }}>{title}</span>
    </div>
  )
  const listStyle = { display: 'flex', flexDirection: 'column', gap: 6 }
  const moreStyle = { fontSize: 10.5, lineHeight: 1.4, fontWeight: 700, color: '#c2410c', overflowWrap: 'anywhere' }
  const remaining = titles.length - visibleCount

  return (
    <div ref={hostRef} data-welfare-schemes style={{ flex: 1, minHeight: 0, position: 'relative' }}>
      <div aria-hidden="true" data-html2canvas-ignore style={{ position: 'absolute', inset: '0 0 auto', visibility: 'hidden', pointerEvents: 'none' }}>
        <div ref={measureRef} style={listStyle}>{candidates.map(row)}</div>
        <div ref={moreRef} style={moreStyle}>{moreLabel(titles.length)}</div>
      </div>
      <div data-welfare-visible style={listStyle}>{candidates.slice(0, visibleCount).map(row)}</div>
      {remaining > 0 && <div data-welfare-more style={{ ...moreStyle, marginTop: visibleCount ? 8 : 0 }}>{moreLabel(remaining)}</div>}
    </div>
  )
}
