import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function debug() {
  console.log("Listing all GoogleAccounts:");

  try {
    const accounts = await prisma.googleAccount.findMany({
      select: {
        id: true,
        email: true,
        updatedAt: true,
        isActive: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    console.log(JSON.stringify(accounts, null, 2));
  } catch (err) {
    console.error("DEBUG CRASH:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

debug();
