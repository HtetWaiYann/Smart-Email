"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const handleLimitChange = (limit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", limit.toString());
    params.set("page", "1");
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <select
          value={itemsPerPage}
          onChange={(e) => handleLimitChange(Number(e.target.value))}
          className="px-2 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
        </select>
        <span className="text-sm text-gray-600">
          {startIndex}-{endIndex} of {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 text-sm font-medium rounded text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          aria-label="Previous page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <span className="text-sm text-gray-700 px-2">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 text-sm font-medium rounded text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          aria-label="Next page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
