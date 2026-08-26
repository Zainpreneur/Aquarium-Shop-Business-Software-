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
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { sales: true } } },
    });
    res.json(customers);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        sales: { orderBy: { createdAt: "desc" }, include: { items: { include: { product: true } } } },
      },
    });
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  })
);

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  loyaltyPoints: z.number().int().optional(),
});

router.post(
  "/",
  requireRole("ADMIN", "MANAGER", "STAFF"),
  asyncHandler(async (req, res) => {
    const body = customerSchema.parse(req.body);
    const customer = await prisma.customer.create({ data: body });
    res.status(201).json(customer);
  })
);

router.put(
  "/:id",
  requireRole("ADMIN", "MANAGER", "STAFF"),
  asyncHandler(async (req, res) => {
    const body = customerSchema.partial().parse(req.body);
    const customer = await prisma.customer.update({ where: { id: req.params.id }, data: body });
    res.json(customer);
  })
);

router.delete(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

export default router;
