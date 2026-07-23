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
  .jst-cta{margin-top:2.5rem;padding:1.75rem;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:1rem;text-align:center;}
  .jst-cta p{color:#065F46;font-weight:600;font-size:1.1rem;margin-bottom:1rem;}
  .jst-cta a{display:inline-block;background:#10B981;color:#fff;padding:0.75rem 1.5rem;border-radius:0.75rem;font-weight:600;text-decoration:none;}
  .jst-cta a:hover{background:#059669;}
  .jst-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(18rem,1fr));gap:1.5rem;margin-top:1.5rem;}
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
  const cta = `
  <div class="jst-cta">
    <p>No estás sola. Abre tu expediente en Justino.</p>
    <a href="/">Abrir mi expediente</a>
  </div>`;
  return `<article class="jst-article">
${hero}
<h1>${escapeHtml(row.h1 || row.title)}</h1>
${body}
${cta}
</article>`;
}

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
