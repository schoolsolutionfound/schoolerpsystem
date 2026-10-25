import React, { createContext, useContext, useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated, Easing } from 'react-native';

interface ShimmerContextValue {
  anim: Animated.Value;
}

const ShimmerContext = createContext<ShimmerContextValue | null>(null);

export const TeacherShimmerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <ShimmerContext.Provider value={{ anim }}>
      {children}
    </ShimmerContext.Provider>
  );
};

export interface TeacherShimmerSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const BAND_WIDTH = 220;

export const TeacherShimmerSkeleton: React.FC<TeacherShimmerSkeletonProps> = ({
  width = '100%',
  height = 14,
  borderRadius = 5,
  style,
}) => {
  const ctx = useContext(ShimmerContext);
  const fallbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ctx) {
      const loop = Animated.loop(
        Animated.timing(fallbackAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      );
      loop.start();
      return () => loop.stop();
    }
  }, [ctx, fallbackAnim]);

  const activeAnim = ctx ? ctx.anim : fallbackAnim;

  const translateX = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-BAND_WIDTH - 120, 500],
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

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#EDEBE5',
    position: 'relative',
  },
  base: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E8E5DC',
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
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
});
