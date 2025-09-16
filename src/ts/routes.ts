// routes.ts
export const ROUTES = {
  home: { path: '/', label: 'HEADER' },
    nav: { path: '/nav', label: 'NAV' },
    color: { path: '/color', label: 'COLOR' },
    button: { path: '/button', label: 'BUTTON' },
    near: { path: '/near', label: 'NEAR' },
    // footer: { path: '/footer', label: 'FOOTER' },
  } as const;
  
  export type RouteKey = keyof typeof ROUTES;