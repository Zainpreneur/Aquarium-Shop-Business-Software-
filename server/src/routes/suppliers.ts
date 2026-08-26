import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search } = req.query as Record<string, string>;
    const where = search
      ? { OR: [{ name: { contains: search } }, { email: { contains: search } }, { phone: { contains: search } }] }
      : {};
    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true, purchaseOrders: true } } },
    });
    res.json(suppliers);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: { products: true, purchaseOrders: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    res.json(supplier);
  })
);

const supplierSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.post(
  "/",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    const body = supplierSchema.parse(req.body);
    const supplier = await prisma.supplier.create({ data: body });
    res.status(201).json(supplier);
  })
);

router.put(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    const body = supplierSchema.partial().parse(req.body);
    const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data: body });
    res.json(supplier);
  })
);

router.delete(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    await prisma.supplier.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

export default router;
