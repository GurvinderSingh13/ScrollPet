import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';
import { Globe, Loader2, Filter, PawPrint, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Country, State, City } from 'country-state-city';

const getCategoryImageUrl = (cat: any) => {
  if (cat.image_url) return cat.image_url;
  const lower = cat.name.toLowerCase();
  if (lower.includes('dog')) return 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100&h=100&fit=crop';
  if (lower.includes('cat')) return 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop';
  if (lower.includes('bird')) return 'https://images.unsplash.com/photo-1552728089-5716928e3532?w=100&h=100&fit=crop';
  if (lower.includes('fish')) return 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=100&h=100&fit=crop';
  return `https://api.dicebear.com/7.x/initials/svg?seed=${cat.name}`;
};

type LocationScope = 'global' | 'country';

export default function HomeFeed() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch the True User Profile Row
  const { data: userProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Filters State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedBreedId, setSelectedBreedId] = useState<string>('');
  
  // Location Filter State (Feed State Variables)
  const [viewedScope, setViewedScope] = useState<LocationScope>('country');
  const [viewedCountryCode, setViewedCountryCode] = useState<string>('');
  const [filterStateCode, setFilterStateCode] = useState<string>('');
  const [filterCityName, setFilterCityName] = useState<string>('');

  // Global Search State from URL
  const [searchQuery, setSearchQuery] = useState(() => new URLSearchParams(window.location.search).get('q') || '');

  useEffect(() => {
    const handlePopState = () => {
      setSearchQuery(new URLSearchParams(window.location.search).get('q') || '');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const currentUser = userProfile || user;
  const viewedCountry = viewedCountryCode ? Country.getCountryByCode(viewedCountryCode)?.name : '';

  // Auto-set country scope default if user has country, else global
  useEffect(() => {
    if (currentUser?.country) {
      setViewedScope('country');
      const uCountry = currentUser.country.trim().toLowerCase();
      const c = Country.getAllCountries().find(c => c.name.toLowerCase() === uCountry || c.isoCode.toLowerCase() === uCountry);
      if (c) setViewedCountryCode(c.isoCode);
    } else {
      setViewedScope('global');
    }
  }, [currentUser]);

  const allCountries = Country.getAllCountries();
  const availableStates = viewedCountryCode ? State.getStatesOfCountry(viewedCountryCode) : [];
  const availableCities = viewedCountryCode && filterStateCode ? City.getCitiesOfState(viewedCountryCode, filterStateCode) : [];

  // Fetch Categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name, image_url').order('name');
      const cats = data || [];
      // 1. Left Sidebar Update: Add 'Other' option
      if (!cats.find(c => c.name.toLowerCase() === 'other')) {
        cats.push({ id: 'other', name: 'Other', image_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Other' });
      }
      return cats;
    }
  });

  // Fetch Breeds for selected Category
  const { data: breeds = [], isLoading: loadingBreeds } = useQuery({
    queryKey: ['breeds', selectedCategoryId],
    enabled: !!selectedCategoryId,
    queryFn: async () => {
      const { data } = await supabase.from('breeds').select('id, name').eq('category_id', selectedCategoryId).order('name');
      return data || [];
    }
  });

  // Fetch Posts based on filters
  const { data: posts = [], isLoading: loadingPosts, error: fetchError } = useQuery({
    queryKey: ['feed-posts', selectedCategoryId, selectedBreedId, viewedScope, viewedCountryCode, filterStateCode, filterCityName, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply Category / Breed Filters
      if (selectedCategoryId && selectedCategoryId !== 'all') {
        if (selectedCategoryId === 'other') {
          query = query.is('category', null);
        } else {
          query = query.eq('category', selectedCategoryId);
        }
      }
      if (selectedBreedId && selectedBreedId !== 'all') {
        query = query.eq('breed', selectedBreedId);
      }

      // Apply Location Filters
      // A post matches if its visibility scope includes the viewer's current location filters.
      // E.g. If viewing "country", we want posts that are either "global" or "country" = viewedCountry.
      
      const conditions: string[] = [];
      
      if (viewedScope === 'global') {
        // If viewing globally, just fetch global posts
        conditions.push(`visibility_level.eq.global`);
      } else if (viewedScope === 'country') {
        const cName = viewedCountry || '';
        if (cName) {
          // fetch global + country matches
          conditions.push(`visibility_level.eq.global`);
          conditions.push(`and(visibility_level.eq.country,country.eq.${cName})`);
          
          if (filterStateCode) {
            const stateObj = State.getStateByCodeAndCountry(filterStateCode, viewedCountryCode);
            const sName = stateObj?.name || '';
            if (sName) {
              conditions.push(`and(visibility_level.eq.state,country.eq.${cName},state.eq.${sName})`);
              if (filterCityName) {
                conditions.push(`and(visibility_level.eq.city,country.eq.${cName},state.eq.${sName},city.eq.${filterCityName})`);
              } else {
                // If no specific city filter, show ALL posts within this state
                conditions.push(`and(visibility_level.eq.city,country.eq.${cName},state.eq.${sName})`);
              }
            }
          } else {
            // If no specific state/city filter, show ALL posts within this country
            conditions.push(`and(visibility_level.eq.state,country.eq.${cName})`);
            conditions.push(`and(visibility_level.eq.city,country.eq.${cName})`);
          }
        }
      }

      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      }

      // Apply Text Search Filter (Additive)
      if (searchQuery.trim()) {
        const sq = `%${searchQuery.trim()}%`;
        query = query.or(`title.ilike.${sq},content.ilike.${sq}`);
      }

      const { data: fetchedPosts, error } = await query;
      if (error) {
        console.error("Supabase Feed Fetch Inner Error:", error);
        throw error;
      }
      
      if (!fetchedPosts || fetchedPosts.length === 0) return [];

      const userIds = Array.from(new Set(fetchedPosts.map((p: any) => p.user_id).filter(Boolean)));
      let authors: any[] = [];
      
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, display_name, username, profile_image_url')
          .in('id', userIds);
          
        if (usersError) {
          console.error("Supabase Feed Fetch Users Error:", usersError);
        } else if (usersData) {
          authors = usersData;
        }
      }

      const feedData = fetchedPosts.map((post: any) => ({
        ...post,
        users: authors.find(a => a.id === post.user_id) || null
      }));

      return feedData;
    }
  });

  if (fetchError) console.error("Supabase Feed Fetch Error:", fetchError);
  console.log("Fetched Posts:", posts);

  const handleRestrictedAction = (e: React.MouseEvent, post?: any) => {
    e.preventDefault();
    if (!isAuthenticated || !currentUser) {
      toast({ description: "You must be logged in to like or comment.", variant: "destructive" });
      return false;
    }
    // We visually disable the buttons if they are in read-only mode, but if they somehow click it:
    const isForeignCountry = viewedScope === 'country' && currentUser.country?.trim().toLowerCase() !== viewedCountry?.trim().toLowerCase();
    if (isForeignCountry) {
      toast({ description: "You cannot interact with posts in a foreign country. Read-only mode.", variant: "destructive" });
      return false;
    }
    return true;
  };

  // 3. Permission Matrix Logic helper
  const isReadOnlyMode = isAuthenticated && viewedScope === 'country' && currentUser?.country?.trim().toLowerCase() !== viewedCountry?.trim().toLowerCase();

  const [editingPost, setEditingPost] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const handleEditClick = (post: any) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  const handleUpdatePost = async () => {
    if (!editTitle || !editContent) return;
    const { error } = await supabase.from('posts').update({ title: editTitle, content: editContent }).eq('id', editingPost.id);
    if (error) {
      toast({ description: "Failed to update post.", variant: "destructive" });
    } else {
      toast({ description: "Post updated successfully!" });
      setEditingPost(null);
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      toast({ description: "Failed to delete post.", variant: "destructive" });
    } else {
      toast({ description: "Post deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
    }
  };

  const renderFilters = () => (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search posts..." 
            className="w-full pl-9 bg-gray-50 border-gray-200 focus-visible:ring-1 focus-visible:ring-[#007699]"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              const newUrl = val ? `/?q=${encodeURIComponent(val)}` : '/';
              window.history.replaceState(null, '', newUrl);
              window.dispatchEvent(new Event('popstate'));
            }}
          />
        </div>
      </div>

      {/* Location Toggle */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4" /> Location Scope
        </h3>
        <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
          <button 
            onClick={() => setViewedScope('global')}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${viewedScope === 'global' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Global
          </button>
          <button 
            onClick={() => setViewedScope('country')}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${viewedScope === 'country' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {viewedCountryCode ? Country.getCountryByCode(viewedCountryCode)?.name || currentUser?.country || 'My Country' : currentUser?.country || 'Select Country'}
          </button>
        </div>

        {viewedScope === 'country' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
            <Select value={viewedCountryCode || "none"} onValueChange={(val) => {
              setViewedCountryCode(val === "none" ? "" : val);
              setFilterStateCode("");
              setFilterCityName("");
            }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={currentUser?.country || "Select Country"} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="none">{currentUser?.country || "Select Country"}</SelectItem>
                {allCountries.map((c) => (
                  <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {viewedCountryCode && (
              <Select value={filterStateCode || "all"} onValueChange={(val) => {
                setFilterStateCode(val === "all" ? "" : val);
                setFilterCityName("");
              }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All States</SelectItem>
                  {availableStates.map((s) => (
                    <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {filterStateCode && (
              <Select value={filterCityName || "all"} onValueChange={(val) => setFilterCityName(val === "all" ? "" : val)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Cities</SelectItem>
                  {availableCities.map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4" /> Categories
        </h3>
        {loadingCategories ? (
          <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
        ) : (
          <div className="space-y-1">
            <div>
              <button
                onClick={() => { setSelectedCategoryId('all'); setSelectedBreedId('all'); }}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${!selectedCategoryId || selectedCategoryId === 'all' ? 'bg-[#007699]/10 text-[#007699] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                  <Globe className="w-4 h-4" />
                </div>
                <span>All Posts</span>
              </button>
            </div>
            {categories.map((cat: any) => (
              <div key={cat.id}>
                <button
                  onClick={() => { setSelectedCategoryId(cat.id); setSelectedBreedId('all'); }}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${selectedCategoryId === cat.id ? 'bg-[#007699]/10 text-[#007699] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  <img 
                    src={getCategoryImageUrl(cat)} 
                    alt={cat.name} 
                    className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0 bg-gray-100" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${cat.name}`;
                    }}
                  />
                  <span className="truncate">{cat.name}</span>
                </button>
                {/* Dynamic Breed Filter under Active Category */}
                {selectedCategoryId === cat.id && (
                  <div className="mt-2 ml-10 mb-2 animate-in fade-in slide-in-from-top-1">
                    <Select value={selectedBreedId || 'all'} onValueChange={setSelectedBreedId}>
                      <SelectTrigger className="h-8 text-sm bg-gray-50 border-gray-200">
                        <SelectValue placeholder="All Breeds" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="all">All Breeds</SelectItem>
                        {breeds.map((b: any) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT SIDEBAR: FILTERS */}
        <div className="lg:col-span-3 space-y-6 hidden md:block">
          {renderFilters()}
        </div>

        {/* MAIN FEED COLUMN */}
        <div className="lg:col-span-6 space-y-6">
          <div className="md:hidden flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-200">
            <span className="font-bold text-gray-800">Community Feed</span>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] sm:w-[350px] overflow-y-auto pt-10">
                <SheetHeader className="mb-4 text-left">
                  <SheetTitle>Filters & Categories</SheetTitle>
                </SheetHeader>
                {renderFilters()}
              </SheetContent>
            </Sheet>
          </div>

          <CreatePost viewedScope={viewedScope} viewedCountry={viewedCountry} currentUser={currentUser} />

          <div className="space-y-6">
            {loadingPosts ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center flex flex-col items-center justify-center">
                <PawPrint className="w-12 h-12 text-gray-300 mb-4 opacity-50" />
                <h3 className="font-bold text-lg text-gray-800 mb-2">No posts found</h3>
                <p className="text-gray-500 text-sm max-w-sm">
                  No posts found in this category/location yet. Be the first to post!
                </p>
              </div>
            ) : (
              // Real Posts Mapping
              posts.map((post: any) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUser={currentUser} 
                  isReadOnlyMode={isReadOnlyMode} 
                  handleRestrictedAction={handleRestrictedAction}
                  handleEditClick={handleEditClick}
                  handleDeletePost={handleDeletePost}
                />
              ))
            )}
          </div>
        </div>
        
        {/* RIGHT SIDEBAR (Empty for now, keeps feed centered) */}
        <div className="lg:col-span-3 hidden lg:block">
          {/* Future widget space */}
        </div>
        
      </div>

      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input 
                value={editTitle} 
                onChange={e => setEditTitle(e.target.value)} 
                placeholder="Post title"
              />
            </div>
            <div className="space-y-2">
              <Textarea 
                value={editContent} 
                onChange={e => setEditContent(e.target.value)} 
                placeholder="What's on your mind?"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPost(null)}>Cancel</Button>
            <Button onClick={handleUpdatePost} disabled={!editTitle || !editContent} className="bg-[#007699] hover:bg-[#005a75] text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
