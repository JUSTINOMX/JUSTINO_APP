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
<script src="https://cdn.tailwindcss.com"></script>
${ld}
</head>
<body class="bg-gray-50 text-gray-900">
<header class="border-b bg-white">
  <div class="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
    <a href="/" class="font-bold text-xl text-indigo-700">Justino</a>
    <a href="/blog" class="text-sm text-gray-600 hover:text-indigo-700">Blog</a>
  </div>
</header>
<main class="max-w-3xl mx-auto px-4 py-8">
${opts.bodyHtml}
</main>
<footer class="border-t bg-white mt-12">
  <div class="max-w-3xl mx-auto px-4 py-6 text-sm text-gray-500">
    Justino · Asistente legal digital de México
  </div>
</footer>
</body>
</html>`;
}

function articleBodyHtml(row: any): string {
  const hero = row.featured_image_url
    ? `<img src="${escapeHtml(row.featured_image_url)}" alt="${escapeHtml(row.h1 || row.title)}" class="w-full rounded-xl mb-6" />`
    : "";
  const body = renderMarkdown(cleanBlogMarkdown(row.markdown || ""));
  const cta = `
  <div class="mt-10 p-6 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
    <p class="text-lg font-semibold text-indigo-800">No estás sola. Abre tu expediente en Justino.</p>
    <a href="/" class="inline-block mt-3 px-5 py-2 bg-indigo-700 text-white rounded-lg font-medium hover:bg-indigo-800">Abrir mi expediente</a>
  </div>`;
  return `${hero}
<h1 class="text-3xl font-bold mb-4">${escapeHtml(row.h1 || row.title)}</h1>
<div class="prose max-w-none">${body}</div>
${cta}`;
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
        <a href="/blog/${r.slug}" class="block border rounded-xl overflow-hidden hover:shadow-md transition bg-white">
          ${r.featured_image_url ? `<img src="${escapeHtml(r.featured_image_url)}" class="w-full h-48 object-cover" />` : ""}
          <div class="p-4">
            <span class="text-xs text-indigo-600 font-medium">${escapeHtml(r.area || "")}</span>
            <h2 class="text-xl font-semibold mt-1">${escapeHtml(r.h1 || r.title)}</h2>
            <p class="text-gray-600 text-sm mt-2">${escapeHtml(r.meta_description || "")}</p>
          </div>
        </a>`
        )
        .join("");
      const html = baseLayout({
        title: "Blog legal de Justino | Guías para mexicanos",
        description:
          "Artículos claros sobre problemas legales en México. Justino te acompaña caso por caso.",
        canonical: `${BASE}/blog`,
        bodyHtml: `<h1 class="text-3xl font-bold mb-6">Blog de Justino</h1><div class="grid gap-6 sm:grid-cols-2">${list}</div>`,
        jsonLd: [],
      });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (e: any) {
      res.status(500).send("Error al cargar el blog");
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
