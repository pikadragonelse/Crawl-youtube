export const getNextPosition = (
  currentX: number,
  currentY: number,
  screenX: number,
  screenY: number,
) => {
  let screenWidthMin = 500;
  let screenHeightMin = 500;
  let stepX = 300;
  let stepY = 300;
  currentX += stepX;

  if (currentX > screenX - screenWidthMin) {
    currentX = 0;
    currentY += stepY;
  } else {
    currentX += stepX;
  }
  if (currentY > screenY - screenHeightMin) {
    currentY = 0;
    // currentX += stepX;
  }

  return [currentX, currentY];
};
