import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkDatabase() {
  try {
    console.log("Checking database...\n");

    // Check folders
    const folders = await prisma.folder.findMany();
    console.log(`Found ${folders.length} folders:`);
    folders.forEach((f) => {
      console.log(
        `  - ${f.name} (ID: ${f.id}, Category: ${f.productCategory})`,
      );
    });

    // Check media
    const media = await prisma.media.findMany();
    console.log(`\nFound ${media.length} media items:`);
    media.forEach((m) => {
      console.log(
        `  - ${m.fileName} (Type: ${m.fileType}, Folder: ${m.folderId})`,
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkDatabase();
