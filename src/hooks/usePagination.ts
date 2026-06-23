import { useState, useMemo, useCallback } from 'react';

export function usePagination<T>(items: T[], initialItemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Ensure current page is within bounds (e.g. if items array shrinks after search/filter)
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const currentItems = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * itemsPerPage;
    return items.slice(startIdx, startIdx + itemsPerPage);
  }, [items, safeCurrentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const startItem = items.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safeCurrentPage * itemsPerPage, items.length);

  return {
    currentPage: safeCurrentPage,
    totalPages,
    currentItems,
    goToPage,
    setCurrentPage, // Usually use goToPage to be safe
    itemsPerPage,
    setItemsPerPage,
    totalItems: items.length,
    startItem,
    endItem,
  };
}
