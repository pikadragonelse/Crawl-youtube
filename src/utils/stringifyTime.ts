export const convertToStringTime = (second: number) => {
  const minutes = Math.floor(second / 60);
  const seconds = second % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};
