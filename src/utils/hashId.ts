import crypto from "crypto";

export const hashID = (id: string): string =>
  crypto.createHash("sha256").update(id).digest("base64url");
