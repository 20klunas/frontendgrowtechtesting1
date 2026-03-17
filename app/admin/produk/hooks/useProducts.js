import { useEffect, useState } from "react"
import { productService } from "../services/productService"

export function useProducts(search, page) {

  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProducts = async () => {
    setLoading(true)

    try {
      const res = await productService.getAll({
        search,
        page
      })

      setProducts(res.data || [])
      setMeta(res.meta || null)

    } catch (err) {
      console.error(err)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [search, page])

  return {
    products,
    meta,
    loading,
    reload: loadProducts,
    setProducts
  }
}