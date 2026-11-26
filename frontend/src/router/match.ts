/** Strips query, hash and trailing slashes so "/ncmr/" and "/ncmr?x=1" both become "/ncmr". */
export function normalizePath(path: string): string {
  const withoutSuffix = path.split(/[?#]/)[0] ?? "";
  const trimmed = withoutSuffix.replace(/\/+$/, "");
  if (trimmed === "") {
    return "/";
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/** The dashboard ("/") is active only on an exact match; other targets also match their sub-paths. */
export function isActivePath(current: string, target: string): boolean {
  const currentPath = normalizePath(current);
  const targetPath = normalizePath(target);
  if (targetPath === "/") {
    return currentPath === "/";
  }
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}
