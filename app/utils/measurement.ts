export type Point = { x: number; y: number };

//Calculate pixel distance between two tap points
export function calculatePixelDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

//Convert pixel distance to real-world inches using hybrid calibration
export function convertPixelsToInches(
  pixelDistance: number,
  userDistance: number,
  calibrationDistance: number,
  pixelsPerInch: number
): number {
  const adjustedPixelsPerInch = pixelsPerInch * (calibrationDistance / userDistance);
  return pixelDistance / adjustedPixelsPerInch;
}
