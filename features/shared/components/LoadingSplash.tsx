import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';

const LOADING_VIDEO = require('../../../assets/loading/kivquo-loading.mp4');
const LOADING_WEBP = require('../../../assets/loading/kivquo-loading.webp');
const LOADING_START = require('../../../assets/loading/kivquo-loading-start.png');
const LOADING_END = require('../../../assets/loading/kivquo-loading-end.png');

const BACKGROUND = '#FBF9F5';
const ANIMATION_DURATION_MS = 2917;
const MAX_VIDEO_RETRIES = 2;
const MAX_IMAGE_RETRIES = 2;
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Route replacement and Fast Refresh can remount a splash instance. Only the
// first animated instance in a JS launch may play; later instances hold the
// final frame rather than restarting.
let animationStateThisLaunch: 'idle' | 'playing' | 'completed' = 'idle';

interface LoadingVideoProps {
  opacity: Animated.Value;
  onError: (error: unknown) => void;
  onStarted: () => void;
  onFinished: () => void;
}

const LoadingVideo = React.memo(function LoadingVideo({ opacity, onError, onStarted, onFinished }: LoadingVideoProps) {
  const started = useRef(false);
  const finished = useRef(false);

  const player = useVideoPlayer(LOADING_VIDEO, (p) => {
    p.loop = false;
    p.muted = true;
  });

  useEffect(() => {
    const subscription = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'error') {
        onError(error);
        return;
      }
      if (status === 'readyToPlay' && !started.current) {
        started.current = true;
        player.play();
      }
    });
    const watchdog = setTimeout(() => {
      if (!started.current) onError(new Error('first-frame timeout'));
    }, 3500);
    // Stop just before the player can reset to its first frame. The parent
    // immediately swaps this layer for the extracted final-frame still.
    const endPoll = setInterval(() => {
      try {
        const d = player.duration;
        if (!finished.current && d > 0 && player.currentTime >= d - 0.04) {
          finished.current = true;
          player.pause();
          onFinished();
        }
      } catch {}
    }, 16);
    return () => {
      subscription.remove();
      clearTimeout(watchdog);
      clearInterval(endPoll);
    };
  }, [player, onError, onFinished]);

  const handleFirstFrame = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start(({ finished: didFinish }) => {
      if (didFinish) onStarted();
    });
  }, [opacity, onStarted]);

  return (
    <Animated.View style={[styles.videoLayer, { opacity }]} pointerEvents="none">
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        playsInline
        onFirstFrameRender={handleFirstFrame}
      />
    </Animated.View>
  );
});

interface LoadingWebpProps {
  onStarted: () => void;
  onFinished: () => void;
}

const LoadingWebp = React.memo(function LoadingWebp({ onStarted, onFinished }: LoadingWebpProps) {
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLoad = useCallback(() => {
    if (finishTimer.current) return;
    onStarted();
    // The final frame starts one frame before the encoded duration. Swap at
    // that point so an animated WebP cannot begin a second loop.
    finishTimer.current = setTimeout(onFinished, ANIMATION_DURATION_MS - 42);
  }, [onFinished, onStarted]);

  useEffect(() => {
    // Some Expo Go versions do not consistently emit onLoad for animated
    // WebP. This upper bound still prevents a visible second full loop.
    fallbackTimer.current = setTimeout(onFinished, ANIMATION_DURATION_MS + 300);
    return () => {
      if (finishTimer.current) clearTimeout(finishTimer.current);
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    };
  }, [onFinished]);

  return (
    <ExpoImage
      source={LOADING_WEBP}
      style={StyleSheet.absoluteFill}
      contentFit="contain"
      autoplay
      onLoad={handleLoad}
    />
  );
});

