import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const media = await prisma.media.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  console.log("Recent Media Storage Data:");
  console.table(
    media.map((m) => ({
      id: m.id,
      fileName: m.fileName,
      storageType: m.storageType,
      storageFileId: m.storageFileId,
      storagePath: m.storagePath,
    })),
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
