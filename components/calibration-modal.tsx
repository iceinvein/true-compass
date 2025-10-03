import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const { width: screenWidth } = Dimensions.get('window');

interface CalibrationModalProps {
  visible: boolean;
  onClose: () => void;
  accuracy: number;
}

export function CalibrationModal({ visible, onClose, accuracy }: CalibrationModalProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const hasShownHaptic = useRef(false);
  
  const primaryColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const cardBackgroundColor = useThemeColor({}, 'cardBackground');

  // Start phone rotation animation
  useEffect(() => {
    if (visible) {
      hasShownHaptic.current = false;
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 3000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
      
      scale.value = withRepeat(
        withTiming(1.1, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      rotation.value = 0;
      scale.value = 1;
    }
  }, [visible, rotation, scale]);

  // Provide haptic feedback when calibration improves
  useEffect(() => {
    if (visible && accuracy > 70 && !hasShownHaptic.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      hasShownHaptic.current = true;
    }
  }, [accuracy, visible]);

  const phoneAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const getCalibrationMessage = () => {
    if (accuracy < 30) {
      return {
        title: 'Compass Needs Calibration',
        message: 'Move your device in a figure-8 pattern to calibrate the compass.',
        color: '#FF5252',
      };
    } else if (accuracy < 60) {
      return {
        title: 'Keep Calibrating',
        message: 'Continue moving your device in a figure-8 pattern.',
        color: '#FF9800',
      };
    } else if (accuracy < 80) {
      return {
        title: 'Almost There!',
        message: 'A few more figure-8 movements should do it.',
        color: '#FFC107',
      };
    } else {
      return {
        title: 'Well Calibrated!',
        message: 'Your compass is now ready for accurate readings.',
        color: '#4CAF50',
      };
    }
  };

  const { title, message, color } = getCalibrationMessage();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={[styles.modal, { backgroundColor: cardBackgroundColor }]}>
          {/* Close button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <ThemedText style={[styles.closeButtonText, { color: primaryColor }]}>
              ✕
            </ThemedText>
          </Pressable>

          {/* Title */}
          <ThemedText style={[styles.title, { color }]}>
            {title}
          </ThemedText>

          {/* Phone animation */}
          <View style={styles.animationContainer}>
            <Animated.View style={[styles.phone, phoneAnimatedStyle]}>
              <View style={[styles.phoneBody, { backgroundColor: primaryColor }]}>
                <View style={[styles.phoneScreen, { backgroundColor }]} />
                <View style={[styles.phoneButton, { backgroundColor }]} />
              </View>
            </Animated.View>
            
            {/* Figure-8 path indicator */}
            <View style={styles.pathContainer}>
              <View style={[styles.pathLine, { borderColor: tintColor }]} />
            </View>
          </View>

          {/* Instructions */}
          <ThemedText style={[styles.message, { color: primaryColor }]}>
            {message}
          </ThemedText>

          {/* Accuracy progress */}
          <View style={styles.progressContainer}>
            <ThemedText style={[styles.progressLabel, { color: primaryColor }]}>
              Accuracy: {Math.round(accuracy)}%
            </ThemedText>
            <View style={[styles.progressBar, { backgroundColor: primaryColor + '20' }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(accuracy, 100)}%`,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
          </View>

          {/* Action button */}
          <Pressable
            style={[styles.actionButton, { backgroundColor: tintColor }]}
            onPress={onClose}
          >
            <ThemedText style={[styles.actionButtonText, { color: backgroundColor }]}>
              {accuracy > 70 ? 'Done' : 'Continue Calibrating'}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: Math.min(screenWidth - 40, 350),
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 16,
  },
  animationContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  phone: {
    width: 60,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneBody: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneScreen: {
    width: '90%',
    height: '75%',
    borderRadius: 6,
  },
  phoneButton: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  pathContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathLine: {
    width: 80,
    height: 40,
    borderWidth: 2,
    borderRadius: 20,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  actionButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
