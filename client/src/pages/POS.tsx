import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle2 } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import { money } from "../lib/format";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import type { Customer, PaymentMethod, Product, Sale } from "../types";

interface CartLine {
  product: Product;
  quantity: number;
}

export function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [taxRate, setTaxRate] = useState(0.07);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);

  useEffect(() => {
    api.get("/products", { params: { pageSize: "200", isActive: "true" } }).then((res) => setProducts(res.data.products));
    api.get("/customers").then((res) => setCustomers(res.data));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (typeFilter && p.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q) && !(p.species || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [products, search, typeFilter]);

  const types = useMemo(() => Array.from(new Set(products.map((p) => p.type))), [products]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      if (product.quantity < 1) return prev;
      return [...prev, { product, quantity: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.product.id !== productId) return l;
          const next = Math.min(l.quantity + delta, l.product.quantity);
          return { ...l, quantity: Math.max(0, next) };
        })
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  const subtotal = cart.reduce((sum, l) => sum + l.product.sellPrice * l.quantity, 0);
  const taxAmount = Math.max(0, subtotal - discount) * taxRate;
  const total = Math.max(0, subtotal - discount) + taxAmount;

  async function checkout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/sales", {
        customerId: customerId || null,
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        taxRate,
        discountAmount: discount,
        paymentMethod,
      });
      setReceipt(data);
      setCart([]);
      setDiscount(0);
      setCustomerId("");
      // Refresh stock levels shown in the product grid.
      api.get("/products", { params: { pageSize: "200", isActive: "true" } }).then((res) => setProducts(res.data.products));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Point of Sale</h1>
          <p className="text-sm text-slate-400">Tap a product to add it to the cart.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-100"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setTypeFilter("")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${typeFilter === "" ? "bg-ocean-600 text-white" : "bg-slate-100 text-slate-500"}`}
            >
              All
            </button>
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${typeFilter === t ? "bg-ocean-600 text-white" : "bg-slate-100 text-slate-500"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => {
            const outOfStock = p.quantity <= 0;
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={outOfStock}
                className="flex flex-col items-start rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Badge value={p.type} />
                <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-700">{p.name}</p>
                <p className="mt-1 text-xs text-slate-400">{outOfStock ? "Out of stock" : `${p.quantity} ${p.unit} available`}</p>
                <p className="mt-2 text-base font-semibold text-ocean-700">{money(p.sellPrice)}</p>
              </button>
            );
          })}
          {filtered.length === 0 && <p className="col-span-full py-10 text-center text-sm text-slate-400">No products found.</p>}
        </div>
      </div>

      <div className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 xl:sticky xl:top-6 xl:h-fit">
        <div className="mb-4 flex items-center gap-2">
          <ShoppingCart size={18} className="text-ocean-600" />
          <h2 className="text-sm font-semibold text-slate-700">Current Sale</h2>
        </div>

        <div className="max-h-[40vh] flex-1 space-y-3 overflow-y-auto pr-1">
          {cart.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Cart is empty.</p>}
          {cart.map((line) => (
            <div key={line.product.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-700">{line.product.name}</p>
                <p className="text-xs text-slate-400">{money(line.product.sellPrice)} each</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => changeQty(line.product.id, -1)} className="rounded-lg bg-slate-100 p-1 text-slate-500 hover:bg-slate-200">
                  <Minus size={13} />
                </button>
                <span className="w-6 text-center text-sm font-medium">{line.quantity}</span>
                <button onClick={() => changeQty(line.product.id, 1)} className="rounded-lg bg-slate-100 p-1 text-slate-500 hover:bg-slate-200">
                  <Plus size={13} />
                </button>
              </div>
              <p className="w-16 shrink-0 text-right text-sm font-semibold text-slate-700">{money(line.product.sellPrice * line.quantity)}</p>
              <button onClick={() => removeLine(line.product.id)} className="text-slate-300 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Customer (optional)</span>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input">
              <option value="">Walk-in customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Discount ($)</span>
              <input type="number" min={0} className="input" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Tax rate (%)</span>
              <input
                type="number"
                min={0}
                step={0.5}
                className="input"
                value={Math.round(taxRate * 10000) / 100}
                onChange={(e) => setTaxRate(Number(e.target.value) / 100)}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Payment method</span>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="input">
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="STORE_CREDIT">Store credit</option>
              <option value="OTHER">Other</option>
            </select>
          </label>

          <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Discount</span>
              <span>-{money(discount)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax</span>
              <span>{money(taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-semibold text-slate-800">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            onClick={checkout}
            disabled={cart.length === 0 || submitting}
            className="w-full rounded-xl bg-ocean-600 px-4 py-3 text-sm font-semibold text-white hover:bg-ocean-700 disabled:opacity-50"
          >
            {submitting ? "Processing…" : `Charge ${money(total)}`}
          </button>
        </div>
      </div>

      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Sale Complete">
        {receipt && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700">
              <CheckCircle2 size={20} />
              <div>
                <p className="text-sm font-semibold">{receipt.saleNumber}</p>
                <p className="text-xs">Payment received via {receipt.paymentMethod}</p>
              </div>
            </div>
            <div className="divide-y divide-slate-100 text-sm">
              {receipt.items.map((item) => (
                <div key={item.id} className="flex justify-between py-1.5">
                  <span className="text-slate-600">
                    {item.quantity} × {item.product?.name}
                  </span>
                  <span className="font-medium text-slate-700">{money(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{money(receipt.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span>{money(receipt.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-slate-800">
                <span>Total</span>
                <span>{money(receipt.total)}</span>
              </div>
            </div>
            <button onClick={() => setReceipt(null)} className="w-full rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ocean-700">
              New Sale
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
