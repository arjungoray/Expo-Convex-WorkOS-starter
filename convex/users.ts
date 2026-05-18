import { v } from 'convex/values';

import { internalMutation, query } from './_generated/server';
import {
  getIdentityOrganizationId,
  requireIdentity,
  requireMatchingOrganization,
} from './lib/auth';

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const workosUserId = identity.subject;
    const profile = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', workosUserId))
      .unique();
    const identityOrganizationId = getIdentityOrganizationId(identity);

    if (profile?.organizationId && identityOrganizationId) {
      requireMatchingOrganization(identityOrganizationId, profile.organizationId);
    }

    return {
      identity,
      profile,
    };
  },
});

export const upsertFromWorkOS = internalMutation({
  args: {
    workosUserId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', args.workosUserId))
      .unique();

    const patch = {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      organizationId: args.organizationId,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert('users', {
      workosUserId: args.workosUserId,
      ...patch,
    });
  },
});
