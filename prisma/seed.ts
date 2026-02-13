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
    const admin = await prisma.user.upsert({
      where: { email: "admin@dsgallery.com" },
      update: {},
      create: {
        email: "admin@dsgallery.com",
        password: "password123", // In real app, this should be hashed
        name: "Admin User",
        role: "admin",
      },
    });

    console.log("Seed admin user created:", admin.email);
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
