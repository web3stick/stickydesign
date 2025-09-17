// routes.ts
export const ROUTES = {
  home: { path: "/", label: "HEADER" },
  nav: { path: "/nav", label: "NAV" },
  color: { path: "/colors", label: "COLORS" },
  tools: { path: "/tools", label: "TOOLS"},
  // basic
  button: { path: "/button", label: "BUTTON" },
  toggle_switch: { path: "/toggle-switch", label: "TOGGLE SWITCH" },
  // near: { path: "/near", label: "NEAR" },
  near_auth_button: { path: "/near/auth-button", label: "AUTH BUTTON" },
  near_all_swap: { path: "/near/all-swap", label: "ALL TOKEN SWAP" },
  // footer: { path: '/footer', label: 'FOOTER' },
} as const;

export type RouteKey = keyof typeof ROUTES;
