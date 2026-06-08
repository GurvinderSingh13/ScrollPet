import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, Share2, MapPin, MoreHorizontal, Pencil, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface PostCardProps {
  post: any;
  currentUser: any;
  isReadOnlyMode: boolean;
  handleRestrictedAction: (e: React.MouseEvent, post?: any) => boolean;
  handleEditClick: (post: any) => void;
  handleDeletePost: (postId: string) => void;
}

export default function PostCard({
  post,
  currentUser,
  isReadOnlyMode,
  handleRestrictedAction,
  handleEditClick,
  handleDeletePost
}: PostCardProps) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // LIKES
  const { data: likesData, isLoading: loadingLikes } = useQuery({
    queryKey: ['post_likes', post.id],
    queryFn: async () => {
      const { data } = await supabase.from('post_likes').select('user_id').eq('post_id', post.id);
      return data || [];
    }
  });

  const isLiked = likesData?.some(like => like.user_id === currentUser?.id);
  const likeCount = likesData?.length || 0;

  const handleLike = async (e: React.MouseEvent) => {
    if (!handleRestrictedAction(e, post)) return;
    if (!currentUser?.id) return;
    
    // Optimistic UI updates could be done here.
    if (isLiked) {
      // Optimistic state
      queryClient.setQueryData(['post_likes', post.id], (old: any) => old?.filter((l: any) => l.user_id !== currentUser.id));
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUser.id);
    } else {
      // Optimistic state
      queryClient.setQueryData(['post_likes', post.id], (old: any) => [...(old || []), { user_id: currentUser.id }]);
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUser.id });
    }
    queryClient.invalidateQueries({ queryKey: ['post_likes', post.id] });
  };

  // COMMENTS
  const { data: commentsData = [], isLoading: loadingComments } = useQuery({
    queryKey: ['post_comments', post.id],
    queryFn: async () => {
      // Step 1: Fetch Comments
      const { data: comments, error } = await supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true });
      if (error || !comments) return [];
      if (comments.length === 0) return [];

      // Step 2: Extract user IDs
      const userIds = Array.from(new Set(comments.map((c: any) => c.user_id).filter(Boolean)));
      let authors: any[] = [];
      
      // Step 3: Fetch Users manually
      if (userIds.length > 0) {
        const { data: usersData } = await supabase.from('users').select('id, display_name, username, profile_image_url').in('id', userIds);
        if (usersData) authors = usersData;
      }

      // Merge
      return comments.map((comment: any) => ({
        ...comment,
        users: authors.find(a => a.id === comment.user_id) || null
      }));
    }
  });

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentUser?.id) return;
    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      user_id: currentUser.id,
      content: commentInput.trim()
    });
    if (!error) {
      setCommentInput("");
      queryClient.invalidateQueries({ queryKey: ['post_comments', post.id] });
    }
  };

  const handleEditCommentClick = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return;
    const { error } = await supabase.from('comments').update({ content: editingCommentText.trim() }).eq('id', commentId);
    if (!error) {
      setEditingCommentId(null);
      setEditingCommentText("");
      queryClient.invalidateQueries({ queryKey: ['post_comments', post.id] });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['post_comments', post.id] });
    }
  };

  const toggleComments = (e: React.MouseEvent) => {
    if (!handleRestrictedAction(e, post)) return;
    setShowComments(!showComments);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <img 
            src={post.users?.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`} 
            alt="Avatar" 
            className="w-10 h-10 rounded-full border border-gray-200 object-cover"
          />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm">{post.users?.display_name || post.users?.username || 'User'}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3"/> 
                {post.visibility_level === 'global' ? 'Global' : 
                 post.visibility_level === 'country' ? post.country :
                 post.visibility_level === 'state' ? `${post.state}, ${post.country}` :
                 `${post.city}, ${post.state}`}
              </span>
            </div>
          </div>

          {currentUser?.id === post.user_id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => handleEditClick(post)} className="cursor-pointer">
                  <Pencil className="w-4 h-4 mr-2" /> Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <h3 className="font-bold text-lg text-gray-800 mb-2">{post.title}</h3>
        <p className="text-gray-600 text-sm mb-4 whitespace-pre-wrap">{post.content}</p>
        {post.media_url && (
          <div className="mb-4 rounded-lg overflow-hidden border border-gray-100">
            <img src={post.media_url} alt="Post media" className="w-full h-auto object-cover max-h-96" />
          </div>
        )}
      </div>
      
      <div className="bg-gray-50/50 border-t border-gray-100 p-2 flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLike} 
          className={`flex-1 transition-colors ${isReadOnlyMode ? 'opacity-50 cursor-not-allowed text-gray-400' : isLiked ? 'text-red-500 hover:bg-red-50' : 'text-gray-600 hover:text-red-500 hover:bg-red-50'}`}
        >
          <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} /> Like {likeCount > 0 && `(${likeCount})`}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleComments} 
          className={`flex-1 transition-colors ${isReadOnlyMode ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-600 hover:text-[#007699] hover:bg-[#007699]/10'}`}
        >
          <MessageSquare className="w-4 h-4 mr-2" /> Comment {commentsData.length > 0 && `(${commentsData.length})`}
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 text-gray-600 hover:text-[#007699] hover:bg-[#007699]/10">
          <Share2 className="w-4 h-4 mr-2" /> Share
        </Button>
      </div>

      {showComments && (
        <div className="bg-gray-50 p-4 border-t border-gray-100 space-y-4">
          {/* Comments List */}
          <div className="space-y-4">
            {loadingComments ? (
              <div className="flex justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#007699]"></div></div>
            ) : commentsData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center">No comments yet. Be the first!</p>
            ) : (
              commentsData.map((comment: any) => {
                const isCommentOwner = currentUser?.id === comment.user_id;

                return (
                  <div key={comment.id} className="flex gap-3">
                    <img 
                      src={comment.users?.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                    />
                    <div className="flex-1">
                      {editingCommentId === comment.id ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
                          <Input 
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            className="mb-2 text-sm"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end mt-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                            <Button size="sm" onClick={() => handleUpdateComment(comment.id)} className="bg-[#007699] hover:bg-[#005a75] text-white">Save</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-3 shadow-sm relative group">
                          <div className="flex items-center justify-between mb-1 pr-6">
                            <span className="font-semibold text-xs text-gray-900">{comment.users?.display_name || comment.users?.username || 'User'}</span>
                            <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap pr-6">{comment.content}</p>
                          
                          {isCommentOwner && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-900">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-32">
                                  <DropdownMenuItem onClick={() => handleEditCommentClick(comment)} className="cursor-pointer text-xs">
                                    <Pencil className="w-3 h-3 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="cursor-pointer text-xs text-red-600 focus:text-red-600 focus:bg-red-50">
                                    <Trash2 className="w-3 h-3 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Comment Input */}
          {!isReadOnlyMode && (
            <form onSubmit={handleCommentSubmit} className="flex gap-2 relative mt-2">
              <img 
                src={currentUser?.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.id}`} 
                alt="Your Avatar" 
                className="w-8 h-8 rounded-full border border-gray-200 object-cover"
              />
              <div className="flex-1 flex gap-2">
                <Input 
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Write a comment..." 
                  className="bg-white rounded-full text-sm"
                />
                <Button type="submit" size="icon" className="rounded-full bg-[#007699] hover:bg-[#005a75] text-white shrink-0" disabled={!commentInput.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
