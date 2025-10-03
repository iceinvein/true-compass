import React from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const { width: screenWidth } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(screenWidth * 0.8, 320);

interface CompassErrorProps {
  size?: number;
  error: string;
  onRetry?: () => void;
}

export function CompassError({ 
  size = COMPASS_SIZE, 
  error,
  onRetry 
}: CompassErrorProps) {
  const primaryColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const secondaryColor = useThemeColor({}, 'tabIconDefault');

  const getErrorInfo = (errorMessage: string) => {
    if (errorMessage.toLowerCase().includes('not available')) {
      return {
        icon: '🧭',
        title: 'Compass Not Available',
        description: 'This device doesn\'t have a magnetometer sensor required for compass functionality.',
        suggestions: [
          'Try using a different device with compass support',
          'Check if your device has a built-in compass app',
        ],
        showRetry: false,
      };
    } else if (errorMessage.toLowerCase().includes('permission')) {
      return {
        icon: '🔒',
        title: 'Permission Required',
        description: 'Compass needs access to device sensors to function properly.',
        suggestions: [
          'Grant sensor permissions in device settings',
          'Restart the app after granting permissions',
        ],
        showRetry: true,
      };
    } else {
      return {
        icon: '⚠️',
        title: 'Compass Error',
        description: 'Something went wrong while initializing the compass.',
        suggestions: [
          'Make sure your device isn\'t near magnetic interference',
          'Try restarting the app',
          'Check if other compass apps work on your device',
        ],
        showRetry: true,
      };
    }
  };

  const { icon, title, description, suggestions, showRetry } = getErrorInfo(error);

  const handleRetry = () => {
    if (onRetry) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onRetry();
    }
  };

  return (
    <ThemedView style={[styles.container, { width: size, height: size }]}>
      {/* Error icon */}
      <View style={styles.iconContainer}>
        <ThemedText style={styles.errorIcon}>{icon}</ThemedText>
      </View>

      {/* Error title */}
      <ThemedText style={[styles.errorTitle, { color: '#FF5252' }]}>
        {title}
      </ThemedText>

      {/* Error description */}
      <ThemedText style={[styles.errorDescription, { color: primaryColor }]}>
        {description}
      </ThemedText>

      {/* Technical error details */}
      <View style={[styles.technicalDetails, { backgroundColor: secondaryColor + '10' }]}>
        <ThemedText style={[styles.technicalText, { color: secondaryColor }]}>
          Technical details: {error}
        </ThemedText>
      </View>

      {/* Suggestions */}
      <View style={styles.suggestionsContainer}>
        <ThemedText style={[styles.suggestionsTitle, { color: primaryColor }]}>
          Suggestions:
        </ThemedText>
        {suggestions.map((suggestion, index) => (
          <View key={index} style={styles.suggestionItem}>
            <ThemedText style={[styles.suggestionBullet, { color: tintColor }]}>
              •
            </ThemedText>
            <ThemedText style={[styles.suggestionText, { color: primaryColor }]}>
              {suggestion}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Retry button */}
      {showRetry && onRetry && (
        <Pressable
          style={[styles.retryButton, { backgroundColor: tintColor }]}
          onPress={handleRetry}
        >
          <ThemedText style={[styles.retryButtonText, { color: backgroundColor }]}>
            Try Again
          </ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 64,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    opacity: 0.9,
  },
  technicalDetails: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  technicalText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  suggestionsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 8,
  },
  suggestionBullet: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  suggestionText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
