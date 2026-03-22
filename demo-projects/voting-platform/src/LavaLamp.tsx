import React, { CSSProperties, useId, useMemo } from 'react';
import type { LavaLampColorTheme } from './config/lavaLampThemes';
import { COLOR_THEMES, LAVA_LAMP_THEME_LIST } from './config/lavaLampThemes';

export { type LavaLampColorTheme, COLOR_THEMES, LAVA_LAMP_THEME_LIST };

/**
 * Props for the LavaLamp component.
 *
 * A reusable animated SVG background that renders
 * organic "lava-like" blobs using SVG filters and CSS animations.
 *
 * All props are optional — `<LavaLamp />` works with sensible defaults.
 */
export type LavaLampProps = {
  /** Optional color override */
  colors?: string[];

  /** Built-in color theme */
  colorTheme?: LavaLampColorTheme;

  /**
   * Number of animated blobs rendered in the lava field.
   *
   * Higher values create a denser, more liquid look
   * but may slightly increase rendering cost.
   *
   * Default: `12`
   */
  ballCount?: number;

  /**
   * Minimum size of generated blobs.
   *
   * Values are internally scaled relative to the SVG coordinate system.
   * Larger values create bigger blobs.
   *
   * Default: `60`
   */
  minBallSize?: number;
  /**
   * Maximum size of generated blobs.
   *
   * Used together with `minBallSize` to randomize blob sizes.
   *
   * Default: `160`
   */
  maxBallSize?: number;

  /**
   * Global animation speed multiplier.
   *
   * Values > 1 speed up the animation.
   * Values < 1 slow the animation down.
   *
   * Example:
   * `0.5` = slow motion
   * `2` = twice as fast
   *
   * Default: `1`
   */
  speedMultiplier?: number;
  /**
   * Corner radius applied to the SVG clipping container.
   *
   * Allows the lava field to have rounded corners
   * when embedded inside cards or UI components.
   *
   * Set to `0` for a full rectangle.
   * Default: `18`
   */
  roundedness?: number;

  /**
   * Controls the roundness of the individual blobs.
   *
   * A value of `1` produces perfectly circular blobs.
   * Lower values stretch blobs vertically, creating
   * more organic lava-lamp style shapes.
   *
   * This affects only the blob shapes themselves,
   * not the container rounding.
   *
   * Recommended range: `0.4 – 1`
   *
   * Examples:
   * `1` → perfect circles
   * `0.7` → slightly organic
   * `0.5` → classic lava lamp shapes
   *
   * Default: `0.85`
   */
  blobRoundness?: number;

  /**
   * Maximum vertical movement distance of blobs.
   *
   * Higher values create more dramatic rising motion.
   * Default: `70`
   */
  verticalDrift?: number;

  /**
   * Horizontal wobble applied during blob animation.
   *
   * Controls how much blobs drift side-to-side
   * while floating.
   *
   * Default: `14`
   */
  horizontalDrift?: number;

  /**
   * Opacity of the overlay layer placed above the blobs.
   *
   * Useful for softening the background or improving
   * contrast with foreground content.
   *
   * Range: `0 – 1`
   *
   * Default: `0`
   */
  overlayOpacity?: number;

  /**
   * Strength of the blur applied to the lava background.
   *
   * Higher values create a softer, more obscured effect.
   *
   * Default: `0`
   */
  overlayBlur?: number;

  /**
   * Optional overlay tint color.
   *
   * Can be used to create frosted glass effects.
   *
   * Example:
   * `"rgba(255,255,255,0.2)"`
   *
   * Default: `"transparent"`
   */
  overlayColor?: string;

  className?: string;
  style?: CSSProperties;

  backgroundColor?: string;
};

type Blob = {
  id: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  duration: number;
  delay: number;
  driftX: number;
  rise: number;
  scaleTo: number;
  opacity: number;
  color: string;
};

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export const LavaLamp: React.FC<LavaLampProps> = ({
  colors,
  colorTheme = 'aurora',
  ballCount = 12,
  minBallSize = 20,
  maxBallSize = 80,
  speedMultiplier = 0.2,
  roundedness = 0,
  blobRoundness = 1,
  verticalDrift = 100,
  horizontalDrift = 50,
  overlayBlur = 8,
  overlayOpacity = 0.5,
  overlayColor = 'transparent',
  className,
  style,
  backgroundColor = 'transparent',
}) => {
  const palette = colors ?? COLOR_THEMES[colorTheme];

  const clipId = useId().replace(/:/g, '');

  const blobs = useMemo<Blob[]>(() => {
    return Array.from({ length: ballCount }, (_, i) => {
      const size = rand(minBallSize, maxBallSize);

      const rx = size / 4;
      const ry = size / 4 / blobRoundness;

      return {
        id: i,
        cx: rand(20, 80),
        cy: rand(70, 95),
        rx,
        ry,
        duration: rand(9, 18) / speedMultiplier,
        delay: rand(-15, 0),
        driftX: rand(-horizontalDrift, horizontalDrift),
        rise: rand(verticalDrift * 0.5, verticalDrift),
        scaleTo: rand(0.85, 1.25),
        opacity: 1,
        color: palette[i % palette.length],
      };
    });
  }, [
    palette,
    ballCount,
    minBallSize,
    maxBallSize,
    speedMultiplier,
    verticalDrift,
    horizontalDrift,
    blobRoundness,
  ]);

  return (
    <div
      className={className}
      style={{
        ...style,
        width: '100%',
        height: '100%',
        position: style?.position ?? 'fixed',
        inset: style?.position ? 0 : undefined,
        zIndex: style?.zIndex ?? -1,
        overflow: 'hidden',
        background: backgroundColor,
      }}
    >
      <svg
        id="overlay-blur-lava-lamp"
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          display: 'block',
          transform: 'scale(1.1)',
          transformOrigin: 'center',
          filter: overlayBlur ? `blur(${overlayBlur}px)` : undefined,
        }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="100" height="100" rx={roundedness} ry={roundedness} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          {blobs.map(blob => (
            <ellipse
              key={blob.id}
              cx={blob.cx}
              cy={blob.cy}
              rx={blob.rx}
              ry={blob.ry}
              fill={blob.color}
              opacity={blob.opacity}
              className={`blob-${clipId}-${blob.id}`}
            />
          ))}
        </g>
      </svg>

      <div
        id="overlay"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: overlayColor,
          opacity: overlayOpacity,
        }}
      />

      <style>
        {`
        svg ellipse {
          transform-box: fill-box;
          transform-origin: center;
          will-change: transform;
        }

        ${blobs
          .map(
            blob => `
        .blob-${clipId}-${blob.id} {
          animation: blobAnim-${clipId}-${blob.id} ${blob.duration}s ease-in-out ${blob.delay}s infinite alternate;
        }

        @keyframes blobAnim-${clipId}-${blob.id} {

          0% {
            transform: translate(0px,0px) scale(1);
          }

          30% {
            transform: translate(${blob.driftX * 0.5}px,-${blob.rise * 0.4}px)
              scale(${(1 + blob.scaleTo) / 2});
          }

          60% {
            transform: translate(${blob.driftX}px,-${blob.rise}px)
              scale(${blob.scaleTo});
          }

          80% {
            transform: translate(${blob.driftX * -0.3}px,-${blob.rise * 0.6}px)
              scale(${(1 + blob.scaleTo * 0.9) / 2});
          }

          100% {
            transform: translate(${blob.driftX * -0.6}px,10px)
              scale(0.95);
          }

        }
        `
          )
          .join('\n')}
      `}
      </style>
    </div>
  );
};

export default LavaLamp;
