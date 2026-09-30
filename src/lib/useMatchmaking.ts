import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

export type MatchmakingState = 'idle' | 'searching' | 'found';

export interface MatchData {
  matchId: string;
  opponentId: string;
  opponentName: string;
  color: 'w' | 'b';
}

export function useMatchmaking(user: { id: string; name: string } | null) {
  const [status, setStatus] = useState<MatchmakingState>('idle');
  const [match, setMatch] = useState<MatchData | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const stopSearch = () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    setStatus('idle');
    setMatch(null);
  };

  const startSearch = async () => {
    if (!user) return;
    setStatus('searching');

    const channel = supabase.channel('global-matchmaking');
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        
        // Look for opponents
        for (const [, presences] of Object.entries(state)) {
          const opponent = presences[0] as unknown as { userId: string; name: string; status: string };
          
          if (opponent.userId !== user.id && opponent.status === 'searching') {
            // We found someone! 
            // To prevent race conditions, the person with the alphabetically smaller ID initiates the match
            if (user.id < opponent.userId) {
              const matchId = `match-${user.id}-${opponent.userId}`;
              
              // Send proposal via broadcast
              channel.send({
                type: 'broadcast',
                event: 'match_proposed',
                payload: {
                  targetUserId: opponent.userId,
                  matchId,
                  hostId: user.id,
                  hostName: user.name,
                }
              });
              
              // We are white
              setMatch({
                matchId,
                opponentId: opponent.userId,
                opponentName: opponent.name,
                color: 'w'
              });
              setStatus('found');
              
              // Stop searching
              channel.track({ userId: user.id, name: user.name, status: 'in-game' });
            }
            break;
          }
        }
      })
      .on('broadcast', { event: 'match_proposed' }, (payload) => {
        const data = payload.payload;
        if (data.targetUserId === user.id) {
          // We got invited to a match!
          setMatch({
            matchId: data.matchId,
            opponentId: data.hostId,
            opponentName: data.hostName,
            color: 'b' // Host is white, we are black
          });
          setStatus('found');
          channel.track({ userId: user.id, name: user.name, status: 'in-game' });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: user.id,
            name: user.name,
            status: 'searching',
            joinedAt: Date.now()
          });
        }
      });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  return { status, match, startSearch, stopSearch };
}
