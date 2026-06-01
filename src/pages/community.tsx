import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow, format } from "date-fns";
import { Search, MapPin, MessageCircle, Calendar } from "lucide-react";

type CommunityUser = {
  id: string;
  username: string;
  display_name: string | null;
  profile_image_url: string | null;
  created_at: string;
  last_seen: string | null;
  location?: string | null;
  country?: string | null;
  state?: string | null;
};

export default function CommunityDirectory() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [locationSearch, setLocationSearch] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Protect route
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setFetchError(null);
      const { data, error } = await supabase
        .from("users")
        .select("id, username, display_name, profile_image_url, created_at, last_seen, country, state")
        .order("created_at", { ascending: sortOrder === "oldest" });

      console.log('Supabase Response:', data);

      if (error) {
        console.error("Supabase Error:", error);
        setFetchError(error.message);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };

    fetchUsers();
  }, [sortOrder]);

  const handleMessageUser = (targetUser: CommunityUser) => {
    sessionStorage.setItem("teleport_dm_user_id", targetUser.id);
    sessionStorage.setItem("teleport_dm_user_name", targetUser.username);
    setLocation("/inbox");
  };

  const formatLocation = (country: string | null, state: string | null) => {
    if (country && state) return `${state}, ${country}`;
    if (country) return country;
    if (state) return state;
    return "Unknown Location";
  };

  // Filter users based on search and online status
  const filteredUsers = users.filter((u) => {
    // Location filter
    const locString = formatLocation(u.country, u.state).toLowerCase();
    if (locationSearch && !locString.includes(locationSearch.toLowerCase())) {
      return false;
    }

    // Online filter
    if (onlineOnly) {
      if (!u.last_seen) return false;
      const minutesSinceLastSeen = (new Date().getTime() - new Date(u.last_seen).getTime()) / 60000;
      if (minutesSinceLastSeen > 15) return false;
    }

    return true;
  });

  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl border border-red-200 shadow-sm">
          <h3 className="font-bold mb-1">Error loading users</h3>
          <p className="text-sm">{fetchError}</p>
        </div>
      </div>
    );
  }

  if (isLoading || (loading && users.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Directory</h1>
        <p className="text-gray-600">Connect with other members of the Scrollpet community.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by location..."
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
          />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(e) => setOnlineOnly(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            Online Now
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
            className="bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 py-2 pl-3 pr-8"
          >
            <option value="newest">Newest Members</option>
            <option value="oldest">Oldest Members</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500">No users found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((member) => {
            let isOnline = false;
            let statusText = "Never active";
            if (member.last_seen) {
              const minutesSince = (new Date().getTime() - new Date(member.last_seen).getTime()) / 60000;
              if (minutesSince <= 15) {
                isOnline = true;
                statusText = "Online Now";
              } else {
                statusText = `Last seen ${formatDistanceToNow(new Date(member.last_seen))} ago`;
              }
            }

            return (
              <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <Link href={`/profile/${member.username}`} className="shrink-0 cursor-pointer group">
                    {member.profile_image_url ? (
                      <img
                        src={member.profile_image_url}
                        alt={member.username}
                        className="w-14 h-14 rounded-full object-cover group-hover:opacity-90 transition-opacity"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl group-hover:bg-primary/20 transition-colors">
                        {(member.display_name || member.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${member.username}`} className="block truncate font-bold text-gray-900 hover:text-primary transition-colors cursor-pointer">
                      {member.display_name || member.username}
                    </Link>
                    <div className="text-xs text-gray-500 mb-1 truncate">@{member.username}</div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                      <span className="truncate">{statusText}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-5 flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{formatLocation(member.country, member.state)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>Joined {format(new Date(member.created_at), "MMM yyyy")}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleMessageUser(member)}
                  className="w-full flex items-center justify-center gap-2 bg-[#007699] hover:bg-[#005a75] text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
