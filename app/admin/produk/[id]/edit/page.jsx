'use client'

import { useParams } from "next/navigation";
import ProductForm from "../../../../components/admin/ProductForm";


export default function EditProdukPage() {
  const { id } = useParams();
  return <ProductForm mode="edit" id={id} />;
}
