import React, { createContext, useContext, useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated, Easing } from 'react-native';

interface ShimmerContextValue {
  anim: Animated.Value;
}

const ShimmerContext = createContext<ShimmerContextValue | null>(null);

export const ShimmerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, [anim]);

  return (
    <ShimmerContext.Provider value={{ anim }}>
      {children}
    </ShimmerContext.Provider>
  );
};

interface ShimmerSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const BAND_WIDTH = 180;

export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({
  width = '100%',
  height = 14,
  borderRadius = 6,
  style,
}) => {
  const ctx = useContext(ShimmerContext);

  if (!ctx) {
    return (
      <View
        style={[
          styles.container,
          { width: width as any, height, borderRadius },
          styles.fallback,
          style,
        ]}
      />
    );
  }

  const translateX = ctx.anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-BAND_WIDTH - 100, 400],
  });

  return (
    <View
      style={[
        styles.container,
        { width: width as any, height, borderRadius },
        style,
      ]}
    >
      <View style={[styles.base, { borderRadius }]} />
      <Animated.View
        style={[
          styles.shineWrap,
          { borderRadius },
          { transform: [{ translateX }, { rotate: '25deg' }] },
        ]}
      >
        <View style={styles.shineBand} />
      </Animated.View>
    </View>
  );
};

interface SkeletonBlockProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  width = '100%',
  height = 14,
  borderRadius = 6,
  style,
}) => {
  return (
    <View style={[{ width: width as any, height, borderRadius }, styles.baseBlock, style]} />
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#EDEBE5',
    position: 'relative',
  },
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E0DDD5',
  },
  shineWrap: {
    position: 'absolute',
    top: -80,
    bottom: -80,
    left: 0,
    width: BAND_WIDTH,
    alignItems: 'center',
  },
  shineBand: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  fallback: {
    backgroundColor: '#EDEBE5',
  },
  baseBlock: {
    backgroundColor: '#EDEBE5',
  },
});
