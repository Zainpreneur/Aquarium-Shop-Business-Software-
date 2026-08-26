import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    res.json(users);
  })
);

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const body = updateSchema.parse(req.body);
    const data: any = { ...body };
    delete data.password;
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    res.json(user);
  })
);

export default router;
