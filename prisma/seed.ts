import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const columnTypes = [
    {
      id: 'TXT',
      name: 'text',
      displayName: 'Single line text',
      description: 'Text field for single line input'
    },
    {
      id: 'NUM',
      name: 'number',
      displayName: 'Number',
      description: 'Numeric field for integer and decimal values'
    }
  ];

  for (const columnType of columnTypes) {
    await prisma.columnType.upsert({
      where: { id: columnType.id },
      update: columnType,
      create: columnType,
    });
    console.log(`Column type '${columnType.displayName}' (${columnType.id}) created/updated`);
  }

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });