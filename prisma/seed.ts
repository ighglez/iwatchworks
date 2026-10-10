import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const cdn = (path: string) => `https://res.cloudinary.com/djg9xipqe/image/upload/f_auto,q_auto,w_1400/${path}`;

// Precios de ejemplo: ajústalos desde el panel de administración.
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
    images: [cdn("v1761477994/seiko-seiko-5-ssk003k1-13967034_aooruw.jpg")],
    description:
      "El primer GMT mecánico de la colección Seiko 5 Sports. Esfera negra, bisel bicolor de 24 horas y calibre automático 4R34 con segunda zona horaria real. Un reloj de viaje robusto y versátil.",
    specs: {
      Movimiento: "Automático Seiko 4R34 (GMT)",
      Reserva: "41 horas",
      Caja: "42,5 mm · acero inoxidable",
      Cristal: "Hardlex",
      Hermeticidad: "100 m",
      Correa: "Brazalete de acero",
    },
  },
  {
    slug: "seiko-prospex-speedtimer-ssc911p1",
    name: "Prospex Speedtimer Solar",
    brand: "Seiko",
    reference: "SSC911P1",
    category: "Cronógrafo",
    price: 59000,
    stock: 2,
    featured: true,
    images: [cdn("v1761217241/SSC911P1_th2gtl.jpg")],
    description:
      "Cronógrafo solar inspirado en el legado deportivo de Seiko. Esfera blanca tipo panda con subesferas negras, taquímetro en el bisel y una lectura impecable.",
    specs: {
      Movimiento: "Solar Seiko V192 (cronógrafo)",
      Reserva: "6 meses con carga completa",
      Caja: "39 mm · acero inoxidable",
      Cristal: "Zafiro",
      Hermeticidad: "100 m",
      Correa: "Brazalete de acero",
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
    images: [cdn("v1761506066/SSK035K1_ppe4kb.jpg")],
    description:
      "Versión especial del GMT de Seiko 5 Sports con un acabado que no pasa desapercibido. Calibre automático 4R34 y bisel de 24 horas para seguir dos husos horarios.",
    specs: {
      Movimiento: "Automático Seiko 4R34 (GMT)",
      Reserva: "41 horas",
      Caja: "42,5 mm · acero inoxidable",
      Cristal: "Hardlex",
      Hermeticidad: "100 m",
      Correa: "Brazalete de acero",
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
    images: [cdn("v1761506078/SSK001K1_ofw6mq.jpg")],
    description:
      "El GMT de Seiko 5 Sports en su versión más clásica, con esfera negra y bisel negro de 24 horas. Automático, fiable y preparado para el día a día.",
    specs: {
      Movimiento: "Automático Seiko 4R34 (GMT)",
      Reserva: "41 horas",
      Caja: "42,5 mm · acero inoxidable",
      Cristal: "Hardlex",
      Hermeticidad: "100 m",
      Correa: "Brazalete de acero",
    },
  },
];

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@iwatchworks.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 10) throw new Error("Define ADMIN_PASSWORD (mín. 10 caracteres) en .env");
  await db.user.upsert({
    where: { email },
    create: { email, name: "Administración", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
    update: { role: "ADMIN" },
  });

  for (const p of products) {
    const { images, specs, ...rest } = p;
    const exists = await db.product.findUnique({ where: { slug: p.slug } });
    if (exists) continue;
    const created = await db.product.create({
      data: { ...rest, images: JSON.stringify(images), specs: JSON.stringify(specs) },
    });
    await db.stockMovement.create({
      data: { productId: created.id, change: p.stock, stockAfter: p.stock, reason: "RESTOCK", note: "Stock inicial", actor: "seed" },
    });
  }
  console.log(`Seed completado. Admin: ${email}`);
}

main().finally(() => db.$disconnect());
