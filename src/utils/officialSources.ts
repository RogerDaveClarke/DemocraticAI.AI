export function toPublicOfficialSourceUrl(uri?: string): string | undefined {
  if (!uri) return undefined;

  const debateMatch = uri.match(/^https:\/\/data\.oireachtas\.ie\/akn\/ie\/debateRecord\/(dail|seanad)\/(\d{4}-\d{2}-\d{2})\/debate\/main$/i);
  if (debateMatch) return `https://www.oireachtas.ie/en/debates/debate/${debateMatch[1].toLowerCase()}/${debateMatch[2]}/`;

  const questionMatch = uri.match(/^https:\/\/data\.oireachtas\.ie\/ie\/oireachtas\/question\/(\d{4}-\d{2}-\d{2})\/pq_(\d+)$/i);
  return questionMatch
    ? `https://www.oireachtas.ie/en/debates/question/${questionMatch[1]}/${questionMatch[2]}/`
    : uri;
}