# urlpattern-router

> Router based on [URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) Web Specification, _in 150 lines_ and used in Production!

> An **isomorphic router** for **@denoland**, **@nodejs** (probably), **@cloudflare**, Browsers, or anything that has support for it!

See the examples. Briefly, the basic stuff of a router, LOL.

**Note:** You can also somehow import [urlpattern-polyfill](https://unpkg.com/urlpattern-polyfill) for environments that don't have it yet - Deno, Deno Deploy, and Cloudflare does.

```js
// Cloudflare or others
import { Router, json, ok, notFound } from "urlpattern-router";

// Or Deno: `https://ghuc.cc/tunnckoCore/urlpattern-router/index.js`
// import { Router, json, ok, notFound } from "urlpattern-router";

const router = new Router({ baseURL: "http://some-domain.com" });

router
	.get("/", async () => new Response("Homepage hehe!"))
	.get("/item/:id", (req, { params }) => ok(`Matching id: ${params.id}`))
	.get("/api/hello", () => json({ hello: "world" }))
	.get("/api/hi/:name", (req, { params: { name } }) => json({ hi: name }));

// or router._routes
console.log(router);
```

### by request method

- router.all
- router.any
- router.get
- router.post
- router.put
- router.patch
- router.delete
- router.head
- router.options

### handling

- router.addRoute - used internally for above methods
- router.match
- router.matchRequest
- router.handle - calls the handler for matching route
- router.fetch - useful for Cloudflare Workers
- router.clear - clear routes
