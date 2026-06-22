import { useState, useMemo } from 'react';

export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Ensure current page is within bounds (e.g. if items array shrinks after search/filter)
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const currentItems = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * itemsPerPage;
    return items.slice(startIdx, startIdx + itemsPerPage);
  }, [items, safeCurrentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return {
    currentPage: safeCurrentPage,
    totalPages,
    currentItems,
    goToPage,
    setCurrentPage, // Usually use goToPage to be safe
  };
}
