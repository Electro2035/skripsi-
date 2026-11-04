"use client";

import { useState } from "react";
import { SearchPaperItem } from "../../types";
import PaperCard from "./PaperCard";

interface PaperListProps {
  papers: SearchPaperItem[];
}

export default function PaperList({ papers }: PaperListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(papers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPapers = papers.slice(startIndex, startIndex + itemsPerPage);

  if (papers.length === 0) {
    return <div className="text-center py-12 text-gray-500">Tidak ada paper yang ditemukan.</div>;
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">
        Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, papers.length)} dari {papers.length} paper
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {currentPapers.map((paper) => (
          <PaperCard key={paper.id} paper={paper} />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 bg-white"
          >
            Prev
          </button>
          
          <span className="text-sm font-medium px-4">
            Halaman {currentPage} dari {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 bg-white"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}