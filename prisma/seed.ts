import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Precios de ejemplo: ajústalos desde el panel de administración.
// Sin fotos: la web muestra una ilustración de estudio hasta que subas las tuyas.
const products = [
  {
    slug: "seiko-5-sports-gmt-ssk003k1",
    name: "5 Sports GMT",
    brand: "Seiko",
    reference: "SSK003K1",
    category: "GMT",
    price: 34900,
    stock: 3,
    featured: true,
    artwork: { style: "gmt", dial: "#121212", bezel: ["#2A2A2A", "#121212"] },
    description:
      "Un viajero nato. Segundo huso horario de lectura inmediata, bisel giratorio de 24 horas y un calibre automático que se alimenta del movimiento de tu muñeca. Robusto en el día a día, preciso cuando cruzas fronteras.",
    specs: {
      Movimiento: "Automático, calibre 4R34 con función GMT",
      Reserva: "41 horas",
      Caja: "42,5 mm, acero inoxidable",
      Cristal: "Hardlex",
      Hermeticidad: "100 m",
      Brazalete: "Acero inoxidable",
    },
  },
  {
    slug: "seiko-prospex-speedtimer-ssc911p1",
    name: "Prospex Speedtimer",
    brand: "Seiko",
    reference: "SSC911P1",
    category: "Cronógrafo",
    price: 59000,
    stock: 2,
    featured: true,
    artwork: { style: "chrono", dial: "#F3F0E7", bezel: ["#151515", "#151515"] },
    description:
      "Herencia de cronometraje deportivo en clave contemporánea. Esfera clara de alto contraste, tres contadores y carga por luz: cualquier fuente luminosa lo mantiene en marcha durante meses.",
    specs: {
      Movimiento: "Cronógrafo solar, calibre V192",
      Autonomía: "Hasta 6 meses con carga completa",
      Caja: "39 mm, acero inoxidable",
      Cristal: "Zafiro",
      Hermeticidad: "100 m",
      Brazalete: "Acero inoxidable",
    },
  },
  {
    slug: "seiko-5-sports-gmt-ssk035k1",
    name: "5 Sports GMT",
    brand: "Seiko",
    reference: "SSK035K1",
    category: "GMT",
    price: 38900,
    stock: 1,
    featured: true,
    artwork: { style: "gmt", dial: "#1B2233", bezel: ["#6B1F24", "#1E2B44"] },
    description:
      "Dos tonos en el bisel para distinguir el día de la noche en el segundo huso. Un GMT con carácter, pensado para quien vive entre dos ciudades.",
    specs: {
      Movimiento: "Automático, calibre 4R34 con función GMT",
      Reserva: "41 horas",
      Caja: "42,5 mm, acero inoxidable",
      Cristal: "Hardlex",
      Hermeticidad: "100 m",
      Brazalete: "Acero inoxidable",
    },
  },
  {
    slug: "seiko-5-sports-gmt-ssk001k1",
    name: "5 Sports GMT",
    brand: "Seiko",
    reference: "SSK001K1",
    category: "GMT",
    price: 34900,
    stock: 4,
    featured: false,
    artwork: { style: "gmt", dial: "#0E0E0E", bezel: ["#151515", "#151515"] },
    description:
      "La versión más sobria: negro sobre negro, lectura limpia y una presencia discreta que acompaña igual con traje que en fin de semana.",
    specs: {
      Movimiento: "Automático, calibre 4R34 con función GMT",
      Reserva: "41 horas",
      Caja: "42,5 mm, acero inoxidable",
      Cristal: "Hardlex",
      Hermeticidad: "100 m",
      Brazalete: "Acero inoxidable",
    },
  },
];

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@iwatchworks.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 10) throw new Error("Define ADMIN_PASSWORD (mín. 10 caracteres) en las variables de entorno");
  await db.user.upsert({
    where: { email },
    create: { email, name: "Administración", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
    update: { role: "ADMIN" },
  });
  // Recuperación si se pierde el móvil: define ADMIN_RESET_2FA=true en Vercel, vuelve a desplegar y quítala después.
  if (process.env.ADMIN_RESET_2FA === "true") {
    await db.user.update({ where: { email }, data: { totpSecret: null, totpPendingSecret: null, totpLastStep: null } });
    console.log("Verificación en dos pasos del administrador desactivada (ADMIN_RESET_2FA).");
  }

  for (const p of products) {
    const { artwork, specs, ...rest } = p;
    const exists = await db.product.findUnique({ where: { slug: p.slug } });
    if (exists) continue;
    const created = await db.product.create({
      data: { ...rest, images: "[]", specs: JSON.stringify(specs), artwork: JSON.stringify(artwork) },
    });
    await db.stockMovement.create({
      data: { productId: created.id, change: p.stock, stockAfter: p.stock, reason: "RESTOCK", note: "Stock inicial", actor: "seed" },
    });
  }

  // Rediseño v2: textos nuevos, sin las fotos antiguas. Se aplica una sola vez.
  const done = await db.siteMeta.findUnique({ where: { key: "content_v2" } });
  if (!done) {
    for (const p of products) {
      await db.product.updateMany({
        where: { slug: p.slug },
        data: {
          name: p.name,
          description: p.description,
          specs: JSON.stringify(p.specs),
          artwork: JSON.stringify(p.artwork),
          images: "[]",
        },
      });
    }
    await db.siteMeta.create({ data: { key: "content_v2", value: new Date().toISOString() } });
    console.log("Contenido v2 aplicado.");
  }
  console.log(`Seed completado. Admin: ${email}`);
}

main().finally(() => db.$disconnect());
