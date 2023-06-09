// SPDX-License-Identifier: Apache-2.0

export type RouteHandlerContext = {
  request: Request;
  url: URL;
  baseURL: string;
  method: string;
  pathname: string;
  searchParams: URLSearchParams;
  headers: Headers;
  query: Record<string, string | string[] | undefined>;
  next: () => Promise<Response | undefined>;
  params: Record<string, string | any>;
  match: URLPatternResult | null;
  proxy?: Request;
  route: {
    method: string;
    route: string | RoutePattern;
    handlers: RouteHandler[];
    pattern: URLPattern;
  };
};

export type RouteHandler = (
  context: RouteHandlerContext,
  ...args: any[]
) => any | Response | Promise<any | Response>;

export type RoutePattern = string | URL | URLPattern;
export type RouteEntry = [string, RoutePattern, ...RouteHandler[]];

export type RequestLike = {
  href?: string;
} & Request;

export type RouteMethod = <T extends URLPatternRouter>(
  route: RoutePattern,
  ...handlers: RouteHandler[]
) => T;

export class URLPatternRouter {
  baseURL: string | undefined;
  routes: RouteEntry[];

  get: RouteMethod;
  post: RouteMethod;
  put: RouteMethod;
  delete: RouteMethod;
  patch: RouteMethod;
  options: RouteMethod;
  all: RouteMethod;

  /**
   * Create a new Router, optionally pre-fill the routes.
   * The `baseURL` is used to create a new URL instance, so it can work properly
   * with Node, Deno, Netlify, Cloudflare, and the Browser.
   *
   * @param {Route[]} routes - pre-fill the routes to be used
   * @param {string} baseURL - the base URL to be used, defaults to `url.origin`
   */
  constructor(routes?: RouteEntry[], baseURL?: string) {
    this.routes = routes || [];
    this.baseURL = baseURL;

    ["get", "post", "put", "delete", "patch", "options", "all"].map(
      (method) => {
        this[method] = (
          route: RoutePattern,
          ...handlers: RouteHandler[]
        ): URLPatternRouter => {
          this.routes.push([method.toUpperCase(), route, ...handlers.flat()]);
          return this;
        };
      }
    );
  }

  /**
   * Add a new route to the router.
   * Similar to the HTTP's method methods like `.get`, `.post`, etc.
   * It can also be used to add the routes of another router to this router,
   * for example, to add a prefix to all the routes of the other router.
   *
   * @param {string} prefix - the prefix to be added to the route
   * @param {URLPatternRouter|Handler} router - the router to be used or `...handlers`
   * @param  {...any} args - handlers, if it's used as methods like `.get`, `.post`, etc
   * @returns
   */

  use(...handlers: RouteHandler[]);
  use(prefix: string | RouteHandler, ...handlers: RouteHandler[]);
  use(prefix: string | RouteHandler, router: URLPatternRouter);
  use(
    prefix: string | RouteHandler,
    router: URLPatternRouter | RouteHandler,
    ...args: RouteHandler[]
  ) {
    if (router instanceof URLPatternRouter) {
      router.routes.map(([method, route, ...handlers]) =>
        this.routes.push([method, (prefix as string) + route, ...handlers])
      );
    } else if (typeof prefix !== "string") {
      const handlers = [prefix, router, ...args].flat().filter(Boolean);
      this.routes.push(["*", "", ...handlers]);
    } else {
      this.routes.push(["*", prefix, ...[router, ...args].flat()]);
    }

    return this;
  }

  /**
   * Handle a request, and call the handlers of the first matching route.
   * It can accept Node's Request (which is non Web Request), Cloudflare's Request,
   * Deno's Request, and you can also pass just `window.location` if you use in it the browser.
   *
   * For usage in the browser you can also do `router.handle(new Request(new URL(window.location.href)))`.
   *
   * @param {Request} request - the request, or object with `url` and `method` properties
   * @param {object} context - the context object, contains `params`, `query`, and more.
   * @param  {...any} args - additional arguments to be passed to the handlers
   */
  async handle(request: RequestLike, ...args: any[]) {
    const that = this;
    // handle Node, Cloudflare, Deno, and the Browser

    // Note 1: Node does not have standard URL on the req.url,
    // but we force setting baseURL here, so it's fixed.
    // Could be fixed more elegantly with passing `http://${req.headers.host}`,
    // but we recommend using the nodejsPatches middleware instead, so this stays clean.

    // Note 2: to work as Browser router, we just fallback to .href,
    // where we are assuming you pass window.location
    let url = new URL(request.url || request.href!, `http://s`);

    // use Object.create so query params like toString=123 work properly
    const query = Object.create(null);
    const context: RouteHandlerContext = Object.create(null);
    const reqMethod = request.method.toUpperCase();

    context.url = url;
    context.request = request;

    context.baseURL = that.baseURL || url.origin;
    context.method = reqMethod;
    context.pathname = context.url.pathname;
    context.searchParams = context.url.searchParams;
    context.headers = context.request.headers;

    for (let [k, v] of context.url.searchParams) {
      query[k] = query[k] === undefined ? v : [query[k], v].flat();
    }
    context.query = query;

    for (let [method, route, ...handlers] of that.routes) {
      // we are making a URLPattern here and not above in the method calling
      // becase here we are able to handle the pre-defined routes,
      // if any, to the Router constructor
      const pattern = new URLPattern(route, context.baseURL);
      context.route = { method, route, handlers, pattern };

      if (
        ((method.toUpperCase() === reqMethod || context.method === "ALL") &&
          (context.match = pattern.exec(context.pathname, context.baseURL))) ||
        method === "*"
      ) {
        context.params = context.match?.pathname?.groups || {};

        let i = 0;
        for await (const handler of handlers) {
          // allow calling the next middleware in the chain
          async function next(idx: number) {
            context.next = async () => next(idx + 2); // TODO: 2 or 1 here?! erm...
            return handlers[idx + 1]?.(context, ...args);
          }

          context.next = async () => next(i);
          const resp = await handler(context, ...args);

          i += 1;
          if (resp !== undefined) {
            return resp;
          }
        }
      }
    }
  }
}
