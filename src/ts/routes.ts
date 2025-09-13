// routes.ts
export const ROUTES = {
    home: { path: '/', label: 'HEADER' },
    color: { path: '/color', label: 'COLOR' },
    button: { path: '/button', label: 'BUTTON' },
    footer: { path: '/footer', label: 'FOOTER' },
  } as const;
  
  export type RouteKey = keyof typeof ROUTES;