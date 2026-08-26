import type { Express } from "express";
import { createClient } from "@supabase/supabase-js";
import { renderMarkdown, cleanBlogMarkdown } from "./markdown";

const BASE = "https://justino.app";

// Paleta y tipografía idénticas a la landing de Justino
const BRAND = {
  emerald: "#10B981",
  emeraldDark: "#064E3B",
  navy: "#0F172A",
  slate: "#0F172A",
};

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
<html lang="es">
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
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
<style>${ARTICLE_CSS}</style>
${ld}
</head>
<body>
<header style="border-bottom:1px solid #E2E8F0;background:#fff;">
  <div style="max-width:44rem;margin:0 auto;padding:.9rem 1.25rem;display:flex;align-items:center;justify-content:space-between;">
    <a href="/" style="display:flex;align-items:center;gap:.5rem;text-decoration:none;color:#0F172A;font-weight:700;font-size:1.25rem;">
      ${LOGO_SVG}<span>Justino</span>
    </a>
    <a href="/blog" style="color:#475569;font-size:.95rem;text-decoration:none;">Blog</a>
  </div>
</header>
<main>
${opts.bodyHtml}
</main>
<footer style="border-top:1px solid #E2E8F0;background:#fff;margin-top:3rem;">
  <div style="max-width:44rem;margin:0 auto;padding:1.5rem 1.25rem;color:#64748B;font-size:.85rem;">
    Justino · Asistente legal digital de México
  </div>
</footer>
</body>
</html>`;
}

function articleBodyHtml(row: any): string {
  const hero = row.featured_image_url
    ? `<img src="${escapeHtml(row.featured_image_url)}" alt="${escapeHtml(row.h1 || row.title)}" />`
    : "";
  const body = renderMarkdown(cleanBlogMarkdown(row.markdown || ""));

  // CTA dinámico por área: refleja el dolor del tema y cierra con el
  // pequeño primer paso (disparador de acción de A.D.C.A.R.). Sin "gratis"/
  // "sin costo" (regla SEJ-03 3.6).
  const ctaByArea: Record<string, { title: string; sub: string; btn: string }> = {
    Familiar: {
      title: "Tu familia no debería pagar por lo que ya es suyo",
      sub: "Abre tu expediente y deja que Justino ordene los depósitos, las pruebas y los pasos siguientes por ti.",
      btn: "Abrir mi expediente",
    },
    Laboral: {
      title: "Lo que te deben por tu trabajo sigue siendo tuyo",
      sub: "Abre tu expediente y Justino organiza tu caso, tus pruebas y tu siguiente paso sin que adivines nada.",
      btn: "Abrir mi expediente",
    },
    Consumidor: {
      title: "No tienes que aguantar lo que no es justo",
      sub: "Abre tu expediente y Justino aclara tus derechos y qué hacer con ese cobro o producto que te afecta.",
      btn: "Abrir mi expediente",
    },
    Deudas: {
      title: "La deuda no tiene por qué quitarme la calma",
      sub: "Abre tu expediente y Justino revisa tu situación y te muestra las opciones reales paso a paso.",
      btn: "Abrir mi expediente",
    },
    Arrendamiento: {
      title: "Tu casa merece claridad, no sorpresas",
      sub: "Abre tu expediente y Justino organiza tu contrato, tus pruebas y qué hacer a continuación.",
      btn: "Abrir mi expediente",
    },
    Civil: {
      title: "Tu conflicto tiene un camino claro",
      sub: "Abre tu expediente y Justino ordena tu caso y te dice el siguiente paso sin tecnicismos.",
      btn: "Abrir mi expediente",
    },
    Administrativo: {
      title: "El trámite no tiene por qué vencerte",
      sub: "Abre tu expediente y Justino organiza tus plazos, documentos y tu siguiente movimiento.",
      btn: "Abrir mi expediente",
    },
    Herencias: {
      title: "Lo que dejaron merece resolverse en paz",
      sub: "Abre tu expediente y Justino organiza la sucesión y los pasos que siguen, sin que empieces de cero.",
      btn: "Abrir mi expediente",
    },
    Penal: {
      title: "No tienes que enfrentarlo sin rumbo",
      sub: "Abre tu expediente y Justino aclara tu situación y qué hacer a continuación, con lenguaje claro.",
      btn: "Abrir mi expediente",
    },
    Inmobiliario: {
      title: "Tu inmueble merece decisiones seguras",
      sub: "Abre tu expediente y Justino organiza tu caso y te muestra el siguiente paso sin adivinar.",
      btn: "Abrir mi expediente",
    },
    Bancos: {
      title: "Tu dinero merece respuestas claras",
      sub: "Abre tu expediente y Justino revisa el cargo o el trámite y te dice qué hacer a continuación.",
      btn: "Abrir mi expediente",
    },
    Mercantil: {
      title: "Tu negocio merece protección clara",
      sub: "Abre tu expediente y Justino organiza tu caso y los siguientes pasos sin tecnicismos.",
      btn: "Abrir mi expediente",
    },
    Fiscal: {
      title: "El SAT no tiene por qué darte miedo",
      sub: "Abre tu expediente y Justino aclara tu situación y qué hacer a continuación, paso a paso.",
      btn: "Abrir mi expediente",
    },
  };
  const cta = ctaByArea[row.area] || {
    title: "No tienes que resolverlo solo",
    sub: "Abre tu expediente y Justino organiza tu caso, te explica tus derechos y te guía paso a paso.",
    btn: "Abrir mi expediente",
  };

  const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>`;

  const ctaHtml = `
  <div class="jst-cta">
    <div class="jst-cta-icon">${icon}</div>
    <h3>${escapeHtml(cta.title)}</h3>
    <p>${escapeHtml(cta.sub)}</p>
    <a href="/">${escapeHtml(cta.btn)}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></a>
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
  return `<article class="jst-article">
${hero}
<h1>${escapeHtml(row.h1 || row.title)}</h1>
${body}
${ctaHtml}
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
        <a href="/blog/${r.slug}" class="jst-card-item">
          ${r.featured_image_url ? `<img src="${escapeHtml(r.featured_image_url)}" alt="${escapeHtml(r.h1 || r.title)}" />` : ""}
          <div class="body">
            <span class="jst-tag">${escapeHtml(r.area || "")}</span>
            <h2>${escapeHtml(r.h1 || r.title)}</h2>
            <p>${escapeHtml(r.meta_description || "")}</p>
          </div>
        </a>`
        )
        .join("");
      const html = baseLayout({
        title: "Blog legal de Justino | Guías para mexicanos",
        description:
          "Artículos claros sobre problemas legales en México. Justino te acompaña caso por caso.",
        canonical: `${BASE}/blog`,
        bodyHtml: `<div class="jst-card"><h1 style="font-size:2rem;font-weight:700;color:#0F172A;margin:2rem 0 0;">Blog de Justino</h1><div class="jst-grid">${list}</div></div>`,
        jsonLd: [],
      });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (e: any) {
      console.error("BLOG LIST ERR:", e?.message || e);
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
      console.error("BLOG ARTICLE ERR:", e?.message || e);
      res.status(500).send("Error al cargar el artículo: " + (e?.message || String(e)));
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
