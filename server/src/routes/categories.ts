import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    res.json(categories);
  })
);

const categorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["LIVESTOCK", "PLANT", "EQUIPMENT", "FOOD", "CHEMICAL", "DECOR", "SUPPLY", "OTHER"]),
});

router.post(
  "/",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    const body = categorySchema.parse(req.body);
    const category = await prisma.category.create({ data: body });
    res.status(201).json(category);
  })
);

router.put(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    const body = categorySchema.partial().parse(req.body);
    const category = await prisma.category.update({ where: { id: req.params.id }, data: body });
    res.json(category);
  })
);

router.delete(
  "/:id",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

export default router;
