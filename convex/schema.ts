import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    workosUserId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    organizationId: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index('by_workos_user_id', ['workosUserId'])
    .index('by_organization_id', ['organizationId']),
});
