import { Router, ok, notFound } from "https://ghuc.cc/tunnckoCore/urlpattern-router/index.js";

const router = new Router(/* { baseURL: 'https://my-app-example.com' } */);

// ok(body) - helper for `new Response(body, { status: 200, statusText: 'OK' })`
// notFound(body) - for 404
// json({ some: 123 }) - for json responses

router
	.get("/", () => ok("Homepage hehe!"))
	.get("/item/:id", (req, { params }) => ok(`Matching id: ${params.id}`))
	.get("/api/hello", () => json({ hello: "world" }))
	.get("/api/hi/:name", (req, { params: { name } }) => json({ hi: name }));

// there is `router.fetch` method that's why this short-hand works
// CloudFlare Workers accepts `fetch(request, env, ctx)`
export default router;
