import { internal } from './_generated/api';
import { ActionCtx, httpAction } from './_generated/server';

type WorkOSUserResponse = {
  id: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
};

type WorkOSAuthResponse = {
  user: WorkOSUserResponse;
  organization_id?: string;
  access_token: string;
  refresh_token: string;
};

type SerializedAuthResponse = {
  accessToken: string;
  refreshToken: string;
  organizationId?: string;
  user: {
    id: string;
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
  };
};

function getApiKey() {
  const apiKey = process.env.WORKOS_API_KEY;

  if (!apiKey) {
    throw new Error('Missing WORKOS_API_KEY Convex environment variable');
  }

  return apiKey;
}

function getClientId() {
  const clientId = process.env.WORKOS_CLIENT_ID;

  if (!clientId) {
    throw new Error('Missing WORKOS_CLIENT_ID Convex environment variable');
  }

  return clientId;
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.WORKOS_ALLOWED_ORIGIN ?? '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      ...init?.headers,
    },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, { status });
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function authenticateWithWorkOS(body: Record<string, string | undefined>) {
  const response = await fetch('https://api.workos.com/user_management/authenticate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: getClientId(),
      client_secret: getApiKey(),
      ...body,
    }),
  });

  if (!response.ok) {
    console.error('workos_authenticate_failed', response.status, await response.text());
    throw new Error('WorkOS authentication request failed');
  }

  return (await response.json()) as WorkOSAuthResponse;
}

function serializeAuthResponse(response: WorkOSAuthResponse): SerializedAuthResponse {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    organizationId: response.organization_id,
    user: {
      id: response.user.id,
      email: response.user.email,
      firstName: response.user.first_name,
      lastName: response.user.last_name,
    },
  };
}

async function syncUser(ctx: ActionCtx, response: WorkOSAuthResponse) {
  await ctx.runMutation(internal.users.upsertFromWorkOS, {
    workosUserId: response.user.id,
    email: response.user.email ?? undefined,
    firstName: response.user.first_name ?? undefined,
    lastName: response.user.last_name ?? undefined,
    organizationId: response.organization_id ?? undefined,
  });
}

export const exchangeCode = httpAction(async (ctx, request) => {
  if (request.method === 'OPTIONS') {
    return jsonResponse(null);
  }

  const body = await readJson(request);
  const code = typeof body.code === 'string' ? body.code : undefined;
  const codeVerifier = typeof body.codeVerifier === 'string' ? body.codeVerifier : undefined;

  if (!code || !codeVerifier) {
    return errorResponse('Missing WorkOS authorization code or PKCE verifier');
  }

  try {
    const response = await authenticateWithWorkOS({
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      ip_address: request.headers.get('x-forwarded-for') ?? undefined,
      user_agent: request.headers.get('user-agent') ?? undefined,
    });

    await syncUser(ctx, response);
    return jsonResponse(serializeAuthResponse(response));
  } catch (error) {
    console.error('workos_exchange_failed', error);
    return errorResponse('WorkOS authorization failed', 401);
  }
});

export const refreshToken = httpAction(async (ctx, request) => {
  if (request.method === 'OPTIONS') {
    return jsonResponse(null);
  }

  const body = await readJson(request);
  const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : undefined;
  const organizationId = typeof body.organizationId === 'string' ? body.organizationId : undefined;

  if (!refreshToken) {
    return errorResponse('Missing WorkOS refresh token');
  }

  try {
    const response = await authenticateWithWorkOS({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      organization_id: organizationId,
      ip_address: request.headers.get('x-forwarded-for') ?? undefined,
      user_agent: request.headers.get('user-agent') ?? undefined,
    });

    await syncUser(ctx, response);
    return jsonResponse(serializeAuthResponse(response));
  } catch (error) {
    console.error('workos_refresh_failed', error);
    return errorResponse('WorkOS token refresh failed', 401);
  }
});
