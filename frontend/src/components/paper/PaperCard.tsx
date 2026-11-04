"use client";

import { SearchPaperItem } from "../../types";
import { useBookmarks } from "../../hooks/useBookmarks";

interface PaperCardProps {
  paper: SearchPaperItem;
}

export default function PaperCard({ paper }: PaperCardProps) {
  const { isSaved, savePaper, removePaper, isLoaded } = useBookmarks();

  const saved = isSaved(paper.id);

  const toggleBookmark = () => {
    if (saved) {
      removePaper(paper.id);
    } else {
      savePaper(paper);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-2">
          {paper.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          <span className="font-medium">Authors:</span> {paper.authors}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {paper.journal_name}
          </span>
          {paper.publication_year && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {paper.publication_year}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
        <a
          href={paper.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Baca Artikel &rarr;
        </a>
        
        {isLoaded && (
          <button
            onClick={toggleBookmark}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              saved
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {saved ? "Tersimpan ✓" : "Simpan Paper"}
          </button>
        )}
      </div>
    </div>
  );
}