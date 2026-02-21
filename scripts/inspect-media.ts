import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mediaId = process.argv[2];
  if (!mediaId) {
    console.error("Please provide a media ID");
    return;
  }

  const item = await prisma.media.findUnique({
    where: { id: mediaId },
    include: { folder: true },
  });

  console.log("Media Item Details:");
  console.log(JSON.stringify(item, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
