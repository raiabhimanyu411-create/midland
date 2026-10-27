// Simple blog formatting shared by the post page (React) and the server-rendered HTML.
// Blank lines separate blocks. "## " starts a heading, "### " a sub-heading,
// lines starting "- " make a bullet list and "1. " a numbered list.
// Links are written [text](/trucks) and only site paths or https:// URLs are allowed.

const LINK = /\[([^\]]+)\]\(((?:\/|https:\/\/)[^)\s]*)\)/g;

export function parseInline(text) {
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ text: match[1], href: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

export function parseBlogContent(content) {
  return String(content || '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (block.startsWith('### ')) return { type: 'h3', text: block.slice(4).trim() };
      if (block.startsWith('## ')) return { type: 'h2', text: block.slice(3).trim() };
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      if (lines.every((line) => line.startsWith('- '))) return { type: 'ul', items: lines.map((line) => line.slice(2)) };
      if (lines.every((line) => /^\d+\.\s/.test(line))) return { type: 'ol', items: lines.map((line) => line.replace(/^\d+\.\s+/, '')) };
      return { type: 'p', text: block };
    });
}

// Plain text with link markup removed, for meta descriptions and excerpts.
export function plainBlogText(content) {
  return String(content || '').replace(LINK, '$1').replace(/^#{2,3}\s+/gm, '').replace(/^(?:-|\d+\.)\s+/gm, '');
}

// Minutes to read at about 220 words a minute.
export function readingMinutes(content) {
  const words = plainBlogText(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
