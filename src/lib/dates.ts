const pubDateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatPubDate(date: Date): string {
  return pubDateFormat.format(date);
}

export function pubDateTimeAttr(date: Date): string {
  return date.toISOString().slice(0, 10);
}
