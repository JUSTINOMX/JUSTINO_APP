// Renderizador de Markdown PROPIO (sin dependencias externas).
// Cubre la arquitectura SEJ-01: H1/H2/H3, párrafos, listas, negritas,
// cursivas, enlaces, blockquotes, código, imágenes y tablas simples.
// Esto elimina la dependencia de 'marked' para que el blog nunca falle
// por cache de instalación en Vercel.

function escapeHtml(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  let t = escapeHtml(s);
  // code `x`
  t = t.replace(/`([^`]+)`/g, "<code class=\"px-1 bg-gray-100 rounded\">$1</code>");
  // bold **x** or __x__
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  // italic *x* or _x_
  t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  t = t.replace(/(?<!\w)_([^_]+)_(?!\w)/g, "<em>$1</em>");
  // links [text](url)
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, txt, url) => {
    const safe = url.replace(/"/g, "%22");
    return `<a href="${safe}" class="text-indigo-700 underline">${txt}</a>`;
  });
  return t;
}

export function renderMarkdown(md: string): string {
  if (!md) return "";
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let listOpen = false;
  let inTable = false;

  const closeList = () => {
    if (listOpen) {
      out.push("</ul>");
      listOpen = false;
    }
  };
  const closeTable = () => {
    if (inTable) {
      out.push("</tbody></table>");
      inTable = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line
    if (trimmed === "") {
      closeList();
      closeTable();
      i++;
      continue;
    }

    // Headings
    const h = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (h) {
      closeList();
      closeTable();
      const level = h[1].length;
      const sizes = ["text-3xl font-bold mb-4", "text-2xl font-bold mt-8 mb-3", "text-xl font-semibold mt-6 mb-2"];
      out.push(`<h${level} class="${sizes[level - 1]}">${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      closeList();
      closeTable();
      out.push('<hr class="my-6 border-gray-200" />');
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      closeList();
      closeTable();
      out.push(`<blockquote class="border-l-4 border-indigo-300 pl-4 text-gray-600 italic my-4">${inline(trimmed.replace(/^>\s?/, ""))}</blockquote>`);
      i++;
      continue;
    }

    // Images ![alt](url)
    if (/^!\[[^\]]*\]\([^)]+\)$/.test(trimmed)) {
      closeList();
      closeTable();
      const m = /!\[([^\]]*)\]\(([^)]+)\)/.exec(trimmed)!;
      out.push(`<img src="${m[2].replace(/"/g, "%22")}" alt="${escapeHtml(m[1])}" class="w-full rounded-xl my-4" />`);
      i++;
      continue;
    }

    // Table (header | --- | rows)
    if (trimmed.includes("|") && i + 1 < lines.length && /^\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes("-")) {
      closeList();
      if (!inTable) {
        out.push('<table class="w-full text-left border-collapse my-4"><thead>');
        inTable = true;
      }
      const cells = trimmed.split("|").map((c) => c.trim()).filter((c) => c !== "");
      const isHeaderRow = !out[out.length - 1].includes("</thead>");
      if (isHeaderRow) {
        out.push("<tr>" + cells.map((c) => `<th class="border px-3 py-2 bg-gray-50">${inline(c)}</th>`).join("") + "</tr></thead><tbody>");
      } else {
        out.push("<tr>" + cells.map((c) => `<td class="border px-3 py-2">${inline(c)}</td>`).join("") + "</tr>");
      }
      i += 2;
      continue;
    } else if (trimmed.includes("|") && inTable) {
      const cells = trimmed.split("|").map((c) => c.trim()).filter((c) => c !== "");
      out.push("<tr>" + cells.map((c) => `<td class="border px-3 py-2">${inline(c)}</td>`).join("") + "</tr>");
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      closeTable();
      if (!listOpen) {
        out.push('<ul class="list-disc pl-6 my-3 space-y-1">');
        listOpen = true;
      }
      out.push(`<li>${inline(trimmed.replace(/^[-*]\s+/, ""))}</li>`);
      i++;
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      closeTable();
      if (!listOpen) {
        out.push('<ol class="list-decimal pl-6 my-3 space-y-1">');
        listOpen = true;
      }
      out.push(`<li>${inline(trimmed.replace(/^\d+\.\s+/, ""))}</li>`);
      i++;
      continue;
    }

    // Paragraph
    closeList();
    closeTable();
    out.push(`<p class="my-3 leading-relaxed">${inline(trimmed)}</p>`);
    i++;
  }
  closeList();
  closeTable();
  return out.join("\n");
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
