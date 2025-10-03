import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const { width: screenWidth } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(screenWidth * 0.8, 320);

interface LoadingCompassProps {
  size?: number;
  message?: string;
}

export function LoadingCompass({ 
  size = COMPASS_SIZE, 
  message = 'Initializing compass...' 
}: LoadingCompassProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  
  const primaryColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const secondaryColor = useThemeColor({}, 'tabIconDefault');

  useEffect(() => {
    // Smooth rotation animation
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Gentle pulsing animation
    scale.value = withRepeat(
      withTiming(1.1, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [rotation, scale]);

  const compassAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <ThemedView style={[styles.container, { width: size, height: size }]}>
      {/* Loading message */}
      <View style={styles.messageContainer}>
        <ThemedText style={[styles.loadingText, { color: primaryColor }]}>
          {message}
        </ThemedText>
      </View>

      {/* Animated compass skeleton */}
      <View style={[styles.compassContainer, { width: size * 0.8, height: size * 0.8 }]}>
        {/* Outer ring */}
        <View style={[styles.outerRing, { 
          width: size * 0.8, 
          height: size * 0.8,
          borderColor: secondaryColor + '40',
        }]} />

        {/* Rotating elements */}
        <Animated.View style={[styles.compassFace, compassAnimatedStyle]}>
          {/* Cardinal direction dots */}
          {[0, 90, 180, 270].map((angle, index) => (
            <View
              key={`cardinal-${angle}`}
              style={[
                styles.cardinalDot,
                {
                  backgroundColor: index === 0 ? tintColor : secondaryColor + '60',
                  transform: [
                    { rotate: `${angle}deg` },
                    { translateY: -size * 0.3 },
                  ],
                },
              ]}
            />
          ))}

          {/* Center loading indicator */}
          <View style={[styles.centerIndicator, { backgroundColor: tintColor + '80' }]} />
        </Animated.View>
      </View>

      {/* Loading dots */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <LoadingDot key={index} delay={index * 200} color={tintColor} />
        ))}
      </View>
    </ThemedView>
  );
}

interface LoadingDotProps {
  delay: number;
  color: string;
}

function LoadingDot({ delay, color }: LoadingDotProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const startAnimation = () => {
      opacity.value = withRepeat(
        withTiming(1, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    };

    const timer = setTimeout(startAnimation, delay);
    return () => clearTimeout(timer);
  }, [delay, opacity]);

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.loadingDot,
        { backgroundColor: color },
        dotAnimatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  messageContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  compassContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  outerRing: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  compassFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardinalDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  centerIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
