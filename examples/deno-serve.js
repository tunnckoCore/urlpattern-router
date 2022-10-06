import { serve } from "https://deno.land/std@0.158.0/http/server.ts";
import { Router, ok, notFound } from "https://ghuc.cc/tunnckoCore/urlpattern-router/index.js";

const router = new Router(/* { optional: 'opts', baseURL: 'http://my-domain.info' } */);

router
	.get("/", () => ok("Homepage hehe!"))
	.get("/item/:id", (req, { params }) => ok(`Matching id: ${params.id}`));

serve((req, connInfo) => router.fetch(req /*, env, ctx or { connInfo }*/));