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
  console.log("Starting data migration...");

  const allMedia = await prisma.media.findMany();
  console.log(`Found ${allMedia.length} media records.`);

  for (const media of allMedia) {
    const updateData: any = {};

    // Normalize storageType
    if (media.storageType === "google-drive") {
      updateData.storageType = "gdrive";
    } else if (media.storageType === "local" || !media.storageType) {
      updateData.storageType = "local";
    } else {
      updateData.storageType = media.storageType;
    }

    // Map storageFileId
    if (updateData.storageType === "gdrive") {
      updateData.storageFileId = media.publicId || "";
    } else {
      updateData.storageFileId = media.storagePath;
    }

    console.log(
      `Updating media ${media.id}: ${media.storageType} -> ${updateData.storageType}, storageFileId: ${updateData.storageFileId}`,
    );

    await prisma.media.update({
      where: { id: media.id },
      data: updateData,
    });
  }

  console.log("Migration complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
