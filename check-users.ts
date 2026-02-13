import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkUsers() {
  try {
    console.log("Checking users in database...\n");

    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`);
    users.forEach((u) => {
      console.log(
        `  - Email: ${u.email}, Password: ${u.password}, Role: ${u.role}`,
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkUsers();
