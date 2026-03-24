import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Clock,
  Ban,
  Users,
  Search,
} from "lucide-react";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";
import { toast } from "@/hooks/use-toast";

const canBanTarget = (myRole: string, targetRole: string) => {
  if (myRole === "admin") return targetRole !== "admin";
  if (myRole === "staff") return !["admin", "staff"].includes(targetRole);
  if (myRole === "super_moderator")
    return !["admin", "staff", "super_moderator"].includes(targetRole);
  if (myRole === "moderator") return targetRole === "user";
  return false;
};

const getAvailableDurations = (role: string) => {
  const base = [
    { label: "6 Hours", value: "6h" },
    { label: "12 Hours", value: "12h" },
    { label: "24 Hours", value: "24h" },
  ];
  if (role === "moderator") return base;
  const superMod = [
    ...base,
    { label: "3 Days", value: "3d" },
    { label: "7 Days", value: "7d" },
  ];
  if (role === "super_moderator") return superMod;
  return [
    ...superMod,
    { label: "30 Days", value: "30d" },
    { label: "1 Year", value: "1y" },
    { label: "Permanent", value: "permanent" },
  ];
};

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [banDuration, setBanDuration] = useState<string>("24h");
  const [isProcessing, setIsProcessing] = useState(false);

  // NEW: Role Management States
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("user");
  const [isSearching, setIsSearching] = useState(false);

  const { data: dbUser, isLoading: userLoading } = useQuery({
    queryKey: ["db-user-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isModOrAbove =
    dbUser &&
    ["moderator", "super_moderator", "staff", "admin"].includes(dbUser.role);

  useEffect(() => {
    if (!authLoading && !userLoading) {
      if (!user || (dbUser && !isModOrAbove)) {
        toast({
          description: "Access Denied. Authority clearance required.",
          variant: "destructive",
        });
        setLocation("/");
      }
    }
  }, [user, dbUser, authLoading, userLoading, setLocation, isModOrAbove]);

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data: rawReports, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!rawReports || rawReports.length === 0) return [];

      const userIds = [
        ...new Set(
          rawReports
            .flatMap((r) => [r.reporter_id, r.reported_user_id])
            .filter(Boolean),
        ),
      ];
      const { data: usersData } = await supabase
        .from("users")
        .select("id, username, display_name, role")
        .in("id", userIds);

      const msgIds = [
        ...new Set(rawReports.map((r) => r.message_id).filter(Boolean)),
      ];
      let messagesData: any[] = [];
      if (msgIds.length > 0) {
        // NEW: Fetching pet_type for accurate teleporting
        const { data: mData } = await supabase
          .from("messages")
          .select("id, content, location, pet_type")
          .in("id", msgIds);
        messagesData = mData || [];
      }

      return rawReports.map((report) => {
        const reporterUser = usersData?.find(
          (u) => u.id === report.reporter_id,
        );
        const reportedUser = usersData?.find(
          (u) => u.id === report.reported_user_id,
        );
        const msg = messagesData?.find((m) => m.id === report.message_id);

        return {
          id: report.id,
          reason: report.reason,
          created_at: report.created_at,
          reporter: reporterUser || { display_name: "Unknown User" },
          reported: reportedUser || {
            id: report.reported_user_id,
            display_name: "Unknown User",
            role: "user",
          },
          message: msg || {
            content: "Media file or deleted message",
            location: "Unknown",
            pet_type: "dog",
          },
        };
      });
    },
    enabled: isModOrAbove,
  });

  // NEW: Search for a user to promote
  const handleSearchUser = async () => {
    if (!searchUsername.trim()) return;
    setIsSearching(true);
    setSearchedUser(null);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, display_name, role")
        .ilike("username", searchUsername.trim())
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSearchedUser(data);
        setNewRole(data.role || "user");
      } else {
        toast({
          description: "No user found with that username.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({ description: "Search failed.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  // NEW: Save the new role
  const handleUpdateRole = async () => {
    if (!searchedUser) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", searchedUser.id);
      if (error) throw error;
      toast({
        description: `Successfully promoted @${searchedUser.username} to ${newRole.replace("_", " ")}!`,
      });
      setIsRoleModalOpen(false);
      setSearchUsername("");
      setSearchedUser(null);
    } catch (err: any) {
      toast({ description: "Failed to update role.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenAction = (report: any) => {
    if (!canBanTarget(dbUser.role, report.reported.role || "user")) {
      toast({
        description: `Your rank (${dbUser.role}) cannot take action against a ${report.reported.role || "user"}.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedReport(report);
    setIsActionModalOpen(true);
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportId);
      if (error) throw error;
      toast({ description: "Report dismissed and removed from queue." });
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    } catch (err: any) {
      toast({
        description: "Failed to dismiss report.",
        variant: "destructive",
      });
    }
  };

  const handleIssueBan = async () => {
    if (!selectedReport || !user) return;
    setIsProcessing(true);

    try {
      let expiresAt = null;
      if (banDuration !== "permanent") {
        const now = new Date();
        if (banDuration === "6h") now.setHours(now.getHours() + 6);
        else if (banDuration === "12h") now.setHours(now.getHours() + 12);
        else if (banDuration === "24h") now.setHours(now.getHours() + 24);
        else if (banDuration === "3d") now.setDate(now.getDate() + 3);
        else if (banDuration === "7d") now.setDate(now.getDate() + 7);
        else if (banDuration === "30d") now.setDate(now.getDate() + 30);
        else if (banDuration === "1y") now.setFullYear(now.getFullYear() + 1);
        expiresAt = now.toISOString();
      }

      const { error: banError } = await supabase.from("bans").insert({
        user_id: selectedReport.reported.id,
        banned_by: user.id,
        reason: `Violated terms: ${selectedReport.reason}`,
        expires_at: expiresAt,
      });
      if (banError) throw banError;

      const { error: deleteError } = await supabase
        .from("reports")
        .delete()
        .eq("id", selectedReport.id);
      if (deleteError) throw deleteError;

      toast({ description: `Ban issued successfully for ${banDuration}.` });
      setIsActionModalOpen(false);
      setSelectedReport(null);
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    } catch (err: any) {
      toast({
        description: err.message || "Failed to issue ban.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || userLoading || !isModOrAbove) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#007699]" />
      </div>
    );
  }

  const availableDurations = getAvailableDurations(dbUser.role);

  return (
    <div className="min-h-screen bg-[#F5F7F9] font-sans">
      <header className="bg-[#00789c] text-white shadow-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/user-profile"
              className="cursor-pointer hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Shield className="w-6 h-6 text-orange-400" />
            <h1 className="text-xl font-bold tracking-wide">
              Moderation Dashboard
            </h1>
            <span className="bg-orange-500/20 text-orange-200 border border-orange-500/50 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ml-2">
              {dbUser.role.replace("_", " ")}
            </span>
          </div>

          {/* NEW: Manage Team Button (Admin Only) */}
          <div className="flex items-center gap-4">
            {dbUser.role === "admin" && (
              <Button
                onClick={() => setIsRoleModalOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 border text-sm h-9 cursor-pointer"
              >
                <Users className="w-4 h-4 mr-2" /> Manage Team Roles
              </Button>
            )}
            <img
              src={logoImage}
              alt="Logo"
              className="h-8 brightness-0 invert opacity-80"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-white border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-amber-500" /> Active
                  Reports Queue
                </CardTitle>
                <CardDescription className="mt-1 text-gray-500">
                  Review user reports and issue disciplinary actions based on
                  your authority level.
                </CardDescription>
              </div>
              <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold text-gray-600">
                {reports?.length || 0} Pending Tickets
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {reportsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#007699]" />
                <p>Loading reports database...</p>
              </div>
            ) : !reports || reports.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                <CheckCircle className="w-16 h-16 mb-4 text-emerald-400/50" />
                <p className="text-lg font-medium text-gray-600">
                  The queue is empty!
                </p>
                <p className="text-sm">
                  No active user reports require moderation.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/80 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Reported User</th>
                      <th className="px-6 py-4">Context / Location</th>
                      <th className="px-6 py-4">Violation Reason</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reports.map((report: any) => (
                      <tr
                        key={report.id}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">
                            @
                            {report.reported?.display_name ||
                              report.reported?.username}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">
                            Role: {report.reported?.role || "user"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-500 max-w-[250px] truncate italic mb-1">
                            "{report.message?.content}"
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="text-[10px] font-mono text-[#007699] bg-[#007699]/10 inline-block px-1.5 py-0.5 rounded">
                              {report.message?.location}
                            </div>

                            {/* NEW: Teleport Button! */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px] text-[#007699] hover:text-[#005a75] border border-[#007699]/20 cursor-pointer"
                              onClick={() => {
                                sessionStorage.setItem(
                                  "teleport_location",
                                  report.message.location,
                                );
                                if (report.message.pet_type)
                                  sessionStorage.setItem(
                                    "teleport_pet",
                                    report.message.pet_type,
                                  );
                                setLocation("/chat-interface");
                              }}
                            >
                              Teleport to Chat ↗
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                            {report.reason}
                          </span>
                          <div className="text-xs text-gray-400 mt-2">
                            Reported by @{report.reporter?.display_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 cursor-pointer"
                            onClick={() => handleDismissReport(report.id)}
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white shadow-sm cursor-pointer"
                            onClick={() => handleOpenAction(report)}
                          >
                            Take Action
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Action Ban Modal */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="w-5 h-5" /> Issue Server Ban
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-5 py-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                <p className="text-gray-500 mb-1">Target User:</p>
                <p className="font-bold text-gray-900">
                  @
                  {selectedReport.reported?.display_name ||
                    selectedReport.reported?.username}
                </p>
                <p className="text-gray-500 mt-3 mb-1">Violation:</p>
                <p className="font-medium text-red-700">
                  {selectedReport.reason}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#007699]" /> Select Ban
                  Duration
                </label>
                <Select value={banDuration} onValueChange={setBanDuration}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select duration..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDurations.map((dur) => (
                      <SelectItem key={dur.value} value={dur.value}>
                        {dur.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">
                  Your rank ({dbUser?.role}) authorizes limits up to{" "}
                  {availableDurations[availableDurations.length - 1].label}.
                </p>
              </div>
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                onClick={handleIssueBan}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isProcessing ? "Processing..." : "Enforce Ban"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* NEW: Role Management Modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#00789c]">
              <Users className="w-5 h-5" /> Manage Team Roles
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Search Section */}
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Search by Username
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. JohnDoe123"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00789c]/20 outline-none"
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
                  />
                </div>
              </div>
              <Button
                onClick={handleSearchUser}
                disabled={isSearching || !searchUsername}
                className="bg-[#00789c] hover:bg-[#005a75] text-white px-4 cursor-pointer"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>

            {/* Promotion Section */}
            {searchedUser && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4">
                <div className="flex items-center gap-3 border-b border-blue-200/50 pb-3">
                  <div className="w-10 h-10 bg-white rounded-full border shadow-sm flex items-center justify-center font-bold text-[#00789c]">
                    {searchedUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      @{searchedUser.username}
                    </p>
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      Current: {searchedUser.role.replace("_", " ")}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Assign New Role
                  </label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select role..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Normal User (Demote)</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="super_moderator">
                        Super Moderator
                      </SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full bg-[#00789c] hover:bg-[#005a75] text-white font-bold cursor-pointer"
                  onClick={handleUpdateRole}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isProcessing ? "Updating..." : "Update Role"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
