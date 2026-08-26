import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

router.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const today = startOfDay(new Date());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      todaySales,
      monthSales,
      totalProducts,
      totalCustomers,
      allProducts,
      recentSales,
      salesLast30,
    ] = await Promise.all([
      prisma.sale.aggregate({ where: { createdAt: { gte: today }, status: "COMPLETED" }, _sum: { total: true }, _count: true }),
      prisma.sale.aggregate({ where: { createdAt: { gte: startOfMonth }, status: "COMPLETED" }, _sum: { total: true }, _count: true }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.customer.count(),
      prisma.product.findMany({ where: { isActive: true }, select: { id: true, name: true, quantity: true, reorderLevel: true, type: true, sellPrice: true, costPrice: true } }),
      prisma.sale.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { customer: true, user: { select: { name: true } } },
      }),
      prisma.sale.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, status: "COMPLETED" },
        select: { total: true, createdAt: true },
      }),
    ]);

    const lowStock = allProducts.filter((p) => p.quantity <= p.reorderLevel);
    const inventoryValue = allProducts.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

    const byType: Record<string, number> = {};
    for (const p of allProducts) byType[p.type] = (byType[p.type] || 0) + p.quantity;

    // Group last 30 days of sales by day for a simple trend chart.
    const trendMap = new Map<string, number>();
    for (const s of salesLast30) {
      const key = startOfDay(s.createdAt).toISOString().slice(0, 10);
      trendMap.set(key, (trendMap.get(key) || 0) + s.total);
    }
    const salesTrend = Array.from(trendMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, total]) => ({ date, total }));

    res.json({
      todayRevenue: todaySales._sum.total || 0,
      todayOrders: todaySales._count,
      monthRevenue: monthSales._sum.total || 0,
      monthOrders: monthSales._count,
      totalProducts,
      totalCustomers,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.slice(0, 10),
      inventoryValue,
      inventoryByType: byType,
      recentSales,
      salesTrend,
    });
  })
);

// Top-selling products by revenue over an optional date range.
router.get(
  "/top-products",
  asyncHandler(async (req, res) => {
    const { from, to, limit = "10" } = req.query as Record<string, string>;
    const where: any = { sale: { status: "COMPLETED" } };
    if (from || to) {
      where.sale.createdAt = {};
      if (from) where.sale.createdAt.gte = new Date(from);
      if (to) where.sale.createdAt.lte = new Date(to);
    }

    const items = await prisma.saleItem.findMany({ where, include: { product: true } });
    const map = new Map<string, { productId: string; name: string; quantity: number; revenue: number }>();
    for (const item of items) {
      const key = item.productId;
      const existing = map.get(key) || { productId: key, name: item.product.name, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.lineTotal;
      map.set(key, existing);
    }

    const top = Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, Math.min(parseInt(limit, 10) || 10, 50));

    res.json(top);
  })
);

export default router;
