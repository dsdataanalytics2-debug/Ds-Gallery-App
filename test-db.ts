import prisma from "@/lib/prisma";

async function testConnection() {
  try {
    console.log("Testing database connection...");

    // Test connection
    await prisma.$connect();
    console.log("✅ Database connected successfully!");

    // Try to count folders
    const count = await prisma.folder.count();
    console.log(`✅ Found ${count} folders in database`);

    // Try to create a test folder
    const testFolder = await prisma.folder.create({
      data: {
        name: "Test Connection Folder",
        description: "Testing database connection",
        productCategory: "NatureCure",
        tags: ["test"],
      },
    });
    console.log("✅ Successfully created test folder:", testFolder);

    // Clean up - delete the test folder
    await prisma.folder.delete({
      where: { id: testFolder.id },
    });
    console.log("✅ Successfully deleted test folder");
  } catch (error) {
    console.error("❌ Database error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
