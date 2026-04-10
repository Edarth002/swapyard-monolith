// components/buyer/Pagination.tsx
export default function Pagination() {
  return (
    <div className="flex flex-col items-center mt-12">
      <button className="px-6 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:border-gray-900 transition-colors mb-6 shadow-sm">
        Load More Items <span className="ml-1 text-gray-400">⌄</span>
      </button>

      <div className="flex items-center gap-2">
        <button className="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">1</button>
        <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-bold shadow-md">2</button>
        <button className="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">3</button>
        <span className="text-gray-400 px-1">...</span>
        <button className="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">15</button>
      </div>
    </div>
  );
}