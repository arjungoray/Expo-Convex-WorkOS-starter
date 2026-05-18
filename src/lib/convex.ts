import { ConvexReactClient } from 'convex/react';

import { publicEnv } from '@/lib/env';

export const convex = new ConvexReactClient(publicEnv.convexUrl, {
  unsavedChangesWarning: false,
});
