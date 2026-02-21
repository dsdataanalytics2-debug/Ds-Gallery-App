import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const searchTerm = process.argv[2];
  if (!searchTerm) {
    console.error("Please provide a search term");
    return;
  }

  const media = await prisma.media.findMany({
    where: {
      fileName: {
        contains: searchTerm,
        mode: "insensitive",
      },
    },
  });

  console.log("Search Results:");
  console.log(JSON.stringify(media, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
