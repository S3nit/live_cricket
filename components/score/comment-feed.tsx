"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { LoaderCircle, MessageCircle } from "lucide-react";
import { MatchComment } from "@/types/cricket";
import { commentSchema } from "@/types/schemas";
import { deleteComment, loadOlderComments, postComment, subscribeComments } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface CommentFeedProps {
  tournamentId: string;
  matchId: string;
  currentUid?: string;
  currentName?: string;
  canModerate?: boolean;
}

const PAGE_SIZE = 50;

export function CommentFeed({
  tournamentId,
  matchId,
  currentUid,
  currentName,
  canModerate = false,
}: CommentFeedProps) {
  const [liveComments, setLiveComments] = useState<MatchComment[]>([]);
  const [olderComments, setOlderComments] = useState<MatchComment[]>([]);
  const [cursor, setCursor] = useState<unknown>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeComments(tournamentId, matchId, PAGE_SIZE, (comments, nextCursor) => {
      setLiveComments(comments);
      setCursor(nextCursor);
    });

    return () => unsubscribe();
  }, [matchId, tournamentId]);

  const comments = useMemo(() => {
    const seen = new Set<string>();
    return [...liveComments, ...olderComments].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [liveComments, olderComments]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!currentUid || !currentName) {
      setError("Sign in to post comments");
      return;
    }

    const parsed = commentSchema.safeParse({ text });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid comment");
      return;
    }

    try {
      setBusy(true);
      await postComment(tournamentId, matchId, currentUid, currentName, parsed.data.text);
      setText("");
    } catch {
      setError("Failed to post comment");
    } finally {
      setBusy(false);
    }
  };

  const loadMore = async () => {
    try {
      setBusy(true);
      const result = await loadOlderComments(tournamentId, matchId, cursor, PAGE_SIZE);
      setOlderComments((prev) => [...prev, ...result.comments]);
      setCursor(result.cursor);
    } catch {
      setError("Failed to load older comments");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (commentId: string) => {
    try {
      setBusy(true);
      await deleteComment(tournamentId, matchId, commentId);
    } catch {
      setError("Failed to delete comment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <MessageCircle className="h-5 w-5" /> Live comments
      </h3>

      <form onSubmit={submit} className="mb-3 space-y-2">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={500}
          placeholder="Share your thoughts on this match..."
        />
        <Button disabled={busy || !currentUid} type="submit">
          {busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          Post comment
        </Button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>

      <div className="space-y-2">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-md border border-zinc-200 p-2 text-sm">
            <div className="mb-1 flex items-center justify-between gap-2">
              <strong>{comment.displayName}</strong>
              {(canModerate || comment.userId === currentUid) && (
                <Button onClick={() => remove(comment.id)} size={undefined} variant="destructive" className="px-2 py-1 text-xs">
                  Delete
                </Button>
              )}
            </div>
            <p>{comment.text}</p>
          </article>
        ))}
      </div>

      <Button className="mt-3" variant="outline" onClick={loadMore} disabled={busy || !cursor}>
        Load older comments
      </Button>
    </Card>
  );
}
