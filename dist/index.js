const c = (s, t = null, n = {}) => {
  const e = { ...n };
  if (
    ((e.status = e.status || 200),
    (e.statusText = e.statusText || 'OK'),
    t && typeof t === 'object')
  ) {
    const o = 'content-type';
    return (
      (e.headers[o] = e.headers[o] || 'application/json'),
      new Response(JSON.stringify(t), e)
    );
  }
  return new Response(t, e);
};
const m =
  (s, t) =>
  (n = null, e = {}) =>
    c(s, n, e);
const l = (s = null, t = {}) => c(200, s, t);
const R = (s = {}, t = {}) => c(200, s, t);
const d = (s = null, t = {}) => c(404, s, { ...t, statusText: 'Not Found' });
class f {
  constructor(t = {}) {
    (this._routes = []),
      (this._options = { baseURL: 'http://example.com', ...t });
  }

  clear() {
    return (this._routes = []), this;
  }

  addRoute(t, n) {
    if (typeof n !== 'function')
      throw new Error('.addRoute: expect `handler` to be a function');
    const e = this._options;
    if (t instanceof URLPattern)
      return this._routes.push({ pattern: t, handler: n, options: e }), this;
    const o = t || '*';
    return (
      (typeof o === 'string' || typeof o === 'object') &&
        this._routes.push({
          pattern:
            typeof o === 'string'
              ? new URLPattern(o, e.baseURL)
              : new URLPattern(o),
          handler: n,
          options: e,
        }),
      this
    );
  }

  match(t, n, e) {
    t instanceof URL ||
      (t = t.startsWith('/') ? new URL(`http://localhost${t}`) : new URL(t));
    for (const o of this._routes) {
      const { pattern: r, handler: a, options: h } = o;
      if (h.method && h.method !== n) continue;
      const u = r.exec(t.pathname, h.baseURL);
      if (u)
        return {
          url: t,
          route: o,
          method: n,
          handler: a,
          request: e,
          pathname: u.pathname.input,
          params: u.pathname.groups,
          groups: u.pathname.groups,
          ctx: { ...this._options.ctx, ...this._options.context },
        };
    }
    return null;
  }

  matchRequest(t) {
    return this.match(t.url, t.method);
  }

  handle(t, n = {}) {
    const e = this.match(t.url, t.method);
    if (!e) return null;
    const o = { ...n.env };
    const r = { ...n.ctx };
    const a = n.connInfo;
    const h = { ...e, request: t, connInfo: a, env: o, ctx: r };
    return {
      handlerPromise: (async (...i) => e.handler(...i))(t, h),
      match: h,
      request: t,
      env: o,
      ctx: r,
      connInfo: a,
    };
  }

  fetch(t, n, e) {
    const o = this.handle(t, { env: n, ctx: e });
    if (!o) {
      const r = new URL(t.url);
      return new Promise((a) =>
        a(d(`Route Not Found: \`${r.pathname}\` (${t.url})`)),
      );
    }
    return o.handlerPromise;
  }

  all(t, n, e) {
    return this.addRoute(t, n, { ...e, method: '' });
  }

  any(t, n, e) {
    return this.addRoute(t, n, { ...e, method: '*' });
  }

  get(t, n, e) {
    return this.addRoute(t, n, { ...e, method: 'GET' });
  }

  post(t, n, e) {
    return this.addRoute(t, n, { ...e, method: 'POST' });
  }

  put(t, n, e) {
    return this.addRoute(t, n, { ...e, method: 'PUT' });
  }

  patch(t, n, e) {
    return this.addRoute(t, n, { ...e, method: 'PATCH' });
  }

  delete(t, n, e) {
    return this.addRoute(t, n, { ...e, method: 'DELETE' });
  }

  head(t, n, e) {
    return this.addRoute(t, n, { ...e, method: 'HEAD' });
  }

  options(t, n, e) {
    return this.addRoute(t, n, { ...e, method: 'OPTIONS' });
  }
}
export {
  f as Router,
  R as json,
  m as mkResponse,
  d as notFound,
  l as ok,
  c as send,
};
