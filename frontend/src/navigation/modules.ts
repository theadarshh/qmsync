import { normalizePath } from "../router/match";

export type IconName =
  | "dashboard"
  | "production"
  | "rejections"
  | "ncmr"
  | "capa"
  | "training"
  | "evidence"
  | "audits"
  | "reports"
  | "organization";

export type NavGroupId = "workflow" | "insights" | "administration";

export interface NavGroup {
  readonly id: NavGroupId;
  readonly label: string;
}

/** A planned product module. Nothing here is implemented yet; this registry drives navigation only. */
export interface QmsModule {
  readonly id: string;
  readonly path: string;
  readonly label: string;
  /** Letter of the module in the product plan (Module A, the application shell, is this milestone). */
  readonly moduleCode: string;
  readonly moduleName: string;
  readonly group: NavGroupId;
  readonly icon: IconName;
  readonly summary: string;
  readonly capabilities: readonly string[];
}

export const DASHBOARD_PATH = "/";

export const NAV_GROUPS: readonly NavGroup[] = [
  { id: "workflow", label: "Quality workflow" },
  { id: "insights", label: "Insights" },
  { id: "administration", label: "Administration" },
];

export const MODULES: readonly QmsModule[] = [
  {
    id: "production",
    path: "/production",
    label: "Production Entry",
    moduleCode: "C",
    moduleName: "Production Entry",
    group: "workflow",
    icon: "production",
    summary: "Record what was produced, on which line and shift, and keep every production record traceable.",
    capabilities: [
      "Production records with date and shift",
      "Production line and machine",
      "Product and batch information",
      "Quantity produced",
      "Operator and supervisor",
      "Production status",
      "Traceable production records",
    ],
  },
  {
    id: "rejections",
    path: "/rejections",
    label: "Rejections",
    moduleCode: "D",
    moduleName: "Rejection Management",
    group: "workflow",
    icon: "rejections",
    summary: "Record rejected quantities against production batches, classify the defect and review the disposition.",
    capabilities: [
      "Rejected quantity",
      "Rejection reason and category",
      "Defect classification",
      "Batch and production linkage",
      "Rejection review and disposition",
      "Supporting evidence",
    ],
  },
  {
    id: "ncmr",
    path: "/ncmr",
    label: "NCMR",
    moduleCode: "E",
    moduleName: "Non-Conformance Management (NCMR)",
    group: "workflow",
    icon: "ncmr",
    summary: "Open and manage non-conformance records linked to production and rejection data.",
    capabilities: [
      "Unique NCMR reference",
      "Linked production and rejection records",
      "Root cause investigation",
      "Severity and priority",
      "Containment actions",
      "Ownership and due dates",
      "Closure workflow",
    ],
  },
  {
    id: "capa",
    path: "/capa",
    label: "CAPA",
    moduleCode: "F",
    moduleName: "Corrective and Preventive Action (CAPA)",
    group: "workflow",
    icon: "capa",
    summary: "Plan, assign and verify corrective and preventive actions that address root causes.",
    capabilities: [
      "Corrective action",
      "Preventive action",
      "Root cause analysis",
      "Action assignment",
      "Due dates",
      "Effectiveness verification",
      "Approval and closure",
    ],
  },
  {
    id: "training",
    path: "/training",
    label: "Training",
    moduleCode: "G",
    moduleName: "Training",
    group: "workflow",
    icon: "training",
    summary: "Assign training, track completion and verify competency, with evidence of completion.",
    capabilities: [
      "Training programs",
      "Training materials",
      "Employee assignments",
      "Completion tracking",
      "Competency verification",
      "Evidence of completion",
    ],
  },
  {
    id: "evidence",
    path: "/evidence",
    label: "Evidence",
    moduleCode: "H",
    moduleName: "Evidence Management",
    group: "workflow",
    icon: "evidence",
    summary: "Attach, describe and trace evidence against the records it supports.",
    capabilities: [
      "Evidence attachments",
      "Evidence metadata",
      "Record linkage",
      "Versioning where appropriate",
      "Access control",
      "Evidence traceability",
    ],
  },
  {
    id: "audits",
    path: "/audits",
    label: "Audit Center",
    moduleCode: "I",
    moduleName: "Audit Center",
    group: "workflow",
    icon: "audits",
    summary: "Plan audits, record findings and link them to NCMR and CAPA records and their evidence.",
    capabilities: [
      "Audit planning",
      "Audit records",
      "Checklist management",
      "Findings",
      "Linked NCMR and CAPA records",
      "Evidence verification",
      "Audit closure and reports",
    ],
  },
  {
    id: "reports",
    path: "/reports",
    label: "Reports",
    moduleCode: "J",
    moduleName: "Reporting and Intelligence",
    group: "insights",
    icon: "reports",
    summary:
      "Quality indicators and trends computed from real records, plus the foundations for the Evidence Graph and Consistency Engine.",
    capabilities: [
      "Quality KPIs",
      "Rejection trends",
      "Production quality metrics",
      "NCMR aging",
      "CAPA effectiveness",
      "Training compliance",
      "Audit readiness",
      "Evidence Graph foundation",
      "Consistency Engine foundation",
    ],
  },
  {
    id: "organization",
    path: "/organization",
    label: "Organization",
    moduleCode: "B",
    moduleName: "Organization and Identity",
    group: "administration",
    icon: "organization",
    summary: "Organizations, sign-in, users, roles and tenant isolation. Authentication does not exist yet.",
    capabilities: [
      "Organization registration and setup",
      "Login and logout",
      "User management",
      "Roles and permissions",
      "Tenant isolation",
      "Organization settings",
    ],
  },
];

export function modulesInGroup(group: NavGroupId): readonly QmsModule[] {
  return MODULES.filter((entry) => entry.group === group);
}

export function findModuleByPath(path: string): QmsModule | undefined {
  const normalized = normalizePath(path);
  return MODULES.find((entry) => entry.path === normalized);
}

export function requireModule(id: string): QmsModule {
  const found = MODULES.find((entry) => entry.id === id);
  if (!found) {
    throw new Error(`Unknown module id: ${id}`);
  }
  return found;
}
