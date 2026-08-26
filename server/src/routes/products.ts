import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z.enum(["LIVESTOCK", "PLANT", "EQUIPMENT", "FOOD", "CHEMICAL", "DECOR", "SUPPLY", "OTHER"]),
  categoryId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  costPrice: z.number().min(0),
  sellPrice: z.number().min(0),
  quantity: z.number().int().min(0).default(0),
  reorderLevel: z.number().int().min(0).default(5),
  unit: z.string().default("unit"),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  species: z.string().optional().nullable(),
  scientificName: z.string().optional().nullable(),
  waterType: z.enum(["FRESHWATER", "SALTWATER", "BRACKISH", "NA"]).optional().nullable(),
  careLevel: z.enum(["EASY", "MODERATE", "DIFFICULT", "EXPERT"]).optional().nullable(),
  temperamentType: z.string().optional().nullable(),
  minTankSizeGallons: z.number().optional().nullable(),
  tempRangeLowF: z.number().optional().nullable(),
  tempRangeHighF: z.number().optional().nullable(),
  phLow: z.number().optional().nullable(),
  phHigh: z.number().optional().nullable(),
  healthStatus: z.enum(["HEALTHY", "QUARANTINE", "SICK", "DECEASED", "NA"]).optional().nullable(),
});

// GET /api/products — list with search, type/category filters, low-stock filter, pagination
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search, type, categoryId, lowStock, isActive, page = "1", pageSize = "25" } = req.query as Record<
      string,
      string
    >;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { species: { contains: search } },
        { scientificName: { contains: search } },
      ];
    }
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const take = Math.min(parseInt(pageSize, 10) || 25, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    let products = await prisma.product.findMany({
      where,
      include: { category: true, supplier: true },
      orderBy: { name: "asc" },
      ...(lowStock === "true" ? {} : { take, skip }),
    });

    if (lowStock === "true") {
      products = products.filter((p) => p.quantity <= p.reorderLevel);
    }

    const total = await prisma.product.count({ where });

    res.json({ products, total, page: Number(page), pageSize: take });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, supplier: true, stockMovements: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  })
);

router.post(
  "/",
  requireRole("ADMIN", "MANAGER", "STAFF"),
  asyncHandler(async (req, res) => {
    const body = productSchema.parse(req.body);
    const existing = await prisma.product.findUnique({ where: { sku: body.sku } });
    if (existing) return res.status(409).json({ error: "SKU already exists" });

    const product = await prisma.product.create({ data: body as any });

    if (product.quantity > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: "INITIAL",
          quantityChange: product.quantity,
          reason: "Initial stock on product creation",
          userId: req.user!.id,
        },
      });
    }

    res.status(201).json(product);
  })
);

router.put(
  "/:id",
  requireRole("ADMIN", "MANAGER", "STAFF"),
  asyncHandler(async (req, res) => {
    const body = productSchema.partial().parse(req.body);
    const current = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: "Product not found" });

    const product = await prisma.product.update({ where: { id: req.params.id }, data: body as any });

    if (body.quantity !== undefined && body.quantity !== current.quantity) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: "ADJUSTMENT",
          quantityChange: body.quantity - current.quantity,
          reason: "Manual stock adjustment",
          userId: req.user!.id,
        },
      });
    }

    res.json(product);
  })
);

router.delete(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ ok: true });
  })
);

// POST /api/products/:id/adjust — quick stock adjustment (e.g. mortality, damage, recount)
const adjustSchema = z.object({
  quantityChange: z.number().int(),
  reason: z.string().min(1),
  type: z.enum(["ADJUSTMENT", "MORTALITY", "RETURN"]).default("ADJUSTMENT"),
});

router.post(
  "/:id/adjust",
  requireRole("ADMIN", "MANAGER", "STAFF"),
  asyncHandler(async (req, res) => {
    const body = adjustSchema.parse(req.body);
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const newQty = product.quantity + body.quantityChange;
    if (newQty < 0) return res.status(400).json({ error: "Adjustment would result in negative stock" });

    const [updated] = await prisma.$transaction([
      prisma.product.update({ where: { id: product.id }, data: { quantity: newQty } }),
      prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: body.type,
          quantityChange: body.quantityChange,
          reason: body.reason,
          userId: req.user!.id,
        },
      }),
    ]);

    res.json(updated);
  })
);

export default router;
