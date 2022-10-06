import { ok } from 'https://ghuc.cc/tunnckoCore/urlpattern-router/index.js';

export default async (req, { params }) => ok(`Matching id: ${params.id}`);
