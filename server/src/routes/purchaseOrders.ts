import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { makePoNumber } from "../lib/ids";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, supplierId } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    const orders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { supplier: true, items: true, user: { select: { id: true, name: true } } },
    });
    res.json(orders);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: { supplier: true, items: { include: { product: true } }, user: { select: { id: true, name: true } } },
    });
    if (!order) return res.status(404).json({ error: "Purchase order not found" });
    res.json(order);
  })
);

const poItemSchema = z.object({
  productId: z.string(),
  quantityOrdered: z.number().int().positive(),
  unitCost: z.number().min(0),
});

const poSchema = z.object({
  supplierId: z.string(),
  items: z.array(poItemSchema).min(1),
  expectedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.post(
  "/",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    const body = poSchema.parse(req.body);
    const total = body.items.reduce((sum, i) => sum + i.unitCost * i.quantityOrdered, 0);

    const order = await prisma.purchaseOrder.create({
      data: {
        poNumber: makePoNumber(),
        supplierId: body.supplierId,
        userId: req.user!.id,
        expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
        notes: body.notes || null,
        total,
        status: "DRAFT",
        items: { create: body.items },
      },
      include: { items: { include: { product: true } }, supplier: true },
    });

    res.status(201).json(order);
  })
);

router.put(
  "/:id/status",
  requireRole("ADMIN", "MANAGER"),
  asyncHandler(async (req, res) => {
    const { status } = z.object({ status: z.enum(["DRAFT", "ORDERED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"]) }).parse(req.body);
    const order = await prisma.purchaseOrder.update({ where: { id: req.params.id }, data: { status } });
    res.json(order);
  })
);

// POST /api/purchase-orders/:id/receive — receive some/all items, incrementing stock and cost basis.
const receiveSchema = z.object({
  items: z.array(z.object({ purchaseOrderItemId: z.string(), quantityReceived: z.number().int().positive() })).min(1),
});

router.post(
  "/:id/receive",
  requireRole("ADMIN", "MANAGER", "STAFF"),
  asyncHandler(async (req, res) => {
    const body = receiveSchema.parse(req.body);
    const order = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!order) return res.status(404).json({ error: "Purchase order not found" });

    await prisma.$transaction(async (tx) => {
      for (const receipt of body.items) {
        const poItem = order.items.find((i) => i.id === receipt.purchaseOrderItemId);
        if (!poItem) continue;

        const remaining = poItem.quantityOrdered - poItem.quantityReceived;
        const qty = Math.min(receipt.quantityReceived, remaining);
        if (qty <= 0) continue;

        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { quantityReceived: { increment: qty } },
        });
        await tx.product.update({
          where: { id: poItem.productId },
          data: { quantity: { increment: qty }, costPrice: poItem.unitCost },
        });
        await tx.stockMovement.create({
          data: {
            productId: poItem.productId,
            type: "PURCHASE_RECEIPT",
            quantityChange: qty,
            reason: `Received against ${order.poNumber}`,
            referenceId: order.id,
            userId: req.user!.id,
          },
        });
      }

      const updatedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: order.id } });
      const allReceived = updatedItems.every((i) => i.quantityReceived >= i.quantityOrdered);
      const anyReceived = updatedItems.some((i) => i.quantityReceived > 0);

      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: allReceived ? "RECEIVED" : anyReceived ? "PARTIALLY_RECEIVED" : order.status,
          receivedDate: allReceived ? new Date() : order.receivedDate,
        },
      });
    });

    const updated = await prisma.purchaseOrder.findUnique({
      where: { id: order.id },
      include: { items: { include: { product: true } }, supplier: true },
    });
    res.json(updated);
  })
);

export default router;
