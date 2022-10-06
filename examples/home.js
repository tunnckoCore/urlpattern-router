import { ok } from "https://ghuc.cc/tunnckoCore/urlpattern-router/index.js";

export default async () =>
	ok(await Deno.readTextFile("./examples/index.html"), {
		headers: { "content-type": "text/html" },
	});
