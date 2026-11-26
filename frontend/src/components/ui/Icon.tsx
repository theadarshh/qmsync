import type { ReactElement } from "react";
import type { IconName } from "../../navigation/modules";

const SHAPES: Record<IconName, ReactElement> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  production: (
    <>
      <path d="M3 20h18" />
      <path d="M5 20V10l5 3v-3l5 3V6h4v14" />
    </>
  ),
  rejections: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </>
  ),
  ncmr: (
    <>
      <path d="M12 3l9.5 16.5h-19z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </>
  ),
  capa: (
    <>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </>
  ),
  training: (
    <>
      <path d="M3 8l9-4 9 4-9 4z" />
      <path d="M7 10.5V15c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" />
    </>
  ),
  evidence: (
    <>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
      <path d="M10 13h6M10 17h6" />
    </>
  ),
  audits: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4h6v3H9z" />
      <path d="M9 14l2 2 4-4" />
    </>
  ),
  reports: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7" />
      <path d="M2 20h20" />
    </>
  ),
  organization: (
    <>
      <path d="M4 21V5l8-2v18" />
      <path d="M12 9h8v12" />
      <path d="M7 9h2M7 13h2M7 17h2M15 13h2M15 17h2" />
    </>
  ),
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      className="icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {SHAPES[name]}
    </svg>
  );
}
