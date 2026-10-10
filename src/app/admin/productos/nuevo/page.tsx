import Link from "next/link";
import { db } from "@/lib/db";
import ProductForm from "../ProductForm";

export const metadata = { title: "Nuevo producto" };

export default async function Nuevo() {
  const cats = await db.product.findMany({ select: { category: true }, distinct: ["category"] });
  return (
    <>
      <Link href="/admin/productos" className="text-xs uppercase tracking-widest text-ink-muted hover:text-ink">← Productos</Link>
      <h1 className="mb-8 mt-3 text-4xl">Nuevo producto</h1>
      <ProductForm categories={cats.map((c) => c.category)} />
    </>
  );
}
