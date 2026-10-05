/** Public, build-time factory link. Provider credentials never belong here. */
export function factoryLoginUrl(value?: string): string | null {
  if (!value?.trim()) return 'http://127.0.0.1:8000/web/login';
  try {
    const url = new URL(value.trim());
    const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback))
      || url.username || url.password || url.search || url.hash) return null;
    if (url.pathname === '/') url.pathname = '/web/login';
    return url.href;
  } catch { return null; }
}