class VideoErrorBoundary extends React.Component<
  { onError: (error: unknown) => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

interface LoadingSplashProps {
  onReady?: () => void;
  onFinished?: () => void;
  staticOnly?: boolean;
}

export const LoadingSplash = React.memo(function LoadingSplash({ onReady, onFinished, staticOnly = false }: LoadingSplashProps) {
  const [videoAttempt, setVideoAttempt] = useState(0);
  const [imageAttempt, setImageAttempt] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const inheritedAnimation = useRef(animationStateThisLaunch !== 'idle').current;
  const [showEndFrame, setShowEndFrame] = useState(inheritedAnimation);
  const videoRetries = useRef(0);
  const imageRetries = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nativeSplashHidden = useRef(false);
  const finishedRef = useRef(false);
  const videoOpacity = useRef(new Animated.Value(0)).current;

  const handleFinished = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    animationStateThisLaunch = 'completed';
    setShowEndFrame(true);
    onFinished?.();
  }, [onFinished]);

  const handleAnimationStarted = useCallback(() => {
    animationStateThisLaunch = 'playing';
    setAnimationStarted(true);
  }, []);

  useEffect(() => {
    if (!staticOnly && inheritedAnimation) handleFinished();
  }, [handleFinished, inheritedAnimation, staticOnly]);

  const handleVideoError = useCallback((error: unknown) => {
    if (__DEV__) console.warn('[LoadingSplash] video failed, will retry');
    if (retryTimer.current) return;
    if (videoRetries.current >= MAX_VIDEO_RETRIES) return;
    videoRetries.current += 1;
    retryTimer.current = setTimeout(() => {
      retryTimer.current = null;
      videoOpacity.setValue(0);
      setVideoAttempt((attempt) => attempt + 1);
    }, 600 * videoRetries.current);
  }, [videoOpacity]);

  const handleImageError = useCallback(() => {
    if (__DEV__) console.warn('[LoadingSplash] static frame failed to load');
    setImageFailed(true);
    if (imageRetries.current >= MAX_IMAGE_RETRIES) return;
    imageRetries.current += 1;
    setTimeout(() => {
      setImageFailed(false);
      setImageAttempt((attempt) => attempt + 1);
    }, 600 * imageRetries.current);
  }, []);

  useEffect(() => {
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  const handleLayout = useCallback(() => {
    if (nativeSplashHidden.current) return;
    nativeSplashHidden.current = true;
    SplashScreen.hideAsync().catch(() => {});
    onReady?.();
  }, [onReady]);

  // Safety net: video errors/retries must never block the app open.
  useEffect(() => {
    if (staticOnly) return;
    const watchdog = setTimeout(handleFinished, 6000);
    return () => {
      clearTimeout(watchdog);
    };
  }, [handleFinished, staticOnly]);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {staticOnly ? (
        imageFailed ? (
          <Text style={styles.fallbackLogo}>KIVQUO</Text>
        ) : (
          <Image
            key={animationStateThisLaunch !== 'idle' ? 'static-end' : `static-start-${imageAttempt}`}
            source={animationStateThisLaunch !== 'idle' ? LOADING_END : LOADING_START}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
            onError={handleImageError}
            testID={animationStateThisLaunch !== 'idle' ? 'loading-splash-end' : 'loading-splash-start'}
          />
        )
      ) : (!animationStarted && !showEndFrame) && (
        imageFailed ? (
          <Text style={styles.fallbackLogo}>KIVQUO</Text>
        ) : (
          <Image
            key={`logo-${imageAttempt}`}
            source={LOADING_START}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
            onError={handleImageError}
            testID="loading-splash-start"
          />
        )
      )}
      {!staticOnly && !showEndFrame && (
        IS_EXPO_GO ? (
          <LoadingWebp onStarted={handleAnimationStarted} onFinished={handleFinished} />
        ) : (
          <VideoErrorBoundary key={`video-${videoAttempt}`} onError={handleVideoError}>
            <LoadingVideo
              opacity={videoOpacity}
              onError={handleVideoError}
              onStarted={handleAnimationStarted}
              onFinished={handleFinished}
            />
          </VideoErrorBoundary>
        )
      )}
      {/* Pre-mounted at opacity 0 so decoding cannot expose the opening frame
          during the end-of-video swap. */}
      {!staticOnly && (
        <Image
          source={LOADING_END}
          style={[StyleSheet.absoluteFill, { opacity: showEndFrame ? 1 : 0 }]}
          resizeMode="contain"
          pointerEvents="none"
          testID="loading-splash-end"
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  videoLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  fallbackLogo: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#171717',
  },
});
