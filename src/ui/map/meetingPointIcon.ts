/** Logical size (CSS px) of the meeting point marker; drawn at 2× for sharp screens. */
const SIZE = 34;
const PIXEL_RATIO = 2;

/**
 * Meeting point marker: a filled disc with a light ring and a walking person, so the point is
 * recognizable by its shape and pictogram, not only by its color. Returns null when the
 * browser cannot draw on a canvas (the map then simply omits the marker image).
 */
export function meetingPointIcon(
  fill: string,
  ring: string,
): { image: ImageData; pixelRatio: number } | null {
  const px = SIZE * PIXEL_RATIO;
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO);

  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = ring;
  ctx.stroke();

  // Walking person (same drawing as WalkIcon, 24-unit box), centered and scaled.
  ctx.save();
  ctx.translate(SIZE / 2 - 10.5, SIZE / 2 - 11);
  ctx.scale(0.9, 0.9);
  ctx.strokeStyle = ring;
  ctx.fillStyle = ring;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.arc(13, 4, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke(new Path2D('m9 21 2.5-6 2.5 2v4M7 11l3-3.5 3.5-.5 2 3.5 2.5 1M13.5 7 11.5 15'));
  ctx.restore();

  return { image: ctx.getImageData(0, 0, px, px), pixelRatio: PIXEL_RATIO };
}

/** Logical size (CSS px) of the navigation arrow drawn on the user's position. */
const ARROW_SIZE = 40;

/**
 * Navigation marker: a disc with a light ring and an arrow pointing up (north); the map rotates
 * it to the direction the user should walk. Null when the browser cannot draw on a canvas.
 */
export function navigationArrowIcon(
  fill: string,
  ring: string,
): { image: ImageData; pixelRatio: number } | null {
  const px = ARROW_SIZE * PIXEL_RATIO;
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
  const c = ARROW_SIZE / 2;
  ctx.beginPath();
  ctx.arc(c, c, c - 2, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = ring;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(c, 7);
  ctx.lineTo(c + 10, c + 10);
  ctx.lineTo(c, c + 4);
  ctx.lineTo(c - 10, c + 10);
  ctx.closePath();
  ctx.fillStyle = ring;
  ctx.fill();
  return { image: ctx.getImageData(0, 0, px, px), pixelRatio: PIXEL_RATIO };
}
