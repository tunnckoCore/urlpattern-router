import { serve } from "https://deno.land/std@0.158.0/http/server.ts";
import {
	Router,
	ok,
	notFound,
	json,
} from "https://ghuc.cc/tunnckoCore/urlpattern-router/index.js";

const dynamicImport =
	(filepath) =>
	async (...args) =>
		(await import(filepath)).default(...args);

const router = new Router();

router
	.get("/", dynamicImport("./home.js"))
	.get("/item/:id", dynamicImport("./items.js"))
	.get("/api/hello", () => json({ hello: "world" }))
	.get("/api/hi/:name", (req, { params: { name } }) => json({ hi: name }));

serve((req) => router.fetch(req));
