import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';

// Get device screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

//account for status bar
const TOP_INSET = (StatusBar.currentHeight || 0) + 56;
//height of your bottom
const BOTTOM_INSET = 275;

// Generic clamp function to restrict a value between min and max
const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

// custom Y‐clamp that respects our insets
const clampY = (rawY: number) =>
  Math.max(
    TOP_INSET,
    Math.min(rawY, screenHeight - MARKER_SIZE - BOTTOM_INSET)
  );

  // Size constants for the draggable marker and the hover peek
const MARKER_SIZE = 40;
const HOVER_SIZE = 60;
const HOVER_RADIUS = HOVER_SIZE / 2;

export default function DraggableCrosshair({
  initialX = 100,
  initialY = 100,
  onDragEnd,
  capturedUri,
}: {
  initialX?: number;
  initialY?: number;
  onDragEnd?: (coords: { x: number; y: number }) => void;
  capturedUri?: string | null;
}) {
   // Animated value to track marker translation
  const translate = useRef(new Animated.ValueXY()).current;
   // Keep track of the last stable position after drag end
  const lastOffset = useRef({ x: initialX, y: initialY });

  // State flags
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: initialX, y: initialY });

  // Reset animated values if initial props change
  useEffect(() => {
    translate.setValue({ x: 0, y: 0 });
    translate.setOffset({ x: initialX, y: initialY });
    lastOffset.current = { x: initialX, y: initialY };
    setDragPosition({ x: initialX, y: initialY });
  }, [initialX, initialY]);

   // PanResponder to handle touch & drag gestures
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        translate.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gs) => {
        const rawX = lastOffset.current.x + gs.dx;
        const rawY = lastOffset.current.y + gs.dy;

        const newX = clamp(rawX, 0, screenWidth - MARKER_SIZE);
        const newY = clampY(rawY);

        setDragPosition({ x: newX, y: newY });
        translate.setValue({ x: newX - lastOffset.current.x, y: newY - lastOffset.current.y });
      },

      onPanResponderRelease: (_, gs) => {
        const rawX = lastOffset.current.x + gs.dx;
        const rawY = lastOffset.current.y + gs.dy;

        const newX = clamp(rawX, 0, screenWidth - MARKER_SIZE);
        const newY = clampY(rawY);

        lastOffset.current = { x: newX, y: newY };
        translate.flattenOffset();
        translate.setOffset(lastOffset.current);
        translate.setValue({ x: 0, y: 0 });

        setIsDragging(false);
        onDragEnd?.(lastOffset.current);
      },
    })
  ).current;

  return (
    <>
      {/* your draggable marker */}
      <Animated.View
        {...pan.panHandlers}
        style={[styles.crosshair, { transform: translate.getTranslateTransform() }]}
      >
        <View style={styles.circle}>
          <View style={styles.lineVertical} />
          <View style={styles.lineHorizontal} />
        </View>
      </Animated.View>

      {/* peek-marker: only when dragging AND we have a capturedUri */}
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
          {/* show the exact pixels under the draggable */}
          <Image
            source={{ uri: capturedUri }}
            style={{
              width: screenWidth,
              height: screenHeight,
              transform: [
                { translateX: -dragPosition.x + HOVER_RADIUS - MARKER_SIZE / 2 },
                { translateY: -dragPosition.y + HOVER_RADIUS - MARKER_SIZE / 2 },
              ],
            }}
          />

          {/* crosshair overlay */}
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

  /* the peek-marker “above” */
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
