import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Animated, LayoutChangeEvent } from 'react-native';

interface DraggableCrosshairProps {
  initialX?: number;
  initialY?: number;
  onDragEnd?: (coords: { x: number; y: number }) => void;
}

export default function DraggableCrosshair({
  initialX = 100,
  initialY = 100,
  onDragEnd,
}: DraggableCrosshairProps) {
  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [lastPosition, setLastPosition] = useState({ x: initialX, y: initialY });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: lastPosition.x, y: lastPosition.y });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        pan.stopAnimation((value) => {
          setLastPosition(value);
          onDragEnd?.(value);
        });
      },
    })
  ).current;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.crosshair, {
        transform: pan.getTranslateTransform(),
      }]}
      onLayout={handleLayout}
    >
      <View style={styles.circle}>
        <View style={styles.vertical} />
        <View style={styles.horizontal} />
      </View>
    </Animated.View>
  );
}

const SIZE = 40;
const LINE_WIDTH = 2;

const styles = StyleSheet.create({
  crosshair: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  vertical: {
    position: 'absolute',
    width: LINE_WIDTH,
    height: SIZE,
    backgroundColor: 'white',
    left: SIZE / 2 - LINE_WIDTH / 2,
    top: 0,
  },
  horizontal: {
    position: 'absolute',
    height: LINE_WIDTH,
    width: SIZE,
    backgroundColor: 'white',
    top: SIZE / 2 - LINE_WIDTH / 2,
    left: 0,
  },
});
