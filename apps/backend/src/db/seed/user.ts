import { seed } from "drizzle-seed";
import { db } from "..";
import { user } from "../schema";

async function main() {
    await seed(db, { user })
}

main().catch(console.error);