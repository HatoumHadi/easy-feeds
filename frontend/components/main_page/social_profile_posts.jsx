import React, { useEffect } from 'react';

const SocialProfilePosts = ({ profile, fetchPosts, posts }) => {
  useEffect(() => {
    if (profile && fetchPosts) {
      fetchPosts(profile.id);
    }
  }, [profile, fetchPosts]);

  if (!profile) return <div style={{ padding: 32, color: '#888' }}>Select a social media profile to view posts.</div>;
  if (!posts) return <div style={{ padding: 32 }}>Loading posts...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ marginBottom: 16 }}>{profile.display_name || profile.username}'s Posts</h2>
      {posts.length === 0 ? (
        <div>No posts found for this profile.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {posts.map(post => (
            <li key={post.id} style={{ marginBottom: 18, background: '#f7f8fa', borderRadius: 8, padding: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <div style={{ fontWeight: 500, marginBottom: 6 }}>{post.title || post.content?.slice(0, 60) || 'Untitled'}</div>
              <div style={{ color: '#555', fontSize: 14 }}>{post.content}</div>
              <div style={{ color: '#aaa', fontSize: 12, marginTop: 8 }}>{post.created_at}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SocialProfilePosts;
