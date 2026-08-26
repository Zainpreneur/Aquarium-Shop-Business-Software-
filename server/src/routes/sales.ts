import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { makeSaleNumber } from "../lib/ids";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { from, to, customerId, status, page = "1", pageSize = "25" } = req.query as Record<string, string>;
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const take = Math.min(parseInt(pageSize, 10) || 25, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { customer: true, user: { select: { id: true, name: true } }, items: true },
        take,
        skip,
      }),
      prisma.sale.count({ where }),
    ]);

    res.json({ sales, total, page: Number(page), pageSize: take });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        user: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
    });
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    res.json(sale);
  })
);

const saleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

const saleSchema = z.object({
  customerId: z.string().optional().nullable(),
  items: z.array(saleItemSchema).min(1),
  taxRate: z.number().min(0).max(1).default(0),
  discountAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "CARD", "STORE_CREDIT", "OTHER"]).default("CASH"),
  notes: z.string().optional().nullable(),
});

// POST /api/sales — create a POS sale: validates stock, decrements inventory, records movements.
router.post(
  "/",
  requireRole("ADMIN", "MANAGER", "STAFF"),
  asyncHandler(async (req, res) => {
    const body = saleSchema.parse(req.body);

    const productIds = body.items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of body.items) {
      const product = productMap.get(item.productId);
      if (!product) return res.status(400).json({ error: `Product ${item.productId} not found` });
      if (product.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for "${product.name}" (have ${product.quantity}, need ${item.quantity})` });
      }
    }

    const subtotal = body.items.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + product.sellPrice * item.quantity;
    }, 0);
    const taxAmount = Math.max(0, subtotal - body.discountAmount) * body.taxRate;
    const total = Math.max(0, subtotal - body.discountAmount) + taxAmount;

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          saleNumber: makeSaleNumber(),
          customerId: body.customerId || null,
          userId: req.user!.id,
          subtotal,
          taxRate: body.taxRate,
          taxAmount,
          discountAmount: body.discountAmount,
          total,
          paymentMethod: body.paymentMethod,
          notes: body.notes || null,
          items: {
            create: body.items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: product.sellPrice,
                lineTotal: product.sellPrice * item.quantity,
              };
            }),
          },
        },
        include: { items: { include: { product: true } }, customer: true, user: { select: { id: true, name: true } } },
      });

      for (const item of body.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "SALE",
            quantityChange: -item.quantity,
            reason: `Sale ${created.saleNumber}`,
            referenceId: created.id,
            userId: req.user!.id,
          },
        });
      }

      if (body.customerId) {
        const pointsEarned = Math.floor(total);
        await tx.customer.update({
          where: { id: body.customerId },
          data: { loyaltyPoints: { increment: pointsEarned } },
        });
      }

      return created;
    });

    res.status(201).json(sale);
  })
);

// POST /api/sales/:id/refund — full refund: restocks items and marks sale refunded.
router.post(
  "/:id/refund",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    const sale = await prisma.sale.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    if (sale.status === "REFUNDED") return res.status(400).json({ error: "Sale already refunded" });

    await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        await tx.product.update({ where: { id: item.productId }, data: { quantity: { increment: item.quantity } } });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "RETURN",
            quantityChange: item.quantity,
            reason: `Refund of ${sale.saleNumber}`,
            referenceId: sale.id,
            userId: req.user!.id,
          },
        });
      }
      await tx.sale.update({ where: { id: sale.id }, data: { status: "REFUNDED" } });
    });

    res.json({ ok: true });
  })
);

export default router;
