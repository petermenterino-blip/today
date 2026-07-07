import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Send, Pencil, Trash2, Reply, X, Check, Loader2,
  ChevronDown, ChevronRight, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resourceService } from '../../services/resourceService';
import { notifySuccess, notifyError } from '../../utils/toast';
import type { ResourceComment } from '../../types/resources';

interface CommentsSectionProps {
  resourceId: string;
  comments: ResourceComment[];
  isLoading: boolean;
  onRefresh: () => void;
}

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

const CommentsSection: React.FC<CommentsSectionProps> = ({ resourceId, comments, isLoading, onRefresh }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const topLevel = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  const handleSubmit = useCallback(async () => {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    try {
      await resourceService.addComment(resourceId, user.id, newComment.trim());
      setNewComment('');
      onRefresh();
      notifySuccess('Comment added');
    } catch (e: any) {
      notifyError(e?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  }, [newComment, resourceId, user, onRefresh]);

  const handleReply = useCallback(async (parentId: string) => {
    if (!replyContent.trim() || !user) return;
    setSubmitting(true);
    try {
      await resourceService.addComment(resourceId, user.id, replyContent.trim(), parentId);
      setReplyContent('');
      setReplyingTo(null);
      setExpandedReplies(prev => new Set(prev).add(parentId));
      onRefresh();
      notifySuccess('Reply added');
    } catch (e: any) {
      notifyError(e?.message || 'Failed to reply');
    } finally {
      setSubmitting(false);
    }
  }, [replyContent, resourceId, user, onRefresh]);

  const handleUpdate = useCallback(async (commentId: string) => {
    if (!editContent.trim()) return;
    setSubmitting(true);
    try {
      await resourceService.updateComment(commentId, editContent.trim());
      setEditingId(null);
      setEditContent('');
      onRefresh();
      notifySuccess('Comment updated');
    } catch (e: any) {
      notifyError(e?.message || 'Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  }, [editContent, onRefresh]);

  const handleDelete = useCallback(async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await resourceService.deleteComment(commentId);
      onRefresh();
      notifySuccess('Comment deleted');
    } catch (e: any) {
      notifyError(e?.message || 'Failed to delete comment');
    }
  }, [onRefresh]);

  const renderComment = (comment: ResourceComment, isReply = false) => (
    <div
      key={comment.id}
      className={`${isReply ? 'ml-10 pl-4 border-l-2 border-slate-100' : ''} py-3 group`}
    >
      {editingId === comment.id ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
            rows={2}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUpdate(comment.id)}
              disabled={submitting || !editContent.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-100 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save
            </button>
            <button
              onClick={() => { setEditingId(null); setEditContent(''); }}
              className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-indigo-600">
                {((comment as any).user?.name || 'A')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  {(comment as any).user?.name || 'Anonymous'}
                </span>
                <span className="text-[10px] text-slate-400">{formatTime(comment.created_at)}</span>
                {(comment as any).edited_at && (
                  <span className="text-[9px] text-slate-300 italic">(edited)</span>
                )}
              </div>
              <p className="text-sm text-slate-700 mt-1">{comment.content}</p>
              <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isReply && (
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-500 font-bold uppercase tracking-widest"
                  >
                    <Reply className="w-3 h-3" /> Reply
                  </button>
                )}
                {(comment as any).user?.id === user?.id && (
                  <>
                    <button
                      onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase tracking-widest"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </>
                )}
              </div>

              {/* Reply form */}
              <AnimatePresence>
                {replyingTo === comment.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 space-y-2 overflow-hidden"
                  >
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to ${(comment as any).user?.name || 'user'}...`}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
                      rows={2}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReply(comment.id)}
                        disabled={submitting || !replyContent.trim()}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-colors"
                      >
                        {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Reply
                      </button>
                      <button
                        onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Replies */}
          {!isReply && (
            <>
              {getReplies(comment.id).length > 0 && (
                <button
                  onClick={() => setExpandedReplies(prev => {
                    const next = new Set(prev);
                    if (next.has(comment.id)) { next.delete(comment.id); } else { next.add(comment.id); }
                    return next;
                  })}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest mt-1 ml-10"
                >
                  {expandedReplies.has(comment.id) ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                  {getReplies(comment.id).length} {getReplies(comment.id).length === 1 ? 'reply' : 'replies'}
                </button>
              )}
              {expandedReplies.has(comment.id) && getReplies(comment.id).map(r => renderComment(r, true))}
            </>
          )}
        </>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-800">Comments ({comments.length})</h3>
      </div>

      {/* New comment form */}
      <div className="flex items-start gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-indigo-600">
            {(user?.name || 'Y')[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1 space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none transition-all"
            rows={3}
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim() || submitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Comment
            </button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
        </div>
      ) : topLevel.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {topLevel.map(c => renderComment(c))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
