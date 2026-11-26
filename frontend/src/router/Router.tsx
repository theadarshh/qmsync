import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { isActivePath, normalizePath } from "./match";

// A deliberately small History-API router: the shell has static routes only. It sits behind this
// narrow interface (Router, Link, NavLink, useRoute) so it can be replaced by a full router later
// (for example when authenticated routes and route parameters arrive) without touching pages.

interface RouterState {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterState>({ path: "/", navigate: () => undefined });

export function Router({ children, initialPath }: { children: ReactNode; initialPath?: string }) {
  const [path, setPath] = useState<string>(() =>
    normalizePath(initialPath !== undefined ? initialPath : window.location.pathname),
  );

  useEffect(() => {
    const syncFromLocation = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

  const navigate = useCallback((to: string) => {
    const next = normalizePath(to);
    if (next !== normalizePath(window.location.pathname)) {
      window.history.pushState(null, "", next);
    }
    setPath(next);
  }, []);

  const value = useMemo<RouterState>(() => ({ path, navigate }), [path, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRoute(): RouterState {
  return useContext(RouterContext);
}

interface LinkProps {
  to: string;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  "aria-current"?: "page" | undefined;
}

export function Link({ to, className, children, onClick, "aria-current": ariaCurrent }: LinkProps) {
  const { navigate } = useRoute();
  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    onClick?.();
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (event.defaultPrevented || event.button !== 0 || modified) {
      return;
    }
    event.preventDefault();
    navigate(to);
  };
  return (
    <a className={className} href={to} onClick={handleClick} aria-current={ariaCurrent}>
      {children}
    </a>
  );
}

export function NavLink({ to, className, children, onClick }: Omit<LinkProps, "aria-current">) {
  const { path } = useRoute();
  const active = isActivePath(path, to);
  const classes = active ? `${className ?? ""} is-active`.trim() : className;
  return (
    <Link to={to} className={classes} onClick={onClick} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
