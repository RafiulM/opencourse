#!/usr/bin/env tsx

import "dotenv/config"
import { db } from "../src/db"
import { communities, communityMembers } from "../src/db/schema"
import { eq, sql } from "drizzle-orm"
import { CommunityService } from "../src/services/community"

/**
 * This script fixes member count inconsistencies in communities
 * by comparing the cached memberCount with the actual count of members
 * and updating any discrepancies.
 */

async function fixMemberCounts() {
  try {
    // Get all communities with their current member count
    const allCommunities = await db
      .select({
        id: communities.id,
        name: communities.name,
        slug: communities.slug,
        cachedMemberCount: communities.memberCount,
      })
      .from(communities)

    let fixedCount = 0
    let totalCount = 0

    for (const community of allCommunities) {
      totalCount++

      // Calculate the actual member count
      const actualMemberCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(communityMembers)
        .where(eq(communityMembers.communityId, community.id))

      const actualMemberCount = Number(actualMemberCountResult[0]?.count || 0)
      const cachedMemberCount = community.cachedMemberCount

      // If there's a discrepancy, update the cached count
      if (actualMemberCount !== cachedMemberCount) {
        await db
          .update(communities)
          .set({ memberCount: actualMemberCount })
          .where(eq(communities.id, community.id))
        fixedCount++
      } else {
      }
    }

    if (fixedCount === 0) {
    } else {
    }
  } catch (error) {
    console.error("❌ Error during reconciliation:", error)
    process.exit(1)
  }
}

// Run the reconciliation if this script is executed directly
if (require.main === module) {
  CommunityService.reconcileAllMemberCounts()
    .then((result) => {
      if (result.fixedCommunities === 0) {
      } else {
      }
      process.exit(0)
    })
    .catch((error) => {
      console.error("💥 Script failed:", error)
      process.exit(1)
    })
}

export { fixMemberCounts }
