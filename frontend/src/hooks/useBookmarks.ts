"use client";

import { useState, useEffect } from "react";
import { SearchPaperItem } from "../types";

export function useBookmarks(userId: string = "guest") {
  const [savedPapers, setSavedPapers] = useState<SearchPaperItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data dari localStorage saat komponen pertama kali dimuat
  useEffect(() => {
    const storageKey = `bookmarks_${userId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setSavedPapers(JSON.parse(stored));
      } catch (error) {
        console.error("Gagal membaca bookmarks", error);
      }
    }
    setIsLoaded(true);
  }, [userId]);

  // Fungsi untuk menyimpan paper
  const savePaper = (paper: SearchPaperItem) => {
    const storageKey = `bookmarks_${userId}`;
    const updated = [...savedPapers, paper];
    setSavedPapers(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    
    // (Opsional) Persiapan untuk backend login nanti:
    // fetch('http://localhost:2000/api/bookmarks', { method: 'POST', body: JSON.stringify({ paper_id: paper.id }) })
  };

  // Fungsi untuk menghapus paper
  const removePaper = (paperId: string) => {
    const storageKey = `bookmarks_${userId}`;
    const updated = savedPapers.filter((p) => p.id !== paperId);
    setSavedPapers(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const isSaved = (paperId: string) => {
    return savedPapers.some((p) => p.id === paperId);
  };

  return { savedPapers, isLoaded, savePaper, removePaper, isSaved };
}