export const getAbsoluteImagePath = (path: string) =>
  path.replace(process.cwd(), "").replace("/static", "");
