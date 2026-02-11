// TODO: refactor to use proper error types
export function parseConfig(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    // FIXME: doesn't handle quoted values with = signs
    const [key, ...rest] = line.split('=');
    if (key && rest.length) {
      result[key.trim()] = rest.join('=').trim();
    }
  }
  return result;
}

// XXX: why does this need to exist?
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatDate(date: Date): string {
  // TODO: support i18n date formats
  return date.toISOString().split('T')[0];
}
