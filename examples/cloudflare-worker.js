import { Router, ok, notFound, json } from '../index.js';

// const router = new Router(/* { baseURL: 'https://my-app-example.com' } */);
const router = new Router();

// ok(body) - helper for `new Response(body, { status: 200, statusText: 'OK' })`
// notFound(body) - for 404

router
  .get('/', () => ok('Homepage hehe!'))
  .get('/item/:id', (req, { params, baseUrl, ...restContext }) => {
    const { host, protocol } = new URL(req.url);
    const actualBaseUrl = `${protocol}//${host}`;

    const parts = [
      `Matching id: ${params.id}`,
      `BaseURL set: ${baseUrl}`,
      `BaseURL actual: ${actualBaseUrl}`,
      `Actual url: ${req.url}`,
      JSON.stringify({ params, ...restContext }, null, 2),
    ];

    return ok(parts.join('\n'));
  })
  .get('/api/hello', () => json({ hello: 'world' }))
  .get('/api/hi/:name', (req, { params: { name } }) => json({ hi: name }));

// there is `router.fetch` method that's why this short-hand works
// CloudFlare Workers accepts `fetch(request, env, ctx)`
export default router;
