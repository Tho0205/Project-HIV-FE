import React from "react";
import "./Pagination.css";

export default function Pagination({ page, total, pageSize, onPageChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        Prev
      </button>
      {[...Array(totalPages)].map((_, idx) => (
        <button
          key={idx + 1}
          className={page === idx + 1 ? "active" : ""}
          onClick={() => onPageChange(idx + 1)}
        >
          {idx + 1}
        </button>
      ))}
      <button
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
