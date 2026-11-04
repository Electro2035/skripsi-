"use client";

import { useState } from "react";
import { SearchPaperItem } from "../../types";
import PaperList from "../../components/paper/PaperList";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [papers, setPapers] = useState<SearchPaperItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError("");
    setPapers([]);

    try {
      // Pastikan backend berjalan di port 2000
      const res = await fetch(`http://localhost:2000/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Gagal mengambil data dari server");
      
      const data = await res.json();
      setPapers(data.papers || []);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pencarian Jurnal</h1>
        <p className="text-gray-600 mb-6">Cari literatur dari jutaan database OpenAlex.</p>
        
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Masukkan topik (contoh: machine learning, artificial intelligence)..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Mencari..." : "Cari Paper"}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {!isLoading && !error && papers.length > 0 && (
        <PaperList papers={papers} />
      )}
    </div>
  );
}