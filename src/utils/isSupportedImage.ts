export const isSupportedImage = (pathname: string) => {
  const filename = pathname.split("?")[0];

  return (
    filename.endsWith(".jpg") ||
    filename.endsWith(".jpeg") ||
    filename.endsWith(".png") ||
    filename.endsWith(".gif") ||
    filename.endsWith(".webp")
  );
};
