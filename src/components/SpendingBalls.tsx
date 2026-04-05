import { useEffect, useRef, useState } from 'react';

interface BallData {
  name: string;
  value: number;
  color: string;
  icon: string;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  data: BallData;
  pulsePhase: number;
}

interface Props {
  categories: BallData[];
  totalExpenses: number;
}

const MIN_BALL = 42;
const MAX_BALL = 100;

function formatCurrencyShort(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}k`;
  return `₹${amount}`;
}

export default function SpendingBalls({ categories, totalExpenses }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: -999, y: -999 });
  const timeRef = useRef(0);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [time, setTime] = useState(0);
  const [hoveredBall, setHoveredBall] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !categories.length) return;
    const W = el.clientWidth;
    const H = el.clientHeight;

    ballsRef.current = categories.map((cat, i) => {
      const pct = totalExpenses > 0 ? cat.value / totalExpenses : 0.1;
      const size = MIN_BALL + pct * (MAX_BALL - MIN_BALL) * categories.length;
      const clampedSize = Math.min(MAX_BALL, Math.max(MIN_BALL, size));
      const angle = (i / categories.length) * Math.PI * 2;
      const r = Math.min(W, H) * 0.28;
      return {
        id: i,
        x: W / 2 + Math.cos(angle) * r,
        y: H / 2 + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        size: clampedSize,
        data: cat,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    });
    setBalls([...ballsRef.current]);

    const animate = () => {
      timeRef.current += 0.016;
      const W2 = el.clientWidth;
      const H2 = el.clientHeight;
      const balls = ballsRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        const r = b.size / 2;

        // gentle float gravity toward center
        const cx = W2 / 2;
        const cy = H2 / 2;
        b.vx += (cx - b.x) * 0.0004;
        b.vy += (cy - b.y) * 0.0004;

        // subtle sine drift
        b.vx += Math.sin(timeRef.current * 0.5 + b.pulsePhase) * 0.015;
        b.vy += Math.cos(timeRef.current * 0.4 + b.pulsePhase * 1.3) * 0.015;

        // mouse repulsion
        const dx = b.x - mx;
        const dy = b.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repulse = 130;
        if (dist < repulse && dist > 0) {
          const force = (repulse - dist) / repulse;
          b.vx += (dx / dist) * force * 2.5;
          b.vy += (dy / dist) * force * 2.5;
        }

        // ball-ball collision
        for (let j = i + 1; j < balls.length; j++) {
          const b2 = balls[j];
          const cdx = b.x - b2.x;
          const cdy = b.y - b2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          const minDist = r + b2.size / 2 + 6;
          if (cdist < minDist && cdist > 0) {
            const overlap = (minDist - cdist) / 2;
            const nx = cdx / cdist;
            const ny = cdy / cdist;
            b.x += nx * overlap;
            b.y += ny * overlap;
            b2.x -= nx * overlap;
            b2.y -= ny * overlap;
            const relVx = b.vx - b2.vx;
            const relVy = b.vy - b2.vy;
            const dot = relVx * nx + relVy * ny;
            if (dot < 0) {
              b.vx -= dot * nx * 0.6;
              b.vy -= dot * ny * 0.6;
              b2.vx += dot * nx * 0.6;
              b2.vy += dot * ny * 0.6;
            }
          }
        }

        // dampen + move
        b.vx *= 0.96;
        b.vy *= 0.96;
        b.x += b.vx;
        b.y += b.vy;

        // wall bounce with padding
        const pad = 8;
        if (b.x - r < pad) { b.x = r + pad; b.vx = Math.abs(b.vx) * 0.7; }
        if (b.x + r > W2 - pad) { b.x = W2 - r - pad; b.vx = -Math.abs(b.vx) * 0.7; }
        if (b.y - r < pad) { b.y = r + pad; b.vy = Math.abs(b.vy) * 0.7; }
        if (b.y + r > H2 - pad) { b.y = H2 - r - pad; b.vy = -Math.abs(b.vy) * 0.7; }
      }

      setBalls([...ballsRef.current]);
      setTime(timeRef.current);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [categories, totalExpenses]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => {
      mouseRef.current = { x: -999, y: -999 };
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const pct = (val: number) =>
    totalExpenses > 0 ? ((val / totalExpenses) * 100).toFixed(1) : '0';

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: 300,
          overflow: 'hidden',
          borderRadius: 16,
          background:
            'radial-gradient(ellipse at 30% 40%, rgba(45,90,61,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(201,168,76,0.08) 0%, transparent 50%)',
        }}
      >
        {balls.map((ball) => {
          const isHovered = hoveredBall === ball.id;
          const glowColor = ball.data.color;
          const pulse = Math.sin(time * 1.5 + ball.pulsePhase) * 0.04;
          const scale = isHovered ? 1.12 : 1 + pulse;

          return (
            <div
              key={ball.id}
              onMouseEnter={() => setHoveredBall(ball.id)}
              onMouseLeave={() => setHoveredBall(null)}
              style={{
                position: 'absolute',
                left: ball.x - ball.size / 2,
                top: ball.y - ball.size / 2,
                width: ball.size,
                height: ball.size,
                borderRadius: '50%',
                background: `radial-gradient(circle at 32% 30%, ${glowColor}ff 0%, ${glowColor}cc 40%, ${glowColor}88 100%)`,
                boxShadow: isHovered
                  ? `0 0 0 3px rgba(201,168,76,0.6), 0 8px 32px ${glowColor}80, 0 0 60px ${glowColor}40`
                  : `0 6px 24px ${glowColor}60, inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.15)`,
                transform: `scale(${scale})`,
                transition: isHovered ? 'box-shadow 0.2s ease, transform 0.2s ease' : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                zIndex: isHovered ? 10 : 1,
              }}
            >
              {/* shine overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle at 35% 25%, rgba(255,255,255,0.45) 0%, transparent 55%)',
                  pointerEvents: 'none',
                }}
              />
              {ball.size > 55 && (
                <>
                  <div style={{ fontSize: ball.size > 70 ? 20 : 15, lineHeight: 1 }}>
                    {ball.data.icon}
                  </div>
                  <div
                    style={{
                      fontSize: ball.size > 70 ? 10 : 9,
                      fontWeight: 700,
                      color: '#fff',
                      textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      marginTop: 2,
                      maxWidth: ball.size - 10,
                      textAlign: 'center',
                      lineHeight: 1.1,
                      overflow: 'hidden',
                    }}
                  >
                    {ball.data.name.split(' ')[0]}
                  </div>
                  {ball.size > 68 && (
                    <div
                      style={{
                        fontSize: 9,
                        color: 'rgba(255,255,255,0.85)',
                        fontWeight: 600,
                        marginTop: 1,
                        textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}
                    >
                      {formatCurrencyShort(ball.data.value)}
                    </div>
                  )}
                </>
              )}
              {ball.size <= 55 && (
                <div style={{ fontSize: 16 }}>{ball.data.icon}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 16px',
          marginTop: 16,
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.4)',
          borderRadius: 12,
          border: '1px solid rgba(180,200,190,0.3)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {categories.map((cat, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'var(--text-muted)',
              fontWeight: 500,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: cat.color,
                boxShadow: `0 0 6px ${cat.color}80`,
                flexShrink: 0,
              }}
            />
            <span style={{ color: 'var(--text)' }}>{cat.icon} {cat.name}</span>
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{pct(cat.value)}%</span>
          </div>
        ))}
      </div>

      {/* Tooltip for hovered ball */}
      {hoveredBall !== null && balls[hoveredBall] && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(27,58,45,0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: 12,
            padding: '10px 14px',
            border: '1px solid rgba(201,168,76,0.4)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          <div style={{ color: '#F5F0E8', fontWeight: 700, fontSize: 13 }}>
            {balls[hoveredBall].data.icon}{' '}
            {balls[hoveredBall].data.name}
          </div>
          <div style={{ color: '#C9A84C', fontWeight: 700, fontSize: 16, marginTop: 2 }}>
            {formatCurrencyShort(balls[hoveredBall].data.value)}
          </div>
          <div style={{ color: 'rgba(245,240,232,0.6)', fontSize: 11, marginTop: 2 }}>
            {pct(balls[hoveredBall].data.value)}% of expenses
          </div>
        </div>
      )}
    </div>
  );
}
