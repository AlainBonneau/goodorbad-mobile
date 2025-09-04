// prisma/seed.ts
import { PrismaClient, CardType } from "@prisma/client";
import cards from "./seedCards.json";

const prisma = new PrismaClient();

async function main() {
  // Nettoyage (dev uniquement)
  await prisma.cardTemplate.deleteMany();

  await prisma.cardTemplate.createMany({
    data: cards.good.map((c) => ({
      type: CardType.GOOD,
      ...c,
    })),
  });

  await prisma.cardTemplate.createMany({
    data: cards.bad.map((c) => ({
      type: CardType.BAD,
      ...c,
    })),
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
