import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log("DB_USERS:", JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error listing users:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
