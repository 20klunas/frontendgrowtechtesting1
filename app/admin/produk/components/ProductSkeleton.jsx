export default function ProductSkeleton() {
  return (
    <tr className="border-b border-white/5">
      {[...Array(8)].map((_, i) => (
        <td key={i} className="py-4">
          <div className="h-4 rounded shimmer"></div>
        </td>
      ))}
    </tr>
  )
}