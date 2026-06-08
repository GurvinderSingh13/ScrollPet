import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImagePlus, MapPin, Video, Send } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Country, State, City } from 'country-state-city';

type LocationScope = 'global' | 'country';

interface CreatePostProps {
  viewedScope?: string;
  viewedCountry?: string;
  currentUser?: any;
}

export default function CreatePost({ viewedScope, viewedCountry, currentUser }: CreatePostProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const [categoryId, setCategoryId] = useState<string>('');
  const [breedId, setBreedId] = useState<string>('');
  
  const [postScope, setPostScope] = useState<LocationScope>('global');
  const [countryCode, setCountryCode] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');

  // 1. Fetch the True User Profile Row
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useQuery({
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

  if (profileError) {
    console.error("Profile Fetch Error:", profileError);
  }

  // 2. Map the Variables to the Profile Row
  const canEditCountry = ['admin', 'moderator', 'super_moderator', 'staff'].includes(userProfile?.role?.toLowerCase() || '');
  const actualCountryName = userProfile?.country;

  // Fetch Categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name, image_url').order('name');
      const cats = data || [];
      if (!cats.find(c => c.name.toLowerCase() === 'other')) {
        cats.push({ id: 'other', name: 'Other', image_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Other' });
      }
      return cats;
    }
  });

  // Fetch Breeds based on selected Category
  const { data: breeds = [], isLoading: loadingBreeds } = useQuery({
    queryKey: ['breeds', categoryId],
    enabled: !!categoryId,
    queryFn: async () => {
      const { data } = await supabase.from('breeds').select('id, name').eq('category_id', categoryId).order('name');
      return data || [];
    }
  });

  // Auto-fill effects on user profile load
  useEffect(() => {
    if (userProfile) {
      if (userProfile.country) {
        const uCountry = userProfile.country.trim().toLowerCase();
        const c = Country.getAllCountries().find(x => x.name.toLowerCase() === uCountry || x.isoCode.toLowerCase() === uCountry);
        if (c) {
          setCountryCode(c.isoCode);
          setPostScope('country'); // Default to their country if they have one set
          
          if (userProfile.state) {
             const uState = userProfile.state.trim().toLowerCase();
             const s = State.getStatesOfCountry(c.isoCode).find(x => x.name.toLowerCase() === uState || x.isoCode.toLowerCase() === uState);
             if (s) setSelectedStateCode(s.isoCode);
          }
        }
      }
    }
  }, [userProfile]);

  const allCountries = Country.getAllCountries();
  const availableStates = countryCode ? State.getStatesOfCountry(countryCode) : [];

  if (!isAuthenticated) return null; // Only authenticated users see CreatePost
  
  // 4. Permission Matrix Logic: hide if viewing a foreign country
  const isForeignCountry = viewedScope === 'country' && userProfile?.country?.trim().toLowerCase() !== viewedCountry?.trim().toLowerCase();
  if (isForeignCountry) return null;

  const handleSubmit = async () => {
    try {
      const finalCountry = countryCode ? Country.getCountryByCode(countryCode)?.name : null;
      const finalState = selectedStateCode ? State.getStateByCodeAndCountry(selectedStateCode, countryCode)?.name : null;

      let visibility_level = 'global';
      if (postScope === 'country') {
        if (finalState) visibility_level = 'state';
        else visibility_level = 'country';
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user?.id,
        title,
        content,
        category: categoryId === 'other' || !categoryId ? null : categoryId,
        breed: breedId || null,
        visibility_level: visibility_level,
        country: visibility_level !== 'global' ? finalCountry : null,
        state: visibility_level === 'state' ? (finalState || null) : null,
      });
      if (error) throw error;
      toast({ description: "Post created successfully!", variant: "default" });
      setTitle('');
      setContent('');
      setCategoryId('');
      setBreedId('');
      setPostScope('global');
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
    } catch (err: any) {
      toast({ description: err.message || "Failed to create post.", variant: "destructive" });
    }
  };

  if (isProfileLoading) {
    return <div className="p-4 text-center text-gray-500">Loading profile data...</div>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* FACEBOOK STYLE TRIGGER BOX */}
      <DialogTrigger asChild>
        <Card className="mb-6 shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex gap-3 items-center mb-3">
              <img 
                src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full border border-gray-200"
              />
              <div className="bg-gray-100 hover:bg-gray-200 transition-colors flex-1 rounded-full px-4 py-2.5 text-left text-gray-500 text-sm">
                What's on your mind, {user?.displayName || 'ScrollPet'}?
              </div>
            </div>
            <div className="flex justify-around border-t border-gray-100 pt-3">
              <Button variant="ghost" className="flex-1 text-gray-600 gap-2 hover:bg-red-50 hover:text-red-600">
                <Video className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-sm">Video</span>
              </Button>
              <Button variant="ghost" className="flex-1 text-gray-600 gap-2 hover:bg-green-50 hover:text-green-600">
                <ImagePlus className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-sm">Photo</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      {/* MODAL CONTENT */}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3 mb-4">
          <DialogTitle className="text-center text-xl font-bold">Create Post</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-3 items-center mb-4">
          <img 
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
            alt="Avatar" 
            className="w-10 h-10 rounded-full border border-gray-200"
          />
          <div>
            <div className="font-semibold text-sm">{currentUser?.displayName || user?.displayName || user?.username || 'User'}</div>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md inline-flex mt-1 items-center gap-1">
              <MapPin className="w-3 h-3" /> {postScope === 'global' ? 'Global' : (Country.getCountryByCode(countryCode)?.name || actualCountryName || 'My Country')}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</Label>
            <Input 
              placeholder="Give your post a title..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-medium focus-visible:ring-1"
            />
          </div>

          <div className="space-y-1">
            <Textarea 
              placeholder="What do you want to share?" 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none text-lg border-none focus-visible:ring-0 p-0 shadow-none placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            {/* Pet Category & Breed */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Pet Details</h3>
              <div className="grid grid-cols-2 gap-2">
                <Select value={categoryId} onValueChange={(val) => { setCategoryId(val); setBreedId(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCategories ? "Loading..." : "Category *"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={breedId} onValueChange={setBreedId} disabled={!categoryId || loadingBreeds}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingBreeds ? "Loading..." : "Breed (Opt)"} />
                  </SelectTrigger>
                  <SelectContent>
                    {breeds.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location / Scope */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Visibility</h3>
              <Select value={postScope} onValueChange={(val) => setPostScope(val as LocationScope)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (Everyone)</SelectItem>
                  <SelectItem value="country">{actualCountryName || 'My Country'}</SelectItem>
                </SelectContent>
              </Select>

              {postScope === 'country' && (
                <div className="grid gap-2 grid-cols-1 animate-in fade-in">
                  {!actualCountryName && !canEditCountry ? (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                      You must set your country in your <a href="/settings" className="underline font-bold">Profile Settings</a> before you can make country-specific posts.
                    </div>
                  ) : (
                    <>
                      {!canEditCountry ? (
                        <Input 
                          disabled 
                          value={actualCountryName} 
                          className="h-9 text-sm bg-gray-100 text-gray-600 font-semibold cursor-not-allowed opacity-80" 
                        />
                      ) : (
                        <Select value={countryCode || "none"} onValueChange={(val) => {
                          setCountryCode(val === "none" ? "" : val);
                          setSelectedStateCode("");
                        }}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder={actualCountryName || "Select Country"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            <SelectItem value="none">Select Country</SelectItem>
                            {allCountries.map((c) => (
                              <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {/* State selector renders immediately below the Country block (if country exists) */}
                      {(countryCode || actualCountryName) && (
                        <Select value={selectedStateCode || "none"} onValueChange={(val) => {
                          setSelectedStateCode(val === "none" ? "" : val);
                        }}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="State (Optional)" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            <SelectItem value="none">All States</SelectItem>
                            {availableStates.map((s) => (
                              <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2">
          <Button 
            onClick={handleSubmit}
            disabled={!title || !content || (postScope === 'country' && !countryCode)}
            className="w-full bg-[#007699] hover:bg-[#005a75] text-white font-bold h-11"
          >
            Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
