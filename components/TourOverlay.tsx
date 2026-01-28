import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

export type TourTarget = string | null;
export type TourMode = 'modal' | 'coach';

export type TourStep = {
  title: string;
  description: string;
  target: TourTarget;
  mode: TourMode;
  showBack?: boolean;
  showPrimary?: boolean;
  primaryLabel?: string;
};

type MeasuredRect = { x: number; y: number; width: number; height: number } | null;

interface TourOverlayProps {
  open: boolean;
  step: TourStep | null;
  stepIndex: number;
  stepsCount: number;
  rect: MeasuredRect;
  isDark: boolean;
  accentColor: string;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onDone: () => void;
  measureTarget: (target: TourTarget) => Promise<MeasuredRect>;
}

function SpotlightMask({ rect, blockInteraction }: { rect: MeasuredRect; blockInteraction: boolean }) {
  const { width, height } = useWindowDimensions();
  const opacity = useSharedValue(0);
  const spotlightScale = useSharedValue(0.8);
  const spotlightOpacity = useSharedValue(0);

  useEffect(() => {
    if (rect) {
      opacity.value = withTiming(1, { duration: 300 });
      spotlightScale.value = withSpring(1, { damping: 20, stiffness: 300 });
      spotlightOpacity.value = withTiming(1, { duration: 200 });
    } else {
      opacity.value = withTiming(0.7, { duration: 300 });
      spotlightScale.value = withSpring(0.8, { damping: 20, stiffness: 300 });
      spotlightOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [opacity, rect, spotlightOpacity, spotlightScale]);

  const maskStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const padding = 12;
  const safeX = Math.max(0, (rect?.x ?? 0) - padding);
  const safeY = Math.max(0, (rect?.y ?? 0) - padding);
  const safeW = Math.min(width - safeX, (rect?.width ?? 0) + padding * 2);
  const safeH = Math.min(height - safeY, (rect?.height ?? 0) + padding * 2);
  const centerX = safeX + safeW / 2;
  const centerY = safeY + safeH / 2;

  const spotlightStyle = useAnimatedStyle(() => {
    const scale = spotlightScale.value;
    const opacity = spotlightOpacity.value;
    
    return {
      position: 'absolute',
      left: safeX,
      top: safeY,
      width: safeW,
      height: safeH,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: `rgba(255,255,255,${opacity * 0.8})`,
      shadowColor: '#FFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: opacity * 0.4,
      shadowRadius: 20,
      transform: [
        { scale: interpolate(scale, [0.8, 1], [0.9, 1], Extrapolate.CLAMP) },
        { translateX: interpolate(scale, [0.8, 1], [centerX, centerX], Extrapolate.CLAMP) - centerX },
        { translateY: interpolate(scale, [0.8, 1], [centerY, centerY], Extrapolate.CLAMP) - centerY },
      ],
    };
  });

  if (!rect) {
    return (
      <View
        pointerEvents={blockInteraction ? 'auto' : 'none'}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: blockInteraction ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)' },
        ]}
      />
    );
  }

  const maskColor = blockInteraction ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.35)';
  const pointerEvents = blockInteraction ? 'auto' : 'none';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, maskStyle]}>
        {/* Top */}
        <View 
          pointerEvents={pointerEvents} 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width, 
            height: safeY, 
            backgroundColor: maskColor 
          }} 
        />
        {/* Bottom */}
        <View 
          pointerEvents={pointerEvents} 
          style={{ 
            position: 'absolute', 
            top: safeY + safeH, 
            left: 0, 
            width, 
            height: height - (safeY + safeH), 
            backgroundColor: maskColor 
          }} 
        />
        {/* Left */}
        <View 
          pointerEvents={pointerEvents} 
          style={{ 
            position: 'absolute', 
            top: safeY, 
            left: 0, 
            width: safeX, 
            height: safeH, 
            backgroundColor: maskColor 
          }} 
        />
        {/* Right */}
        <View 
          pointerEvents={pointerEvents} 
          style={{ 
            position: 'absolute', 
            top: safeY, 
            left: safeX + safeW, 
            right: 0, 
            height: safeH, 
            backgroundColor: maskColor 
          }} 
        />
        
        {/* Blocker for the hole if interaction is blocked */}
        {blockInteraction && (
          <View
            pointerEvents="auto"
            style={{
              position: 'absolute',
              top: safeY,
              left: safeX,
              width: safeW,
              height: safeH,
            }}
          />
        )}

        {/* Animated spotlight border */}
        <Animated.View style={spotlightStyle} />
      </Animated.View>
    </View>
  );
}

