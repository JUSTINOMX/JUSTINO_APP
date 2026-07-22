import { marked } from "marked";

// Convierte markdown -> HTML para el blog
export function renderMarkdown(md: string): string {
  if (!md) return "";
  marked.setOptions({ gfm: true, breaks: true });
  return marked.parse(md, { async: false }) as string;
}

// Quita las secciones editoriales (meta/SEO/prompts) que NO van en el blog.
// El cuerpo publicable son las secciones 5 a 15 del artículo.
export function cleanBlogMarkdown(md: string): string {
  if (!md) return "";
  return md
    .split("\n")
    .filter((line) => !/^##\s*(1\.|2\.|3\.|4\.|16\.|17\.|18\.|19\.|20\.|21\.)/.test(line.trim()))
    .filter((line) => !/CHECKLIST DE APROBACIÓN/.test(line))
    .filter((line) => !/^---$/.test(line.trim()))
    .join("\n")
    .trim();
}
