import type { HTMLAttributes } from "react";

import NavButton from "./NavButton";

interface PaginatorProps extends HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  onNextPage: () => void;
  onPageChange: (page: number) => void;
  onPrevPage: () => void;
  resultsPerPage: number;
  totalPages: number;
  totalResults: number;
}

export default function Paginator({
  totalPages,
  currentPage,
  onPageChange,
  totalResults,
  resultsPerPage,
  onPrevPage,
  onNextPage,
  ...rest
}: PaginatorProps) {
  // An empty list has no first result: "0-0 of 0", never "1-0 of 0".
  const start = totalResults ? (currentPage - 1) * resultsPerPage + 1 : 0;
  const end = Math.min(currentPage * resultsPerPage, totalResults);

  // Render
  return (
    <div className="ui-paginator" {...rest}>
      <div>
        <p>Page</p>

        {totalPages ? (
          <select
            onChange={(e) => onPageChange(Number(e.target.value))}
            value={currentPage}
          >
            {Array.from({ length: totalPages }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <p>
        {start}-{end} of {totalResults}
      </p>

      <div>
        <NavButton
          buttonType="back"
          disabled={currentPage === 1}
          onClick={onPrevPage}
          size="s"
        />
        <NavButton
          buttonType="forward"
          disabled={currentPage >= totalPages}
          onClick={onNextPage}
          size="s"
        />
      </div>
    </div>
  );
}
