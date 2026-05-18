import { httpRouter } from 'convex/server';

import { exchangeCode, refreshToken } from './workos';

const http = httpRouter();

http.route({
  path: '/auth/workos/exchange',
  method: 'POST',
  handler: exchangeCode,
});

http.route({
  path: '/auth/workos/refresh',
  method: 'POST',
  handler: refreshToken,
});

http.route({
  path: '/auth/workos/exchange',
  method: 'OPTIONS',
  handler: exchangeCode,
});

http.route({
  path: '/auth/workos/refresh',
  method: 'OPTIONS',
  handler: refreshToken,
});

export default http;
