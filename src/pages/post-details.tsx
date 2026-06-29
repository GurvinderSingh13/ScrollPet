import React from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import PostCard from '@/components/PostCard';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PostDetails() {
  const [match, params] = useRoute("/post/:postId");
  const [, setLocation] = useLocation();
  const postId = params?.postId;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: currentUserProfile } = useQuery({
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

  const currentUser = currentUserProfile || user;

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (postError) throw postError;
      if (!postData) return null;

      const { data: authorData } = await supabase
        .from('users')
        .select('id, display_name, username, profile_image_url')
        .eq('id', postData.user_id)
        .single();

      return {
        ...postData,
        users: authorData || null
      };
    }
  });

  const handleRestrictedAction = (e: React.MouseEvent, _?: any) => {
    if (!isAuthenticated || !currentUser) {
      e.preventDefault();
      toast({
        title: "Authentication Required",
        description: "Please log in to perform this action.",
        variant: "destructive"
      });
      setLocation('/login');
      return true;
    }
    return false;
  };

  const handleEditClick = (p: any) => {
    console.log("Edit requested for post:", p.id);
  };

  const handleDeletePost = async (id: string) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "Post deleted successfully" });
      setLocation('/');
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8 pt-24">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Post not found</h2>
          <p className="text-muted-foreground mb-6">The post you're looking for doesn't exist or has been deleted.</p>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8 pt-24 pb-20">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => window.history.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <PostCard
        post={post}
        currentUser={currentUser}
        isReadOnlyMode={!isAuthenticated}
        handleRestrictedAction={handleRestrictedAction}
        handleEditClick={handleEditClick}
        handleDeletePost={handleDeletePost}
      />
    </div>
  );
}
