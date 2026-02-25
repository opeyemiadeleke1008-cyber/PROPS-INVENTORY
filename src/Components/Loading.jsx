export default function Loading() {
  return (
    <div className="flex min-h-[260px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-full border-4 border-dashed border-green-500 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
