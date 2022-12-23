import path from "path";

export const PATH_CACHE_DIR = path.join(process.cwd(), ".cache");
export const PATH_CACHE_FILE = path.join(PATH_CACHE_DIR, "svelte-image");

export const PATH_CACHE_DOWNLOAD_FILES_DIR = path.join(
  PATH_CACHE_DIR,
  "download_files"
);
