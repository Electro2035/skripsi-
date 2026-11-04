"use client";

import { useBookmarks } from "../../hooks/useBookmarks";
import PaperList from "../../components/paper/PaperList";

export default function SavedPage() {
  const { savedPapers, isLoaded } = useBookmarks();

  if (!isLoaded) {
    return <div className="text-center py-12">Memuat koleksi...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Saved Papers</h1>
        <p className="text-gray-600">
          Koleksi jurnal yang telah Anda simpan. Saat ini tersimpan di browser lokal Anda.
        </p>
      </div>

      {savedPapers.length > 0 ? (
        <PaperList papers={savedPapers} />
      ) : (
        <div className="bg-white p-12 rounded-lg border border-dashed border-gray-300 text-center text-gray-500">
          Belum ada paper yang disimpan. Silakan cari jurnal dan tekan tombol "Simpan Paper".
        </div>
      )}
    </div>
  );
}