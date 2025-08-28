// prisma/seed.ts
import { PrismaClient, CardType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Nettoyage (dev only)
  await prisma.cardTemplate.deleteMany();

  await prisma.cardTemplate.createMany({
    data: [
      // ---------- GOOD (15) ----------
      {
        type: CardType.GOOD,
        label: "Aujourd'hui, une bonne surprise t'attend 🍀",
        intensity: 3,
        tags: ["chance", "surprise"],
        locale: "fr-FR",
        weight: 1.1,
      },
      {
        type: CardType.GOOD,
        label: "Une rencontre agréable va égayer ta journée 🌞",
        intensity: 2,
        tags: ["social", "positif"],
        locale: "fr-FR",
      },
      {
        type: CardType.GOOD,
        label: "Un message que tu espérais enfin arrive 📩",
        intensity: 3,
        tags: ["communication", "attente"],
        locale: "fr-FR",
      },
      {
        type: CardType.GOOD,
        label: "Un petit coup de chance au moment parfait ✨",
        intensity: 2,
        tags: ["hasard", "timing"],
        locale: "fr-FR",
        weight: 1.2,
      },
      {
        type: CardType.GOOD,
        label:
          "Tu vas apprendre quelque chose d'utile sans t'en rendre compte 🧠",
        intensity: 2,
        tags: ["apprentissage", "développement"],
        locale: "fr-FR",
      },
      {
        type: CardType.GOOD,
        label: "Un proche te soutient exactement quand tu en as besoin 🤝",
        intensity: 4,
        tags: ["famille", "ami·e·s", "soutien"],
        locale: "fr-FR",
      },
      {
        type: CardType.GOOD,
        label: "Tu termines une tâche qui traînait depuis longtemps ✅",
        intensity: 3,
        tags: ["productivité", "focus"],
        locale: "fr-FR",
      },
      {
        type: CardType.GOOD,
        label: "Un imprévu positif te fait gagner du temps ⏱️",
        intensity: 2,
        tags: ["organisation", "efficacité"],
        locale: "fr-FR",
      },
      {
        type: CardType.GOOD,
        label: "Quelqu’un remarque ton travail et le valorise 👏",
        intensity: 4,
        tags: ["reconnaissance", "travail"],
        locale: "fr-FR",
        weight: 1.15,
      },
      {
        type: CardType.GOOD,
        label: "Une opportunité discrète mais prometteuse se présente 🌱",
        intensity: 3,
        tags: ["opportunité", "avenir"],
        locale: "fr-FR",
      },
      {
        type: CardType.GOOD,
        label: "Tu retrouves un objet que tu pensais perdu 🔎",
        intensity: 2,
        tags: ["quotidien", "chance"],
        locale: "fr-FR",
      },
      {
        type: CardType.GOOD,
        label: "Tu vas rire de bon cœur aujourd’hui 😂",
        intensity: 2,
        tags: ["humeur", "bien-être"],
        locale: "fr-FR",
      },
      {
        type: CardType.GOOD,
        label: "Une porte se ferme, une meilleure s’ouvre immédiatement 🚪➡️",
        intensity: 4,
        tags: ["changement", "alignement"],
        locale: "fr-FR",
      },
      {
        type: CardType.GOOD,
        label: "Tu reçois une mini-bonne nouvelle côté finances 💶",
        intensity: 2,
        tags: ["argent", "budget"],
        locale: "fr-FR",
      },
      {
        type: CardType.GOOD,
        label: "Ton énergie est stable et claire toute la journée 🔋",
        intensity: 3,
        tags: ["énergie", "équilibre"],
        locale: "fr-FR",
      },

      // ---------- BAD (15) ----------
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
      {
        type: CardType.BAD,
        label: "Un contretemps te met en retard — anticipe 🚌",
        intensity: 2,
        tags: ["retard", "transport"],
        locale: "fr-FR",
      },
      {
        type: CardType.BAD,
        label: "Petite tension avec quelqu’un : choisis tes mots 🗣️",
        intensity: 3,
        tags: ["conflit", "communication"],
        locale: "fr-FR",
        weight: 1.1,
      },
      {
        type: CardType.BAD,
        label: "Une dépense imprévue risque de grignoter ton budget 💸",
        intensity: 3,
        tags: ["argent", "budget", "attention"],
        locale: "fr-FR",
      },
      {
        type: CardType.BAD,
        label: "Un appareil ou un outil peut te lâcher au mauvais moment 🧰",
        intensity: 2,
        tags: ["tech", "panne", "imprévu"],
        locale: "fr-FR",
      },
      {
        type: CardType.BAD,
        label: "Tu risques de te disperser : une chose à la fois 🧩",
        intensity: 2,
        tags: ["focus", "organisation"],
        locale: "fr-FR",
      },
      {
        type: CardType.BAD,
        label:
          "Un commentaire injuste peut te toucher — ne le laisse pas te définir 🛡️",
        intensity: 4,
        tags: ["émotions", "confiance"],
        locale: "fr-FR",
      },
      {
        type: CardType.BAD,
        label: "Tu pourrais perdre du temps sur un détail inutile ⌛",
        intensity: 2,
        tags: ["productivité", "perfectionnisme"],
        locale: "fr-FR",
      },
      {
        type: CardType.BAD,
        label:
          "Une opportunité peut sembler intéressante mais cache un piège 🎭",
        intensity: 4,
        tags: ["prudence", "choix"],
        locale: "fr-FR",
        weight: 1.05,
      },
      {
        type: CardType.BAD,
        label: "Risque de quiproquo par message : clarifie avant de réagir 📱",
        intensity: 2,
        tags: ["communication", "malentendu"],
        locale: "fr-FR",
      },
      {
        type: CardType.BAD,
        label: "Tu pourrais oublier quelque chose d’essentiel en sortant 🧳",
        intensity: 2,
        tags: ["mémoire", "checklist"],
        locale: "fr-FR",
      },
      {
        type: CardType.BAD,
        label:
          "Un petit coup au moral possible — prévois une pause pour souffler 🌫️",
        intensity: 3,
        tags: ["humeur", "bien-être"],
        locale: "fr-FR",
      },
      {
        type: CardType.BAD,
        label: "Quelqu’un peut sous-estimer ton travail — garde des preuves 📎",
        intensity: 4,
        tags: ["travail", "reconnaissance", "défense"],
        locale: "fr-FR",
      },
      {
        type: CardType.BAD,
        label: "Tu risques de dire oui à trop de choses : pose une limite 🚧",
        intensity: 3,
        tags: ["limites", "priorités"],
        locale: "fr-FR",
      },
    ],
  });

  console.log("✅ 30 cartes insérées (15 GOOD / 15 BAD) !");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
