const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log(
    "Prisma Client Models:",
    Object.keys(prisma).filter((k) => !k.startsWith("_")),
  );

  // Try lowercase 'folder' first, then TitleCase 'Folder' if needed
  const delegate = prisma.folder || prisma.Folder;
  if (!delegate) {
    console.error(
      "Could not find 'folder' or 'Folder' model on Prisma Client.",
    );
    return;
  }

  console.log("Checking Folders in DB...");
  const folders = await delegate.findMany();
  console.log(`Total Folders: ${folders.length}`);
  folders.forEach((f) => {
    // Check for null vs string 'null' vs undefined
    const parentType = f.parentId === null ? "NULL" : typeof f.parentId;
    const parentVal = f.parentId === null ? "null" : `"${f.parentId}"`;
    console.log(
      `- [${f.id}] "${f.name}" (parentId: ${parentVal} [${parentType}])`,
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
