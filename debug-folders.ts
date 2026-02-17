// @ts-nocheck
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Checking Folders in DB...");
  const folders = await prisma.folder.findMany();
  console.log(`Total Folders: ${folders.length}`);
  folders.forEach((f) => {
    console.log(
      `- [${f.id}] "${f.name}" (parentId: ${f.parentId}, typeof parentId: ${typeof f.parentId})`,
    );
  });

  console.log("\nChecking Root Folders (parentId: null)...");
  const roots = await prisma.folder.findMany({
    where: { parentId: null },
  });
  console.log(`Root Folders found: ${roots.length}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
