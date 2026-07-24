# Estado del proyecto JUSTINO.APP
Fecha: 2026-07-23
Responsable: Edwin Solis Go + Luisa (Hermes, perfil luisa_marketing)

## Resumen
Motor de contenido automatizado: 174 fichas del Atlas de Dolores -> articulos blog + campañas multicanal. Blog SSR servido desde Supabase + Vercel.

## Produccion (Vercel)
- Dominio: https://www.justino.app
- Estado: 4 rutas validadas en 200
  - /blog -> 200 (listado)
  - /blog/:slug -> 200 (articulo individual, ej. /blog/no-me-pagan-pension-alimenticia-que-hacer)
  - /sitemap.xml -> 200
  - /robots.xml -> 200

## Infraestructura
- Repo GitHub: JUSTINOMX/JUSTINO_APP (privado, main)
- Vercel: deploys automaticos desde GitHub main
- Supabase: URL + anon key + service_role (en .env local)
- Tablas: articles, media_assets, pipeline_state, social_posts
- Bucket storage: justino-media (publico)

## Arquitectura del blog
- Frontend: React SPA (Vite 6, React 19)
- Servidor: Express SSR dentro de Vercel como funcion serverless
- Funcion: api/server.ts importa api/_server.mjs (bundle esbuild de server.ts)
- Build: npm run build = vite build && esbuild server.ts --bundle --platform=node --format=esm --packages=external --sourcemap --outfile=api/_server.mjs
- vercel.json: rewrites /blog, /blog/(.*), /sitemap.xml, /robots.txt -> /api/server
- Render markdown: renderer propio (sin dependencia marked)
- Estilos blog: CSS embebido Inter + paleta emerald/slate (.jst-article, .jst-cta, etc.)
- CTA: dinamico por area via mapa ctaByArea (lab, fam, deudas, arrendamiento, etc.)
- No usar: "sin costo", "gratis", mencionar abogado externo, solucion legal completa

## Reglas de oro (SEJ)
1. Justino SUSTITUYE al abogado en la mayoria de casos (sin representacion judicial). No mandar con abogado externo.
2. El articulo NO da solucion legal completa: nombra el problema, reduce ansiedad, cierra con invitacion a abrir expediente.
3. NUNCA usar "gratis"/"sin costo" ni precios en contenido evergreen (costo real ~$400 MXN por expediente, no se incluye).

## Estado del pipeline
- Atlas parseado: 174 fichas, 13 areas
- F001 (Pension alimenticia): publicado
- Modo B default (aprueba usuario antes de publicar)
- Cronjobs: 3 fichas/dia (09:00, 13:30, 18:00) - pendiente configurar
- Canales: FB, IG, X, Threads, Reddit, LinkedIn, TikTok, YouTube, Reels/Shorts, WhatsApp

## Notas operativas
- Token GitHub PAT en .env linea 20 (no commitear)
- Vercel env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (configuradas en dashboard)
- Repo clonable en Windows solo si NO tiene archivos con ':' en el nombre
- AI Studio puede generar migrated_prompt_history/*.json con timestamps ISO -> borrar post-deploy
- Cualquier cambio a lib/blog.ts, vercel.json, package.json, api/server.ts -> push a main -> Vercel auto-deploy

## Próximos pasos
- Configurar cronjobs (3 fichas/dia)
- Seguir con L001 (Despido), F007 (Divorcio), A001 (Arrendamiento)
- Conectar canales sociales cuando haya credenciales Meta/Google
- Documentar skill justino-blog-deploy (flujo blog SSR verificado)
