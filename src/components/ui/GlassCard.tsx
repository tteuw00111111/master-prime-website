import { useRef, useState, useCallback, useMemo, HTMLAttributes, CSSProperties } from 'react'
import styles from './GlassCard.module.css'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  borderRadius?: string
  blur?: number
  contrast?: number
  brightness?: number
  saturation?: number
  depth?: number
  dispersion?: number
  lightAngle?: number
  lightIntensity?: number
  dynamicLighting?: boolean
  className?: string
  style?: CSSProperties
  children?: React.ReactNode
}

export const GlassCard: React.FC<GlassCardProps> = ({
  borderRadius = '75px',
  blur = 80,
  contrast = 1.15,
  brightness = 1.05,
  saturation = 2.0,
  depth = 50,
  dispersion = 50,
  lightAngle = -45,
  lightIntensity = 0.8,
  dynamicLighting = true,
  className = '',
  style = {},
  children,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  ...restProps
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>()
  const [currentAngle, setCurrentAngle] = useState(lightAngle)
  const [lightPosition, setLightPosition] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)

  // Memoize shadow calculations
  const shadowValues = useMemo(() => {
    const depthMultiplier = depth / 50;
    return {
      depth1: 30 * depthMultiplier,
      depth2: 20 * depthMultiplier,
      depth3: 12 * depthMultiplier,
    };
  }, [depth]);

  // Memoize dispersion intensity
  const dispersionIntensity = useMemo(() => dispersion / 100, [dispersion]);

  // Calculate dynamic shadow offsets only when angle changes
  const shadowOffsets = useMemo(() => {
    const lightRad = (currentAngle * Math.PI) / 180;
    return {
      x: Math.cos(lightRad + Math.PI) * 8,
      y: Math.sin(lightRad + Math.PI) * 8,
    };
  }, [currentAngle]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!dynamicLighting || !cardRef.current) {
        onMouseMove?.(e)
        return
      }

      // Cancel any pending RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const mouseX = e.clientX
        const mouseY = e.clientY

        // Calculate angle from center to mouse (-180 to 180 degrees)
        const deltaX = mouseX - centerX
        const deltaY = mouseY - centerY
        const angleRad = Math.atan2(deltaY, deltaX)
        const angleDeg = (angleRad * 180) / Math.PI

        // Calculate light position as percentage
        const lightX = ((deltaX / rect.width) * 100) + 50
        const lightY = ((deltaY / rect.height) * 100) + 50

        setCurrentAngle(angleDeg)
        setLightPosition({ x: lightX, y: lightY })
      })

      onMouseMove?.(e)
    },
    [dynamicLighting, onMouseMove]
  )

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(true)
      onMouseEnter?.(e)
    },
    [onMouseEnter]
  )

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(false)
      if (dynamicLighting) {
        // Reset to default angle
        setCurrentAngle(lightAngle)
        setLightPosition({ x: 50, y: 50 })
      }
      onMouseLeave?.(e)
    },
    [dynamicLighting, lightAngle, onMouseLeave]
  )

  // Memoize base style object
  const baseStyle = useMemo((): CSSProperties => {
    const { x: shadowX, y: shadowY } = shadowOffsets;
    const { depth1, depth2, depth3 } = shadowValues;

    return {
      borderRadius,
      background: `linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)`,
      backdropFilter: `blur(${blur}px) saturate(${saturation * 100}%) contrast(${contrast * 100}%) brightness(${brightness * 100}%)`,
      WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation * 100}%) contrast(${contrast * 100}%) brightness(${brightness * 100}%)`,
      border: '0.5px solid rgba(255, 255, 255, 0.2)',
      boxShadow: `
        ${shadowX}px ${shadowY}px ${depth1}px 0 rgba(0, 0, 0, 0.6),
        ${shadowX * 0.5}px ${shadowY * 0.5}px ${depth2}px -8px rgba(0, 0, 0, 0.4),
        ${shadowX * 0.3}px ${shadowY * 0.3}px ${depth3}px -4px rgba(0, 0, 0, 0.3),
        inset 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.15),
        inset 0 -1px 2px 0 rgba(0, 0, 0, 0.15)
      `,
      ['--light-angle' as any]: `${currentAngle}deg`,
      ['--light-x' as any]: `${lightPosition.x}%`,
      ['--light-y' as any]: `${lightPosition.y}%`,
      ['--light-intensity' as any]: lightIntensity,
      ['--dispersion-intensity' as any]: dispersionIntensity,
      ...style,
    } as CSSProperties;
  }, [
    borderRadius, blur, saturation, contrast, brightness,
    currentAngle, lightPosition, lightIntensity,
    shadowOffsets, shadowValues, dispersionIntensity, style
  ]);

  // Memoize highlight style
  const highlightStyle = useMemo((): CSSProperties => ({
    borderRadius,
    background: `radial-gradient(
      circle at var(--light-x) var(--light-y),
      rgba(255, 255, 255, calc(var(--light-intensity) * 0.25)) 0%,
      rgba(255, 255, 255, calc(var(--light-intensity) * 0.12)) 30%,
      transparent 70%
    )`,
  }), [borderRadius]);

  // Memoize dispersion style
  const dispersionStyle = useMemo((): CSSProperties => ({
    borderRadius,
    background: `
      radial-gradient(
        circle at var(--light-x) var(--light-y),
        rgba(255, 100, 100, calc(var(--dispersion-intensity) * 0.08)) 0%,
        transparent 40%
      ),
      radial-gradient(
        circle at calc(var(--light-x) + 2%) calc(var(--light-y) + 2%),
        rgba(100, 100, 255, calc(var(--dispersion-intensity) * 0.08)) 0%,
        transparent 40%
      )
    `,
  }), [borderRadius]);

  return (
    <div
      ref={cardRef}
      className={`${styles.glassCard} ${className}`}
      style={baseStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...restProps}
    >
      {/* Dynamic highlight layer - Only visible on hover */}
      {isHovered && (
        <>
          <div className={styles.highlight} style={highlightStyle} />
          <div className={styles.dispersion} style={dispersionStyle} />
        </>
      )}

      {/* Content wrapper */}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}
