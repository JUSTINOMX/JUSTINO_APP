import type { Express } from "express";
import { createClient } from "@supabase/supabase-js";
import { renderMarkdown, cleanBlogMarkdown } from "./markdown";

const BASE = "https://justino.app";

function sb() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

function escapeHtml(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Logo SVG esmeralda igual al de la landing (index.html)
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-7 h-7" aria-hidden="true">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#34D399"/><stop offset="100%" stop-color="#064E3B"/>
  </linearGradient></defs>
  <path d="M50 20 C65 20, 80 35, 80 50 C80 60, 75 70, 65 75 L55 65 C62 60, 65 55, 65 50 C65 42, 58 35, 50 35 L50 20 Z" fill="#10B981"/>
  <path d="M35 75 C25 70, 20 60, 20 50 C20 35, 35 20, 50 20 L50 35 C42 35, 35 42, 35 50 C35 55, 38 60, 45 65 L35 75 Z" fill="url(#g)"/>
  <circle cx="50" cy="50" r="6" fill="white"/>
</svg>`;

const ARTICLE_CSS = `
  body{font-family:'Inter',system-ui,sans-serif;background:#F8FAFC;color:#0F172A;}
  .jst-article{max-width:44rem;margin:0 auto;padding:2rem 1.25rem 4rem;line-height:1.75;}
  .jst-article h1{font-size:2.25rem;line-height:1.2;font-weight:700;color:#0F172A;margin:1.5rem 0 1rem;}
  .jst-article h2{font-size:1.6rem;line-height:1.3;font-weight:700;color:#064E3B;margin:2.5rem 0 1rem;padding-top:1rem;border-top:1px solid #E2E8F0;}
  .jst-article h3{font-size:1.2rem;font-weight:600;color:#0F172A;margin:1.75rem 0 0.75rem;}
  .jst-article p{margin:0 0 1.1rem;color:#1E293B;}
  .jst-article ul,.jst-article ol{margin:0 0 1.25rem;padding-left:1.4rem;color:#1E293B;}
  .jst-article li{margin:0 0 0.5rem;}
  .jst-article a{color:#059669;text-decoration:underline;}
  .jst-article blockquote{border-left:4px solid #10B981;background:#ECFDF5;padding:1rem 1.25rem;margin:1.5rem 0;border-radius:0 .5rem .5rem 0;color:#065F46;font-style:italic;}
  .jst-article img{border-radius:1rem;margin:1.5rem 0;width:100%;height:auto;}
  .jst-article code{background:#F1F5F9;padding:0.15rem 0.4rem;border-radius:0.35rem;font-size:0.9em;}
  .jst-article table{width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:0.95rem;}
  .jst-article th,.jst-article td{border:1px solid #E2E8F0;padding:0.6rem 0.8rem;text-align:left;}
  .jst-article th{background:#F1F5F9;color:#064E3B;}
  .jst-card{max-width:44rem;margin:0 auto;}
  .jst-cta{margin-top:2.5rem;padding:2rem;background:linear-gradient(135deg,#ECFDF5 0%,#D1FAE5 100%);border:1px solid #A7F3D0;border-radius:1.25rem;text-align:center;box-shadow:0 10px 30px -12px rgba(16,185,129,.35);}
  .jst-cta .jst-cta-icon{width:2.75rem;height:2.75rem;margin:0 auto 0.75rem;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:#10B981;color:#fff;}
  .jst-cta h3{color:#064E3B;font-weight:700;font-size:1.25rem;margin:0 0 .4rem;line-height:1.3;}
  .jst-cta p{color:#065F46;font-size:1rem;margin:0 0 1.1rem;max-width:32rem;margin-left:auto;margin-right:auto;line-height:1.6;}
  .jst-cta a{display:inline-flex;align-items:center;gap:.5rem;background:#10B981;color:#fff;padding:0.85rem 1.75rem;border-radius:0.85rem;font-weight:600;font-size:1.05rem;text-decoration:none;transition:background .2s,transform .15s;box-shadow:0 6px 16px -6px rgba(16,185,129,.6);}
  .jst-cta a:hover{background:#059669;transform:translateY(-1px);}
  .jst-cta a svg{width:1.1rem;height:1.1rem;}
  .jst-social{max-width:44rem;margin:2.5rem auto 0;padding:1.5rem;border-top:1px solid #E2E8F0;text-align:center;}
  .jst-social-actions{display:flex;gap:1rem;justify-content:center;align-items:center;flex-wrap:wrap;margin-bottom:1rem;}
  .jst-like,.jst-share{display:inline-flex;align-items:center;gap:.45rem;background:#fff;border:1px solid #CBD5E1;color:#475569;padding:.6rem 1.1rem;border-radius:.75rem;font-weight:600;font-size:.95rem;text-decoration:none;cursor:pointer;transition:background .2s,color .2s,border-color .2s;}
  .jst-like svg,.jst-share svg{width:1.1rem;height:1.1rem;}
  .jst-like:hover,.jst-share:hover{border-color:#10B981;color:#059669;}
  .jst-like.is-active{background:#ECFDF5;border-color:#10B981;color:#059669;}
  .jst-like.is-active svg{fill:#10B981;stroke:#10B981;}
  .jst-social-follow{color:#64748B;font-size:.9rem;margin:0 0 .75rem;}
  .jst-social-links{display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;}
  .jst-social-links a{color:#059669;font-weight:600;font-size:.9rem;text-decoration:none;}
  .jst-social-links a:hover{text-decoration:underline;}

  .jst-card-item{display:block;background:#fff;border:1px solid #E2E8F0;border-radius:1rem;overflow:hidden;transition:box-shadow .2s,transform .2s;}
  .jst-card-item:hover{box-shadow:0 10px 25px -5px rgba(16,185,129,.25);transform:translateY(-2px);}
  .jst-card-item img{width:100%;height:12rem;object-fit:cover;}
  .jst-card-item .body{padding:1rem;}
  .jst-tag{color:#059669;font-weight:600;font-size:.8rem;text-transform:uppercase;letter-spacing:.03em;}
  .jst-card-item h2{font-size:1.15rem;font-weight:700;color:#0F172A;margin:.35rem 0 .5rem;}
  .jst-card-item p{font-size:.9rem;color:#475569;margin:0;}
  @media (max-width:640px){.jst-article{padding:1.25rem 1rem 3rem;}.jst-article h1{font-size:1.75rem;}}
`;

function baseLayout(opts: {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  bodyHtml: string;
  jsonLd: object[];
}): string {
  const ld = opts.jsonLd
    .map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`)
    .join("\n");
  const ogImage = opts.ogImage || "";
  return `<!DOCTYPE html>
<html lang="es" class="h-full bg-slate-50">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(opts.title)}</title>
<meta name="description" content="${escapeHtml(opts.description)}" />
<link rel="canonical" href="${escapeHtml(opts.canonical)}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${escapeHtml(opts.title)}" />
<meta property="og:description" content="${escapeHtml(opts.description)}" />
<meta property="og:url" content="${escapeHtml(opts.canonical)}" />
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ""}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(opts.title)}" />
<meta name="twitter:description" content="${escapeHtml(opts.description)}" />
${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />` : ""}
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
  .jst-article { color: #334155; line-height: 1.8; font-size: 1.0625rem; }
  .jst-article h2 { color: #0f172a; font-weight: 700; font-size: 1.5rem; margin-top: 2.25rem; margin-bottom: 0.875rem; tracking: -0.015em; }
  .jst-article h3 { color: #1e293b; font-weight: 600; font-size: 1.25rem; margin-top: 1.75rem; margin-bottom: 0.625rem; }
  .jst-article p { margin-top: 1rem; margin-bottom: 1rem; }
  .jst-article ul { list-style-type: disc; padding-left: 1.5rem; margin-top: 0.875rem; margin-bottom: 0.875rem; }
  .jst-article ol { list-style-type: decimal; padding-left: 1.5rem; margin-top: 0.875rem; margin-bottom: 0.875rem; }
  .jst-article li { margin-top: 0.375rem; margin-bottom: 0.375rem; }
  .jst-article blockquote { border-left: 4px solid #10b981; background-color: #ecfdf5; padding: 0.875rem 1.125rem; border-radius: 0 0.75rem 0.75rem 0; margin: 1.5rem 0; font-style: italic; color: #334155; }
  .jst-article a { color: #059669; text-decoration: underline; font-weight: 500; }
  .jst-article a:hover { color: #047857; }
  .jst-grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(1, minmax(0, 1fr)); }
  @media (min-width: 640px) { .jst-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .jst-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden; transition: all 0.2s ease-in-out; display: flex; flex-direction: column; }
  .jst-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border-color: #a7f3d0; }
  .jst-cta { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0; border-radius: 1.25rem; padding: 2rem 1.5rem; text-align: center; margin-top: 3.5rem; box-shadow: 0 4px 15px -3px rgba(16, 185, 129, 0.12); }
  .jst-cta-icon { width: 3rem; height: 3rem; background: #10b981; color: #ffffff; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); }
</style>
${ld}
</head>
<body class="bg-slate-50 text-slate-900 min-h-full flex flex-col">
<header class="border-b border-slate-200/80 bg-white sticky top-0 z-50 backdrop-blur-md bg-white/95">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2.5 text-slate-900 font-bold text-xl tracking-tight group">
      <svg class="w-8 h-8 text-emerald-600 flex-shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#10B981"/>
        <path d="M10 10H22M16 10V22M12 22H20" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Justino</span>
    </a>
    <nav class="flex items-center gap-4 sm:gap-6">
      <a href="/" class="text-sm font-medium text-slate-600 hover:text-emerald-600 transition">Inicio</a>
      <a href="/blog" class="text-sm font-medium text-emerald-600 hover:text-emerald-700 font-semibold">Blog</a>
      <a href="/" class="inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition">
        Abrir expediente
      </a>
    </nav>
  </div>
</header>
<main class="flex-grow max-w-[44rem] w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
${opts.bodyHtml}
</main>
<footer class="border-t border-slate-200 bg-white mt-16 py-10">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
    <div class="flex items-center gap-2 text-slate-900 font-semibold text-sm">
      <svg class="w-5 h-5 text-emerald-600" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="#10B981"/>
        <path d="M10 10H22M16 10V22M12 22H20" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Justino · Asistente legal digital de México
    </div>
    <div class="text-xs text-slate-500">
      © ${new Date().getFullYear()} Justino. Todos los derechos reservados.
    </div>
  </div>
</footer>
</body>
</html>`;
}

function ctaByArea(area?: string): { title: string; subtitle: string; buttonText: string } {
  const norm = (area || "").toLowerCase().trim();
  if (norm.includes("laboral") || norm.includes("trabajo") || norm.includes("despido")) {
    return {
      title: "¿Problemas o dudas en tu trabajo?",
      subtitle: "Justino analiza tu caso laboral, te explica tus derechos y finiquito en lenguaje claro.",
      buttonText: "Consultar mi caso laboral"
    };
  }
  if (norm.includes("familiar") || norm.includes("divorcio") || norm.includes("pension") || norm.includes("custodia")) {
    return {
      title: "¿Necesitas orientación en temas familiares?",
      subtitle: "Justino te apoya con dudas sobre pensión alimenticia, divorcios y custodia familiar.",
      buttonText: "Consultar orientación familiar"
    };
  }
  if (norm.includes("penal") || norm.includes("delito") || norm.includes("denuncia")) {
    return {
      title: "¿Enfrentas una situación penal o denuncia?",
      subtitle: "Obtén guía clara e inmediata sobre procedimientos penales y protección de tus derechos.",
      buttonText: "Iniciar orientación penal"
    };
  }
  if (norm.includes("inmobiliario") || norm.includes("renta") || norm.includes("arrendamiento") || norm.includes("propiedad")) {
    return {
      title: "¿Dudas sobre contratos de renta o propiedad?",
      subtitle: "Justino revisa tus contratos y derechos de arrendamiento o propiedad en México.",
      buttonText: "Consultar tema inmobiliario"
    };
  }
  if (norm.includes("mercantil") || norm.includes("deuda") || norm.includes("contrato") || norm.includes("empresa")) {
    return {
      title: "¿Dudas sobre deudas, cobranza o contratos?",
      subtitle: "Analiza tu contrato o situación financiera con la guía legal de Justino.",
      buttonText: "Revisar mi caso"
    };
  }
  return {
    title: "¿Tienes una duda legal o un problema por resolver?",
    subtitle: "Justino analiza tu caso, te explica tus derechos en lenguaje claro y te guía paso a paso.",
    buttonText: "Abrir mi expediente"
  };
}

function articleBodyHtml(row: any): string {
  // Imagen hero: usa featured_image_url de la BD; si no está, aplica el mapa
  // fijo de imágenes por slug (escalable para las 174 fichas del Atlas).
  const HERO_IMAGES: Record<string, string> = {
    "me-despidieron-que-hacer": "https://msigkydllxgirspdjegm.supabase.co/storage/v1/object/public/justino-media/blog/me-despidieron-que-hacer.jpg",
    "no-me-pagan-pension-alimenticia-que-hacer": "https://msigkydllxgirspdjegm.supabase.co/storage/v1/object/public/justino-media/blog/no-me-pagan-pension-alimenticia-que-hacer.jpg",
  };
  const heroImg = row.featured_image_url || HERO_IMAGES[row.slug] || "";
  const heroAlt = row.alt_text || row.h1 || row.title || "Justino";
  const hero = heroImg
    ? `<img src="${escapeHtml(heroImg)}" alt="${escapeHtml(heroAlt)}" class="w-full rounded-2xl mb-8 shadow-sm border border-slate-200 object-cover max-h-96" />`
    : "";
  const body = renderMarkdown(cleanBlogMarkdown(row.markdown || ""));
  const areaTag = row.area
    ? `<span class="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full mb-3">${escapeHtml(row.area)}</span>`
    : "";
  const dateStr = row.published_at || row.created_at
    ? `<time class="text-xs text-slate-500 font-medium">${new Date(row.published_at || row.created_at).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</time>`
    : "";

  const ctaData = ctaByArea(row.area);
  const cta = `
  <div class="jst-cta">
    <div class="jst-cta-icon mx-auto">
      <svg class="w-6 h-6" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#10B981"/>
        <path d="M10 10H22M16 10V22M12 22H20" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <h3 class="text-xl sm:text-2xl font-bold text-slate-900 mb-2">${escapeHtml(ctaData.title)}</h3>
    <p class="text-slate-600 text-sm sm:text-base max-w-md mx-auto mb-6">${escapeHtml(ctaData.subtitle)}</p>
    <a href="/" class="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-semibold text-sm rounded-xl hover:bg-emerald-700 transition shadow-sm">
      ${escapeHtml(ctaData.buttonText)}
    </a>
  </div>`;

  // Bloque fijo de redes sociales (like / compartir / seguir) para TODOS los artículos.
  // URLs definitivas por confirmar de Edwin; placeholders coherentes con la marca.
  const SHARE_URL = `${BASE}/blog/${row.slug}`;
  const socialHtml = `
  <div class="jst-social" role="region" aria-label="Comparte y sigue a Justino">
    <div class="jst-social-actions">
      <button class="jst-like" type="button" aria-pressed="false" onclick="this.classList.toggle('is-active');this.setAttribute('aria-pressed', this.classList.contains('is-active'));">${heartSvg}<span>Me gusta</span></button>
      <a class="jst-share" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}" target="_blank" rel="noopener">${shareSvg}<span>Compartir</span></a>
      <a class="jst-share" href="https://twitter.com/intent/tweet?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(row.h1 || row.title || 'Justino')}" target="_blank" rel="noopener">${shareSvg}<span>Twittear</span></a>
    </div>
    <p class="jst-social-follow">Síguenos y acompaña a más mexicanos:</p>
    <div class="jst-social-links">
      <a href="https://www.facebook.com/justino.app" target="_blank" rel="noopener">Facebook</a>
      <a href="https://www.instagram.com/justino.app" target="_blank" rel="noopener">Instagram</a>
      <a href="https://www.tiktok.com/@justino.app" target="_blank" rel="noopener">TikTok</a>
      <a href="https://www.linkedin.com/company/justino" target="_blank" rel="noopener">LinkedIn</a>
      <a href="https://www.youtube.com/@justino" target="_blank" rel="noopener">YouTube</a>
    </div>
  </div>`;
  return `<article class="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-sm">
${hero}
<header class="mb-8 border-b border-slate-100 pb-6">
  ${areaTag}
  <h1 class="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">${escapeHtml(row.h1 || row.title)}</h1>
  ${dateStr ? `<div class="flex items-center gap-2">${dateStr}</div>` : ""}
</header>
<div class="jst-article">${body}</div>
${cta}
${socialHtml}
</article>`;
}

// Iconos reutilizables para el bloque social
const heartSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>`;
const shareSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>`;

function buildJsonLd(row: any): object[] {
  const ld: any[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: row.h1 || row.title,
      description: row.meta_description || "",
      image: row.featured_image_url || "",
      author: { "@type": "Organization", name: "Justino" },
      publisher: {
        "@type": "Organization",
        name: "Justino",
        logo: { "@type": "ImageObject", url: "https://justino.app/logo.png" },
      },
      datePublished: row.published_at || row.created_at,
      dateModified: row.updated_at || row.created_at,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://justino.app/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://justino.app/blog" },
        {
          "@type": "ListItem",
          position: 3,
          name: row.h1 || row.title,
          item: `https://justino.app/blog/${row.slug}`,
        },
      ],
    },
  ];

  const faq = row.faq_json;
  if (Array.isArray(faq) && faq.length) {
    ld.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f: any) => ({
        "@type": "Question",
        name: f.q || f.pregunta || "",
        acceptedAnswer: { "@type": "Answer", text: f.a || f.respuesta || "" },
      })),
    });
  }
  return ld;
}

export function setupBlogRoutes(app: Express) {
  const blogListHandler = async (req: any, res: any) => {
    try {
      const supabase = sb();
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("estado", "publicado")
        .order("published_at", { ascending: false });
      if (error) throw error;

      const list = (data || [])
        .map(
          (r: any) => `
        <a href="/blog/${r.slug}" class="jst-card group">
          ${r.featured_image_url ? `<div class="aspect-video w-full overflow-hidden bg-slate-100"><img src="${escapeHtml(r.featured_image_url)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="${escapeHtml(r.h1 || r.title)}" /></div>` : ""}
          <div class="p-5 flex flex-col flex-grow">
            ${r.area ? `<span class="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full w-fit mb-2">${escapeHtml(r.area)}</span>` : ""}
            <h2 class="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors leading-snug mb-2">${escapeHtml(r.h1 || r.title)}</h2>
            <p class="text-slate-600 text-sm line-clamp-3 mb-4 flex-grow leading-relaxed">${escapeHtml(r.meta_description || "")}</p>
            <span class="text-xs font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Leer guía legal →</span>
          </div>
        </a>`
        )
        .join("");

      const html = baseLayout({
        title: "Blog legal de Justino | Guías para mexicanos",
        description:
          "Artículos claros sobre problemas legales en México. Justino te acompaña caso por caso.",
        canonical: `${BASE}/blog`,
        bodyHtml: `
        <div class="text-center mb-10">
          <span class="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full mb-3">Guías y Orientación Legal</span>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Blog de Justino</h1>
          <p class="text-slate-600 text-base sm:text-lg max-w-xl mx-auto">Explicaciones sencillas sobre tus derechos y trámites legales en México.</p>
        </div>
        <div class="jst-grid">${list}</div>`,
        jsonLd: [],
      });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (e: any) {
      res.status(500).send("Error al cargar el blog: " + (e?.message || String(e)));
    }
  };

  app.get("/blog", blogListHandler);
  app.get("/blog/", blogListHandler);

  app.get("/blog/:slug", async (req, res) => {
    try {
      const supabase = sb();
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", req.params.slug)
        .eq("estado", "publicado")
        .single();
      if (error || !data) return res.status(404).send("Artículo no encontrado");
      const html = baseLayout({
        title: data.meta_title || data.h1 || data.title,
        description: data.meta_description || "",
        canonical: `${BASE}/blog/${data.slug}`,
        ogImage: data.og_image_url || data.featured_image_url,
        bodyHtml: articleBodyHtml(data),
        jsonLd: buildJsonLd(data),
      });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (e: any) {
      res.status(500).send("Error al cargar el artículo");
    }
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const supabase = sb();
      const { data, error } = await supabase
        .from("articles")
        .select("slug,updated_at")
        .eq("estado", "publicado");
      if (error) throw error;
      const urls = (data || [])
        .map(
          (r: any) =>
            `  <url><loc>${BASE}/blog/${r.slug}</loc><lastmod>${(r.updated_at || "").slice(0, 10)}</lastmod></url>`
        )
        .join("\n");
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.send(xml);
    } catch (e: any) {
      res.status(500).send("Error");
    }
  });

  app.get("/robots.txt", (req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(`User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml`);
  });
}

