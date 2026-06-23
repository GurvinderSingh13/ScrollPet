import { useState, useEffect, useRef } from "react";
import { Search, X, User, PawPrint } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

type SearchResult = {
  id: string;
  type: "user" | "pet";
  title: string;
  subtitle: string;
  image: string | null;
};

export function ExploreSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [scope, setScope] = useState<"all" | "users" | "pets">("all");
  const [, setLocation] = useLocation();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("scrollpet_recent_searches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      const searchStr = `%${query.trim()}%`;
      
      const promises = [];
      let usersRes: any = { data: null };
      let petsRes: any = { data: null };

      if (scope === "all" || scope === "users") {
        promises.push(
          supabase.from("users")
            .select("id, username, display_name, profile_image_url")
            .or(`username.ilike.${searchStr},display_name.ilike.${searchStr}`)
            .limit(scope === "users" ? 10 : 5)
            .then(res => usersRes = res)
        );
      }

      if (scope === "all" || scope === "pets") {
        promises.push(
          supabase.from("pets")
            .select("id, handle, name, image_url")
            .or(`handle.ilike.${searchStr},name.ilike.${searchStr}`)
            .limit(scope === "pets" ? 10 : 5)
            .then(res => petsRes = res)
        );
      }

      await Promise.all(promises);

      const formattedResults: SearchResult[] = [];
      if (usersRes.data) {
        usersRes.data.forEach((u: any) => {
          formattedResults.push({
            id: u.id,
            type: "user",
            title: u.display_name || u.username,
            subtitle: u.username ? `@${u.username}` : '',
            image: u.profile_image_url
          });
        });
      }
      if (petsRes.data) {
        petsRes.data.forEach((p: any) => {
          formattedResults.push({
            id: p.id,
            type: "pet",
            title: p.name,
            subtitle: p.handle ? `@${p.handle}` : '',
            image: p.image_url
          });
        });
      }

      setResults(formattedResults);
      setIsLoading(false);
    };

    const debounceTimer = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, scope]);

  const handleSelectResult = (result: SearchResult) => {
    setIsFocused(false);
    setQuery("");
    
    // Save to recents
    const newRecents = [result.title, ...recentSearches.filter(r => r !== result.title)].slice(0, 5);
    setRecentSearches(newRecents);
    localStorage.setItem("scrollpet_recent_searches", JSON.stringify(newRecents));

    if (result.type === "user") {
      setLocation(`/profile/${result.id}`);
    } else {
      setLocation(`/pet/${result.id}`);
    }
  };

  const handleSelectRecent = (recentQuery: string) => {
    setQuery(recentQuery);
  };

  const handleRemoveRecent = (recentQuery: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newRecents = recentSearches.filter(r => r !== recentQuery);
    setRecentSearches(newRecents);
    localStorage.setItem("scrollpet_recent_searches", JSON.stringify(newRecents));
  };

  return (
    <div className="relative w-full max-w-xl mx-auto z-50 mb-6" ref={wrapperRef}>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={scope === "users" ? "Search users..." : scope === "pets" ? "Search pets..." : "Search for people and pets..."}
            className="w-full pl-12 pr-10 h-12 rounded-2xl bg-white border border-gray-200 focus-visible:ring-1 focus-visible:ring-primary shadow-sm text-base placeholder:text-gray-400 font-medium"
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        <select 
          value={scope} 
          onChange={(e) => setScope(e.target.value as "all" | "users" | "pets")}
          className="h-12 rounded-2xl bg-white border border-gray-200 px-4 pr-8 text-sm font-medium text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm cursor-pointer shrink-0"
        >
          <option value="all">All</option>
          <option value="users">Users</option>
          <option value="pets">Pets</option>
        </select>
      </div>

      {isFocused && (query.trim() || recentSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {!query.trim() ? (
            <div className="py-2">
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Recent Searches</span>
                {recentSearches.length > 0 && (
                  <button onClick={() => { setRecentSearches([]); localStorage.removeItem("scrollpet_recent_searches"); }} className="text-sm font-semibold text-[#007699] hover:text-[#005a75]">Clear all</button>
                )}
              </div>
              {recentSearches.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">No recent searches.</div>
              ) : (
                recentSearches.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => handleSelectRecent(r)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center bg-gray-50">
                        <Search className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{r}</span>
                    </div>
                    <button onClick={(e) => handleRemoveRecent(r, e)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="py-2">
              {isLoading ? (
                <div className="px-4 py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#007699]"></div>
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">No results found for "{query}"</div>
              ) : (
                results.map((result) => (
                  <div 
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelectResult(result)}
                    className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {result.image ? (
                      <img src={result.image} alt={result.title} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center bg-gray-50">
                        {result.type === "user" ? <User className="w-5 h-5 text-gray-400" /> : <PawPrint className="w-5 h-5 text-gray-400" />}
                      </div>
                    )}
                    <div className="ml-3 flex-1 overflow-hidden">
                      <p className="text-sm font-semibold text-gray-900 truncate">{result.title}</p>
                      <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                    </div>
                    <div className="ml-2 px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                      {result.type === "user" ? "User" : "Pet"}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
