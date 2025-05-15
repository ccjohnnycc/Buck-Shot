import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';

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
  const translate = useRef(new Animated.ValueXY()).current;
  const lastOffset = useRef({ x: initialX, y: initialY });

  useEffect(() => {
    translate.setValue({ x: 0, y: 0 });
    translate.setOffset({ x: initialX, y: initialY });
    lastOffset.current = { x: initialX, y: initialY };
  }, [initialX, initialY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translate.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: translate.x, dy: translate.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        const newX = lastOffset.current.x + gestureState.dx;
        const newY = lastOffset.current.y + gestureState.dy;

        lastOffset.current = { x: newX, y: newY };
        translate.flattenOffset();
        translate.setOffset(lastOffset.current);
        translate.setValue({ x: 0, y: 0 });

        console.log('final drag:', lastOffset.current);
        onDragEnd?.(lastOffset.current);
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.crosshair,
        { transform: translate.getTranslateTransform() },
      ]}
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
  },
  vertical: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: 'white',
    left: '50%',
    marginLeft: -1,
  },
  horizontal: {
    position: 'absolute',
    height: 2,
    width: '100%',
    backgroundColor: 'white',
    top: '50%',
    marginTop: -1,
  },
});
