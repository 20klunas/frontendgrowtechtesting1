export default function TableWrapper({ children }) {
  return (
    <div className="border border-purple-600 rounded-2xl p-6 bg-black/40 backdrop-blur-md shadow-[0_0_25px_rgba(168,85,247,0.15)]">
      {children}
    </div>
  )
}
