import { PrismaClient, CardType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // On vide la table avant (évite doublons pendant le dev)
  await prisma.cardTemplate.deleteMany();

  await prisma.cardTemplate.createMany({
    data: [
      // Cartes GOOD
      {
        type: CardType.GOOD,
        label: "Aujourd'hui, une bonne surprise t'attend 🍀",
        intensity: 3,
        tags: ["chance", "surprise"],
        locale: "fr-FR",
      },
      {
        type: CardType.GOOD,
        label: "Une rencontre agréable va égayer ta journée 🌞",
        intensity: 2,
        tags: ["social", "positif"],
        locale: "fr-FR",
      },

      // Cartes BAD
      {
        type: CardType.BAD,
        label: "Attention à ne pas oublier un rendez-vous important ⏳",
        intensity: 2,
        tags: ["attention", "rappel"],
        locale: "fr-FR",
      },
      {
        type: CardType.BAD,
        label: "Tu pourrais croiser un imprévu désagréable... reste calme 😐",
        intensity: 3,
        tags: ["imprévu", "patience"],
        locale: "fr-FR",
      },
    ],
  });

  console.log("✅ Cartes initiales insérées !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
