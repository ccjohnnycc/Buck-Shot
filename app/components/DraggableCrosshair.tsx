import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  Image,
} from 'react-native';

// Generic clamp function
const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

// Size constants
const MARKER_SIZE = 40;
const HOVER_SIZE = 60;
const HOVER_RADIUS = HOVER_SIZE / 2;

type Props = {
  parentWidth: number;
  parentHeight: number;
  // Y‐coordinate of the top wall 
  clampTop: number;    
  // Y‐coordinate of the bottom wall 
  clampBottom: number;  
  initialX?: number;
  initialY?: number;
  onDragEnd?: (coords: { x: number; y: number }) => void;
  capturedUri?: string | null;
};

export default function DraggableCrosshair({
  parentWidth,
  parentHeight,
  clampTop,
  clampBottom,
  initialX = 0,
  initialY = 0,
  onDragEnd,
  capturedUri,
}: Props) {
  // We initialize an Animated.ValueXY at (initialX, initialY)
  const position = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const lastPosition = useRef({ x: initialX, y: initialY });

  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: initialX, y: initialY });

  // Reset if initialX / initialY changes
  useEffect(() => {
    position.setValue({ x: initialX, y: initialY });
    lastPosition.current = { x: initialX, y: initialY };
    setDragPosition({ x: initialX, y: initialY });
  }, [initialX, initialY]);

  // Clamp a rawY between clampTop and (clampBottom - MARKER_SIZE)
  const clampY = (rawY: number) =>
    clamp(rawY, clampTop, clampBottom - MARKER_SIZE);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_, gesture) => {
        const rawX = lastPosition.current.x + gesture.dx;
        const rawY = lastPosition.current.y + gesture.dy;

        const newX = clamp(rawX, 0, parentWidth - MARKER_SIZE);
        const newY = clampY(rawY);

        setDragPosition({ x: newX, y: newY });
        position.setValue({ x: newX, y: newY });
      },
      onPanResponderRelease: (_, gesture) => {
        const rawX = lastPosition.current.x + gesture.dx;
        const rawY = lastPosition.current.y + gesture.dy;

        const newX = clamp(rawX, 0, parentWidth - MARKER_SIZE);
        const newY = clampY(rawY);

        lastPosition.current = { x: newX, y: newY };
        setIsDragging(false);
        position.setValue({ x: newX, y: newY });

        onDragEnd?.({ x: newX, y: newY });
      },
    })
  ).current;

  return (
    <>
      {/* 1) The draggable marker */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.crosshair,
          {
            transform: position.getTranslateTransform(),
          },
        ]}
      >
        <View style={styles.circle}>
          <View style={styles.lineVertical} />
          <View style={styles.lineHorizontal} />
        </View>
      </Animated.View>

      {/* 2) Magnifier “peek” above the crosshair */}
      {isDragging && capturedUri != null && (
        <View
          style={[
            styles.peekContainer,
            {
              left: dragPosition.x - (HOVER_SIZE - MARKER_SIZE) / 2,
              top: dragPosition.y - HOVER_SIZE - 10,
            },
          ]}
        >
          <Image
            source={{ uri: capturedUri }}
            style={{
              width: parentWidth,
              height: parentHeight,
              transform: [
                {
                  translateX: -dragPosition.x + HOVER_RADIUS - MARKER_SIZE / 2,
                },
                {
                  translateY: -dragPosition.y + HOVER_RADIUS - MARKER_SIZE / 2,
                },
              ],
            }}
          />
          <View style={styles.peekOverlay}>
            <View style={styles.lineVertical} />
            <View style={styles.lineHorizontal} />
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  crosshair: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 2,
    borderColor: 'white',
  },
  lineVertical: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: 'white',
    left: '50%',
    marginLeft: -1,
  },
  lineHorizontal: {
    position: 'absolute',
    height: 2,
    width: '100%',
    backgroundColor: 'white',
    top: '50%',
    marginTop: -1,
  },
  peekContainer: {
    position: 'absolute',
    width: HOVER_SIZE,
    height: HOVER_SIZE,
    borderRadius: HOVER_RADIUS,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'black',
    zIndex: 100,
  },
  peekOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
