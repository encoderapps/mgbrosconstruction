const MAX_CODE_POINT = 0x10ffff;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Decodes HTML entities (&quot;, &amp;, &#39;, &#x27; …) as Salesforce returns them in some fields. */
export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const isHex = entity[1] === 'x' || entity[1] === 'X';
      const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      // fromCodePoint throws past U+10FFFF; leave such entities as they are.
      return code <= MAX_CODE_POINT ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/** Rich-text field (e.g. "<p>Duct work 1st floor</p>") → plain text, keeping line breaks between blocks. */
export function htmlToPlainText(html: string): string {
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '');
  return decodeHtmlEntities(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}
