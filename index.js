// SPDX-License-Identifier: Apache-2.0

/**
 * Note: mkResponse(), ok(), and notFound(), are inlined here from `@worker-tools/response-creators`
 */

export const mkResponse =
  (status, statusText) =>
  (body = null, init = {}) =>
    new Response(body, {
      ...init,
      status,
      statusText,
    });

export const json = (data) =>
  mkResponse(200, "OK")(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
  });

export const ok = mkResponse(200, "OK");
export const notFound = mkResponse(404, "Not Found");

export class Router {
  constructor(options = {}) {
    this._routes = [];
    this._options = { baseURL: "http://example.com", ...options };
  }

  clear() {
    this._routes = [];
    return this;
  }

  addRoute(pattern, handler) {
    // TODO: support array of function handlers
    if (typeof handler !== "function") {
      throw new Error(".addRoute: expect `handler` to be a function");
    }

    const options = this._options;

    if (pattern instanceof URLPattern) {
      this._routes.push({ pattern, handler, options });
      return this;
    }

    const pattrn = pattern || "*";

    if (typeof pattrn === "string" || typeof pattrn === "object") {
      this._routes.push({
        pattern:
          typeof pattrn === "string"
            ? new URLPattern(pattrn, options.baseURL)
            : new URLPattern(pattrn),

        handler,
        options,
      });
    }

    return this;
  }

  match(url, method, request) {
    // const { url, method } = request || { url: "/", method: "*" };

    if (!(url instanceof URL)) {
      url = url.startsWith("/")
        ? new URL(`http://localhost${url}`)
        : new URL(url);
    }

    for (const route of this._routes) {
      const { pattern, handler, options } = route;

      if (options.method && options.method !== method) continue;

      const matched = pattern.exec(url.pathname, options.baseURL);
      if (matched) {
        return {
          url,
          route,
          method,
          handler,
          request,
          pathname: matched.pathname.input, // same as `url.pathname`
          params: matched.pathname.groups,
          groups: matched.pathname.groups,
          ctx: { ...this._options.ctx, ...this._options.context },
        };
      }
    }

    return null;
  }

  matchRequest(request) {
    return this.match(request.url, request.method);
  }

  handle(request, options = {}) {
    const match = this.match(request.url, request.method);
    if (!match) return null;

    const env = { ...options.env };
    const ctx = { ...options.ctx };
    const connInfo = options.connInfo;

    const context = { ...match, request, connInfo, env, ctx };
    const asyncHandlerWrapper = async (...args) => {
      return match.handler(...args);
    };

    const handlerPromise = asyncHandlerWrapper(request, context);

    return { handlerPromise, match: context, request, env, ctx, connInfo };
  }

  // cloudflare & more standard ones
  fetch(request, env, ctx) {
    const result = this.handle(request, { env, ctx });

    if (!result) {
      const url = new URL(request.url);
      return new Promise((resolve) =>
        resolve(
          notFound(`Route Not Found: \`${url.pathname}\` (${request.url})`)
        )
      );
    }

    return result.handlerPromise;
  }

  all(pattern, handler, options) {
    return this.addRoute(pattern, handler, { ...options, method: "" });
  }
  any(pattern, handler, options) {
    return this.addRoute(pattern, handler, { ...options, method: "*" });
  }
  get(pattern, handler, options) {
    return this.addRoute(pattern, handler, { ...options, method: "GET" });
  }
  post(pattern, handler, options) {
    return this.addRoute(pattern, handler, { ...options, method: "POST" });
  }
  put(pattern, handler, options) {
    return this.addRoute(pattern, handler, { ...options, method: "PUT" });
  }
  patch(pattern, handler, options) {
    return this.addRoute(pattern, handler, { ...options, method: "PATCH" });
  }
  delete(pattern, handler, options) {
    return this.addRoute(pattern, handler, { ...options, method: "DELETE" });
  }
  head(pattern, handler, options) {
    return this.addRoute(pattern, handler, { ...options, method: "HEAD" });
  }
  options(pattern, handler, options) {
    return this.addRoute(pattern, handler, { ...options, method: "OPTIONS" });
  }
}
