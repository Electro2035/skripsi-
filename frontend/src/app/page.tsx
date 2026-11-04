"use client";

import { useState, useEffect, useRef } from "react";
// @ts-ignore
import cloud from "d3-cloud";
import { AnalysisResponse, GapResult } from "@/types";
import { 
  BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer 
} from "recharts";

// Vibrant, distinct colors for the word cloud
const CLOUD_COLORS = ["#1e293b", "#e11d48", "#2563eb", "#16a34a", "#d97706", "#9333ea", "#0891b2"];

// Native React Word Cloud utilizing d3-cloud for layout mathematics only
function NativeWordCloud({ words, width, height }: { words: any[], width: number, height: number }) {
  const [cloudWords, setCloudWords] = useState<any[]>([]);

  useEffect(() => {
    if (!words.length || width === 0 || height === 0) return;

    // Use square root scaling for a professional, tightly packed distribution
    const minVal = Math.min(...words.map(w => w.value));
    const maxVal = Math.max(...words.map(w => w.value));
    const minSqrt = Math.sqrt(minVal);
    const maxSqrt = Math.sqrt(maxVal);

    const layout = cloud()
      .size([width, height])
      .words(words.map(d => ({ text: d.text, value: d.value })))
      .padding(3) // Tight packing density
      .rotate(() => (Math.random() > 0.5 ? 90 : 0)) // Mix of horizontal and vertical
      .font("Inter, sans-serif")
      .fontWeight("bold")
      .fontSize((d: any) => {
        if (maxSqrt === minSqrt) return 30;
        // Scale fonts dynamically between 14px and 85px based on container
        return 14 + ((Math.sqrt(d.value) - minSqrt) / (maxSqrt - minSqrt)) * 71; 
      })
      .on("end", setCloudWords);

    layout.start();
  }, [words, width, height]);

  if (!cloudWords.length) return null;

  return (
    <svg width={width} height={height} className="w-full h-full overflow-visible">
      <g transform={`translate(${width / 2}, ${height / 2})`}>
        {cloudWords.map((w, i) => (
          <text
            key={w.text}
            textAnchor="middle"
            transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
            style={{
              fontSize: `${w.size}px`,
              fontFamily: w.font,
              fontWeight: w.weight,
              fill: CLOUD_COLORS[i % CLOUD_COLORS.length],
            }}
            className="cursor-pointer transition-opacity duration-200 hover:opacity-75"
          >
            <title>Frequency: {w.value}</title>
            {w.text}
          </text>
        ))}
      </g>
    </svg>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [startYear, setStartYear] = useState<string>("2015");
  const [endYear, setEndYear] = useState<string>("2026");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  
  // Gap Selection & Layout States
  const [selectedGap, setSelectedGap] = useState<GapResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Responsive Observer for Word Cloud Canvas
  useEffect(() => {
    if (containerRef.current) {
      setDimensions({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
    }
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [results]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true); setError(null); setResults(null); setSelectedGap(null);

    try {
      let url = `http://localhost:8000/api/analyze?topic=${encodeURIComponent(query)}&limit=200`;
      if (startYear) url += `&start_year=${startYear}`;
      if (endYear) url += `&end_year=${endYear}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch analysis data.");
      
      const data: AnalysisResponse = await response.json();
      setResults(data);
      if (data.gaps.length > 0) setSelectedGap(data.gaps[0]);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfcfd] text-gray-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Research Explorer</h1>
            <p className="text-xs text-gray-500 font-medium">Literature Mapping & Gap Analysis</p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Topic e.g., Machine Learning"
              className="w-64 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm text-sm"
              disabled={loading}
            />
            <input
              type="number" value={startYear} onChange={(e) => setStartYear(e.target.value)}
              placeholder="From" className="w-20 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-500 shadow-sm text-sm" disabled={loading}
            />
            <input
              type="number" value={endYear} onChange={(e) => setEndYear(e.target.value)}
              placeholder="To" className="w-20 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-500 shadow-sm text-sm" disabled={loading}
            />
            <button type="submit" disabled={loading || !query.trim()} className="px-5 py-2 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm text-sm">
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>
      </header>

      {error && <div className="max-w-7xl mx-auto mt-6 px-6"><div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">{error}</div></div>}

      {loading && (
        <div className="max-w-7xl mx-auto mt-20 flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500 font-medium">Retrieving and analyzing literature...</p>
        </div>
      )}

      {results && !loading && (
        <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8 animate-in fade-in duration-500">
          
          {/* Overview Section */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Literature Overview</h2>
              <div className="flex gap-8">
                <div>
                  <p className="text-3xl font-light text-gray-900 tracking-tight">{results.overview.total_retrieved}</p>
                  <p className="text-sm text-gray-500 font-medium mt-1">Papers Retrieved</p>
                </div>
                <div className="border-l border-gray-100 pl-8">
                  <p className="text-3xl font-light text-gray-900 tracking-tight">{results.overview.with_abstracts}</p>
                  <p className="text-sm text-gray-500 font-medium mt-1">Abstracts Analyzed</p>
                </div>
              </div>
            </div>
            <div className="flex-1 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results.overview.timeline} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                  <XAxis dataKey="year" hide />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between text-xs text-gray-400 font-medium mt-2">
                <span>{results.overview.timeline[0]?.year}</span>
                <span>Publication Timeline</span>
                <span>{results.overview.timeline[results.overview.timeline.length - 1]?.year}</span>
              </div>
            </div>
          </section>

          {/* Dual Interface: Word Cloud & Gaps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Native D3 Word Cloud */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Dominant Research Concepts</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Most frequent concepts identified across abstracts</p>
                </div>
              </div>
              <div className="flex-1 relative bg-[#fafafa]" ref={containerRef}>
                {results.word_cloud.length > 0 && dimensions.width > 0 ? (
                  <NativeWordCloud 
                    words={results.word_cloud} 
                    width={dimensions.width} 
                    height={dimensions.height} 
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                    No significant concepts found.
                  </div>
                )}
              </div>
            </section>

            {/* Right: Gap Indicators */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-base font-semibold text-gray-900">Research Gap Indicators</h2>
                <p className="text-xs text-gray-500 mt-0.5">Semantic similarity signals based on abstracts</p>
              </div>
              
              <div className="flex flex-1 overflow-hidden">
                {/* Gap List */}
                <div className="w-2/5 border-r border-gray-100 overflow-y-auto bg-white custom-scrollbar p-3 space-y-2">
                  {results.gaps.map((gap) => (
                    <button 
                      key={gap.gap_name}
                      onClick={() => setSelectedGap(gap)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${selectedGap?.gap_name === gap.gap_name ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-gray-900">{gap.gap_name.split(' ')[0]}</span>
                        <span className="text-xs font-bold text-gray-500">{gap.percentage_score}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${gap.percentage_score}%` }}></div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Gap Details & Papers */}
                <div className="w-3/5 overflow-y-auto custom-scrollbar p-5 bg-[#fcfcfd]">
                  {selectedGap ? (
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                      <div className="border-b border-gray-200 pb-3">
                        <h3 className="text-lg font-bold text-gray-900">{selectedGap.gap_name}</h3>
                        <p className="text-xs text-gray-500 mt-1">Found {selectedGap.supporting_papers.length} strongly associated papers.</p>
                      </div>
                      
                      <div className="space-y-4">
                        {selectedGap.supporting_papers.map((gapPaper) => {
                          const fullPaper = results.papers.find(p => p.id === gapPaper.paper_id);
                          if (!fullPaper) return null;

                          return (
                            <div key={`${selectedGap.gap_name}-${gapPaper.paper_id}`} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-gray-300 transition-colors">
                              <h4 className="font-semibold text-sm text-gray-900 leading-snug">
                                {fullPaper.title}
                              </h4>
                              
                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                <span className="text-gray-500">{fullPaper.publication_year || 'Unknown Year'}</span>
                                {fullPaper.venue && <span className="text-gray-500 truncate max-w-[120px]" title={fullPaper.venue}>• {fullPaper.venue}</span>}
                                {fullPaper.is_oa && <span className="text-green-600 font-medium bg-green-50 px-1.5 rounded">Open Access</span>}
                                <span className="text-gray-500">• {fullPaper.citation_count} Citations</span>
                              </div>

                              {fullPaper.authors.length > 0 && (
                                <p className="text-xs text-gray-600 mt-2 line-clamp-1">
                                  <span className="font-medium">Authors:</span> {fullPaper.authors.map(a => a.name).join(', ')}
                                </p>
                              )}
                              
                              <div className="mt-3 bg-gray-50 rounded p-2.5 border border-gray-100">
                                <p className="text-xs text-gray-600 line-clamp-3 italic leading-relaxed">
                                  {fullPaper.abstract}
                                </p>
                              </div>

                              <div className="mt-3 flex justify-between items-center">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  Similarity: {gapPaper.scores[selectedGap.gap_name].toFixed(3)}
                                </span>
                                <a href={fullPaper.id} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-medium">
                                  View on OpenAlex ↗
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400">Select a gap category to view papers.</div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}