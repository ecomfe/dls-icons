const ESCAPE_MAP = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '&': '&amp;',
}

export function escapeHTML(html) {
  return html.replace(/[<>"&]/g, (c) => ESCAPE_MAP[c] || c)
}
