import { useThemeStore } from '@/store/themeStore';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  variant?: FxVariant; // optional override, otherwise random per mount
}

type FxVariant = 'rain' | 'burst' | 'sparkle' | 'rise';

// A single particle's config, discriminated by which variant it belongs to
type Particle =
  | { kind: 'rain'; key: number; left: number; size: number; color: string; rotation: number; round: boolean; delay: number; duration: number }
  | { kind: 'burst'; key: number; size: number; color: string; dx: number; dy: number; delay: number }
  | { kind: 'sparkle'; key: number; left: number; top: number; size: number; glyph: string; delay: number }
  | { kind: 'rise'; key: number; left: number; size: number; color: string; sway: number; delay: number; duration: number };

const VARIANTS: FxVariant[] = ['rain', 'burst', 'sparkle', 'rise'];
const SPARKLE_GLYPHS = ['✨', '⭐'];

// ------------------------------------------------------------
// Builds the particle set for a variant (called once on mount)
// ------------------------------------------------------------
function buildParticles(variant: FxVariant, colors: string[]): Particle[] {
  if (variant === 'burst') {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
      const distance = 60 + Math.random() * 55;
      return {
        kind: 'burst',
        key: i,
        color: colors[i % colors.length],
        size: 7 + Math.random() * 5,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        delay: Math.random() * 80,
      };
    });
  }

  if (variant === 'sparkle') {
    return Array.from({ length: 10 }, (_, i) => ({
      kind: 'sparkle',
      key: i,
      left: 8 + Math.random() * 84,
      top: 8 + Math.random() * 72,
      size: 14 + Math.random() * 8,
      glyph: SPARKLE_GLYPHS[i % SPARKLE_GLYPHS.length],
      delay: Math.random() * 500,
    }));
  }

  if (variant === 'rise') {
    return Array.from({ length: 14 }, (_, i) => ({
      kind: 'rise',
      key: i,
      left: Math.random() * 100,
      size: 8 + Math.random() * 8,
      color: colors[i % colors.length],
      sway: (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 14),
      delay: Math.random() * 600,
      duration: 1500 + Math.random() * 800,
    }));
  }

  // rain
  return Array.from({ length: 18 }, (_, i) => ({
    kind: 'rain',
    key: i,
    left: Math.random() * 100,
    size: 6 + Math.random() * 6,
    color: colors[i % colors.length],
    rotation: 180 + Math.random() * 360,
    round: Math.random() > 0.5,
    delay: Math.random() * 500,
    duration: 1200 + Math.random() * 700,
  }));
}

// ------------------------------------------------------------
// Single animated particle — plays once on mount
// ------------------------------------------------------------
function ParticleView({ particle }: { particle: Particle }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (particle.kind === 'sparkle') {
      progress.value = withDelay(particle.delay, withSequence(
        withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 750, easing: Easing.in(Easing.quad) }),
      ));
    } else if (particle.kind === 'burst') {
      progress.value = withDelay(particle.delay, withTiming(1, { duration: 850, easing: Easing.out(Easing.cubic) }));
    } else if (particle.kind === 'rise') {
      progress.value = withDelay(particle.delay, withTiming(1, { duration: particle.duration, easing: Easing.out(Easing.quad) }));
    } else {
      progress.value = withDelay(particle.delay, withTiming(1, { duration: particle.duration, easing: Easing.linear }));
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    if (particle.kind === 'rain') {
      return {
        opacity: 1 - Math.max(0, progress.value - 0.7) / 0.3,
        transform: [
          { translateY: -20 + progress.value * 260 },
          { rotate: `${progress.value * particle.rotation}deg` },
        ],
      };
    }
    if (particle.kind === 'burst') {
      return {
        opacity: 1 - progress.value,
        transform: [
          { translateX: progress.value * particle.dx },
          { translateY: progress.value * particle.dy },
          { scale: 1 - progress.value * 0.5 },
        ],
      };
    }
    if (particle.kind === 'rise') {
      return {
        opacity: 1 - Math.max(0, progress.value - 0.6) / 0.4,
        transform: [
          { translateY: -progress.value * 240 },
          { translateX: Math.sin(progress.value * Math.PI * 3) * particle.sway },
        ],
      };
    }
    // sparkle
    return {
      opacity: progress.value,
      transform: [
        { translateY: -progress.value * 30 },
        { scale: 0.6 + progress.value * 0.8 },
      ],
    };
  });

  // Sparkle — glyph text
  if (particle.kind === 'sparkle') {
    return (
      <Animated.Text style={[styles.glyph, animatedStyle, { left: `${particle.left}%`, top: `${particle.top}%`, fontSize: particle.size }]}>
        {particle.glyph}
      </Animated.Text>
    );
  }

  // Rain — falling dot/square positioned by column
  if (particle.kind === 'rain') {
    return (
      <Animated.View
        style={[
          styles.rainDot,
          animatedStyle,
          { left: `${particle.left}%`, width: particle.size, height: particle.size, backgroundColor: particle.color, borderRadius: particle.round ? particle.size / 2 : 2 },
        ]}
      />
    );
  }

  // Rise — bubble floating up from the bottom edge
  if (particle.kind === 'rise') {
    return (
      <Animated.View
        style={[
          styles.riseDot,
          animatedStyle,
          { left: `${particle.left}%`, width: particle.size, height: particle.size, backgroundColor: particle.color, borderRadius: particle.size / 2 },
        ]}
      />
    );
  }

  // Burst — dot flying out from center
  return (
    <Animated.View
      style={[
        styles.burstDot,
        animatedStyle,
        { width: particle.size, height: particle.size, backgroundColor: particle.color, borderRadius: particle.size / 2 },
      ]}
    />
  );
}

// Main component
const CelebrationFx = React.memo(({ variant }: Props) => {
  // Stores
  const theme = useThemeStore((state) => state.theme);

  // Pick a variant + build its particles once on mount
  const [fx] = useState(() => {
    const picked = variant ?? VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
    const colors = [theme.gold, theme.islamicGreen, theme.accent, theme.text2];
    return { variant: picked, particles: buildParticles(picked, colors) };
  });

  return (
    <View
      style={[StyleSheet.absoluteFill, fx.variant === 'burst' && styles.centered]}
      pointerEvents="none"
    >
      {fx.particles.map((particle) => (
        <ParticleView key={particle.key} particle={particle} />
      ))}
    </View>
  );
});

export default CelebrationFx;

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rainDot: {
    position: 'absolute',
    top: 0,
  },
  riseDot: {
    position: 'absolute',
    bottom: 0,
  },
  burstDot: {
    position: 'absolute',
  },
  glyph: {
    position: 'absolute',
  },
});
