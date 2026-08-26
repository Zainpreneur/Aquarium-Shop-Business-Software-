import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { makeSaleNumber } from "../lib/ids";

async function main() {
  console.log("Seeding database...");

  const adminPass = await bcrypt.hash("admin123", 10);
  const staffPass = await bcrypt.hash("staff123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@aquashop.test" },
    update: {},
    create: { name: "Alex Rivera", email: "admin@aquashop.test", passwordHash: adminPass, role: "ADMIN" },
  });

  await prisma.user.upsert({
    where: { email: "staff@aquashop.test" },
    update: {},
    create: { name: "Sam Chen", email: "staff@aquashop.test", passwordHash: staffPass, role: "STAFF" },
  });

  const [freshwaterFish, saltwaterFish, plants, equipment, food, chemicals] = await Promise.all([
    prisma.category.upsert({ where: { name: "Freshwater Fish" }, update: {}, create: { name: "Freshwater Fish", type: "LIVESTOCK" } }),
    prisma.category.upsert({ where: { name: "Saltwater Fish" }, update: {}, create: { name: "Saltwater Fish", type: "LIVESTOCK" } }),
    prisma.category.upsert({ where: { name: "Live Plants" }, update: {}, create: { name: "Live Plants", type: "PLANT" } }),
    prisma.category.upsert({ where: { name: "Filtration & Equipment" }, update: {}, create: { name: "Filtration & Equipment", type: "EQUIPMENT" } }),
    prisma.category.upsert({ where: { name: "Fish Food" }, update: {}, create: { name: "Fish Food", type: "FOOD" } }),
    prisma.category.upsert({ where: { name: "Water Treatment" }, update: {}, create: { name: "Water Treatment", type: "CHEMICAL" } }),
  ]);

  const supplierA = await prisma.supplier.upsert({
    where: { id: "seed-supplier-aquatic-imports" },
    update: {},
    create: {
      id: "seed-supplier-aquatic-imports",
      name: "Aquatic Imports Co.",
      contactName: "Dana Wu",
      email: "orders@aquaticimports.test",
      phone: "555-0142",
      address: "12 Harbor Way, Tampa, FL",
    },
  });

  const supplierB = await prisma.supplier.upsert({
    where: { id: "seed-supplier-reef-supply" },
    update: {},
    create: {
      id: "seed-supplier-reef-supply",
      name: "Reef Supply Wholesale",
      contactName: "Marcus Lee",
      email: "sales@reefsupply.test",
      phone: "555-0198",
      address: "88 Coral Ave, Miami, FL",
    },
  });

  const products = [
    {
      sku: "FISH-NEON-001", name: "Neon Tetra", type: "LIVESTOCK" as const, categoryId: freshwaterFish.id, supplierId: supplierA.id,
      costPrice: 0.8, sellPrice: 2.99, quantity: 120, reorderLevel: 20, unit: "fish",
      species: "Neon Tetra", scientificName: "Paracheirodon innesi", waterType: "FRESHWATER" as const, careLevel: "EASY" as const,
      temperamentType: "Peaceful, schooling", minTankSizeGallons: 10, tempRangeLowF: 70, tempRangeHighF: 81, phLow: 6.0, phHigh: 7.0,
      healthStatus: "HEALTHY" as const,
    },
    {
      sku: "FISH-BETTA-001", name: "Betta Fish (Male)", type: "LIVESTOCK" as const, categoryId: freshwaterFish.id, supplierId: supplierA.id,
      costPrice: 3.5, sellPrice: 12.99, quantity: 18, reorderLevel: 10, unit: "fish",
      species: "Betta", scientificName: "Betta splendens", waterType: "FRESHWATER" as const, careLevel: "EASY" as const,
      temperamentType: "Territorial, solitary", minTankSizeGallons: 5, tempRangeLowF: 76, tempRangeHighF: 82, phLow: 6.5, phHigh: 7.5,
      healthStatus: "HEALTHY" as const,
    },
    {
      sku: "FISH-CLOWN-001", name: "Ocellaris Clownfish", type: "LIVESTOCK" as const, categoryId: saltwaterFish.id, supplierId: supplierB.id,
      costPrice: 8, sellPrice: 24.99, quantity: 14, reorderLevel: 8, unit: "fish",
      species: "Ocellaris Clownfish", scientificName: "Amphiprion ocellaris", waterType: "SALTWATER" as const, careLevel: "MODERATE" as const,
      temperamentType: "Semi-aggressive, pairs well", minTankSizeGallons: 20, tempRangeLowF: 74, tempRangeHighF: 80, phLow: 8.0, phHigh: 8.4,
      healthStatus: "HEALTHY" as const,
    },
    {
      sku: "FISH-TANG-001", name: "Blue Hippo Tang", type: "LIVESTOCK" as const, categoryId: saltwaterFish.id, supplierId: supplierB.id,
      costPrice: 22, sellPrice: 69.99, quantity: 4, reorderLevel: 3, unit: "fish",
      species: "Blue Hippo Tang", scientificName: "Paracanthurus hepatus", waterType: "SALTWATER" as const, careLevel: "DIFFICULT" as const,
      temperamentType: "Active, needs swimming room", minTankSizeGallons: 100, tempRangeLowF: 75, tempRangeHighF: 82, phLow: 8.1, phHigh: 8.4,
      healthStatus: "QUARANTINE" as const,
    },
    {
      sku: "PLANT-AMAZON-001", name: "Amazon Sword", type: "PLANT" as const, categoryId: plants.id, supplierId: supplierA.id,
      costPrice: 2.2, sellPrice: 7.99, quantity: 32, reorderLevel: 10, unit: "plant",
      species: "Amazon Sword", scientificName: "Echinodorus grisebachii", waterType: "FRESHWATER" as const, careLevel: "EASY" as const,
      minTankSizeGallons: 20, tempRangeLowF: 68, tempRangeHighF: 82, phLow: 6.5, phHigh: 7.5, healthStatus: "HEALTHY" as const,
    },
    {
      sku: "EQ-FILTER-100", name: "PowerFlow 100 Canister Filter", type: "EQUIPMENT" as const, categoryId: equipment.id, supplierId: supplierA.id,
      costPrice: 34, sellPrice: 79.99, quantity: 9, reorderLevel: 5, unit: "unit",
    },
    {
      sku: "EQ-HEATER-050", name: "50W Submersible Heater", type: "EQUIPMENT" as const, categoryId: equipment.id, supplierId: supplierA.id,
      costPrice: 8, sellPrice: 19.99, quantity: 25, reorderLevel: 10, unit: "unit",
    },
    {
      sku: "EQ-LED-024", name: "24in Full Spectrum LED Light", type: "EQUIPMENT" as const, categoryId: equipment.id, supplierId: supplierB.id,
      costPrice: 22, sellPrice: 54.99, quantity: 3, reorderLevel: 5, unit: "unit",
    },
    {
      sku: "FOOD-FLAKE-001", name: "Tropical Flake Food 100g", type: "FOOD" as const, categoryId: food.id, supplierId: supplierA.id,
      costPrice: 2.1, sellPrice: 6.49, quantity: 60, reorderLevel: 15, unit: "container",
    },
    {
      sku: "FOOD-PELLET-RF", name: "Marine Reef Pellets 200g", type: "FOOD" as const, categoryId: food.id, supplierId: supplierB.id,
      costPrice: 4.5, sellPrice: 12.99, quantity: 40, reorderLevel: 12, unit: "container",
    },
    {
      sku: "CHEM-CONDITIONER-01", name: "Water Conditioner 500ml", type: "CHEMICAL" as const, categoryId: chemicals.id, supplierId: supplierA.id,
      costPrice: 3.2, sellPrice: 9.99, quantity: 55, reorderLevel: 15, unit: "bottle",
    },
    {
      sku: "CHEM-SALTMIX-25", name: "Reef Salt Mix 25kg Bucket", type: "CHEMICAL" as const, categoryId: chemicals.id, supplierId: supplierB.id,
      costPrice: 28, sellPrice: 64.99, quantity: 6, reorderLevel: 4, unit: "bucket",
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({ where: { sku: p.sku }, update: {}, create: p as any });
  }

  const customerA = await prisma.customer.upsert({
    where: { id: "seed-customer-morgan" },
    update: {},
    create: { id: "seed-customer-morgan", name: "Morgan Blake", email: "morgan@example.test", phone: "555-0111", loyaltyPoints: 0 },
  });
  await prisma.customer.upsert({
    where: { id: "seed-customer-priya" },
    update: {},
    create: { id: "seed-customer-priya", name: "Priya Nair", email: "priya@example.test", phone: "555-0133", loyaltyPoints: 0 },
  });

  // Seed one demo sale so the dashboard has something to show immediately.
  const neon = await prisma.product.findUnique({ where: { sku: "FISH-NEON-001" } });
  const flake = await prisma.product.findUnique({ where: { sku: "FOOD-FLAKE-001" } });
  if (neon && flake) {
    const existingSale = await prisma.sale.findFirst({ where: { notes: "seed-demo-sale" } });
    if (!existingSale) {
      const subtotal = neon.sellPrice * 6 + flake.sellPrice * 1;
      const taxAmount = subtotal * 0.07;
      await prisma.sale.create({
        data: {
          saleNumber: makeSaleNumber(),
          customerId: customerA.id,
          userId: admin.id,
          subtotal,
          taxRate: 0.07,
          taxAmount,
          discountAmount: 0,
          total: subtotal + taxAmount,
          paymentMethod: "CARD",
          notes: "seed-demo-sale",
          items: {
            create: [
              { productId: neon.id, quantity: 6, unitPrice: neon.sellPrice, lineTotal: neon.sellPrice * 6 },
              { productId: flake.id, quantity: 1, unitPrice: flake.sellPrice, lineTotal: flake.sellPrice },
            ],
          },
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("  Admin login: admin@aquashop.test / admin123");
  console.log("  Staff login: staff@aquashop.test / staff123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
