import { GenericQueryCtx } from 'convex/server';

import { DataModel } from '../_generated/dataModel';

export async function requireIdentity(ctx: GenericQueryCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error('Authentication required');
  }

  return identity;
}

export function requireMatchingOrganization(
  identityOrganizationId: string | undefined,
  requestedOrganizationId: string,
) {
  if (!identityOrganizationId || identityOrganizationId !== requestedOrganizationId) {
    throw new Error('Tenant mismatch');
  }
}

export function getIdentityOrganizationId(identity: Awaited<ReturnType<typeof requireIdentity>>) {
  const organizationId = identity.organization_id ?? identity.org_id;
  return typeof organizationId === 'string' ? organizationId : undefined;
}