export default function TourOverlay({
  open,
  step,
  stepIndex,
  stepsCount,
  rect,
  isDark,
  accentColor,
  onBack,
  onNext,
  onSkip,
  onDone,
  measureTarget,
}: TourOverlayProps) {
  const { width: viewportW, height: viewportH } = useWindowDimensions();
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipOpacity = useSharedValue(0);
  const tooltipScale = useSharedValue(0.8);

  const isLast = stepIndex >= stepsCount - 1;
  const showBack = step?.showBack ?? false;
  const showPrimary = step?.showPrimary ?? true;
  const primaryLabel = step?.primaryLabel ?? (isLast ? 'Continue' : 'Next');

  useEffect(() => {
    if (!open || !step) {
      tooltipOpacity.value = withTiming(0, { duration: 200 });
      return;
    }

    // Calculate tooltip position
    const tooltipW = Math.min(360, viewportW - 32);
    const tooltipH = 190;

    let targetX = viewportW / 2 - tooltipW / 2;
    let targetY = viewportH / 2 - tooltipH / 2;

    if (rect) {
      const preferTop = rect.y > viewportH * 0.6;
      targetX = rect.x + rect.width / 2 - tooltipW / 2;
      targetY = preferTop
        ? rect.y - tooltipH - 24
        : rect.y + rect.height + 24;
    }

    // Clamp to screen bounds
    const clampedX = Math.max(16, Math.min(targetX, viewportW - tooltipW - 16));
    const clampedY = Math.max(16, Math.min(targetY, viewportH - tooltipH - 16));

    setTooltipPosition({ x: clampedX, y: clampedY });

    // Animate tooltip appearance
    tooltipOpacity.value = withTiming(1, { duration: 300 });
    tooltipScale.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, [open, rect, step, tooltipOpacity, tooltipScale, viewportH, viewportW]);

  const tooltipStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: tooltipPosition.x,
    top: tooltipPosition.y,
    width: Math.min(360, viewportW - 32),
    borderRadius: 18,
    padding: 16,
    backgroundColor: isDark ? 'rgba(10,10,28,0.96)' : 'rgba(255,255,255,0.97)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
    opacity: tooltipOpacity.value,
    transform: [
      { scale: tooltipScale.value },
    ],
  }));

  if (!open || !step) return null;

  const blockInteraction = step.mode === 'modal';

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onSkip}>
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <SpotlightMask rect={rect} blockInteraction={blockInteraction} />

        <Animated.View style={tooltipStyle}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <Text style={{ fontFamily: 'Geist-Bold', fontSize: 15, color: isDark ? '#FFFFFF' : '#111111' }}>
              {step.title}
            </Text>
            {stepsCount > 0 ? (
              <Text style={{ fontFamily: 'Geist-Regular', fontSize: 12, color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(17,17,17,0.55)' }}>
                {Math.min(stepIndex + 1, stepsCount)}/{stepsCount}
              </Text>
            ) : null}
          </View>

          <Text style={{ marginTop: 8, fontFamily: 'Geist-Regular', fontSize: 13, lineHeight: 18, color: isDark ? 'rgba(255,255,255,0.78)' : 'rgba(17,17,17,0.78)' }}>
            {step.description}
          </Text>

          <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <Pressable
              onPress={onSkip}
              accessibilityRole="button"
              accessibilityLabel="Skip tutorial"
              style={({ pressed }) => ({
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(17,17,17,0.16)',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontFamily: 'Geist-Regular', fontSize: 13, color: isDark ? '#FFFFFF' : '#111111' }}>
                Skip
              </Text>
            </Pressable>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {showBack ? (
                <Pressable
                  onPress={onBack}
                  disabled={stepIndex <= 0}
                  accessibilityRole="button"
                  accessibilityLabel="Previous step"
                  style={({ pressed }) => ({
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(17,17,17,0.16)',
                    opacity: stepIndex <= 0 ? 0.5 : pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ fontFamily: 'Geist-Regular', fontSize: 13, color: isDark ? '#FFFFFF' : '#111111' }}>
                    Back
                  </Text>
                </Pressable>
              ) : null}

              {showPrimary ? (
                <Pressable
                  onPress={isLast ? onDone : onNext}
                  accessibilityRole="button"
                  accessibilityLabel={isLast ? 'Finish tutorial' : 'Next step'}
                  style={({ pressed }) => ({
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    backgroundColor: accentColor,
                    borderWidth: 1,
                    borderColor: accentColor,
                    opacity: pressed ? 0.88 : 1,
                  })}
                >
                  <Text style={{ fontFamily: 'Geist-Bold', fontSize: 13, color: '#FFFFFF' }}>
                    {primaryLabel}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
