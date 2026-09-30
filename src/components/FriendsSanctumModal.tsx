import { useState } from 'react';

interface FriendsSanctumModalProps {
  user: { id: string; name: string } | null;
  onClose: () => void;
  onStartPrivateMatch: (roomCode: string, mode: 'host' | 'guest') => void;
}

export default function FriendsSanctumModal({ user, onClose, onStartPrivateMatch }: FriendsSanctumModalProps) {
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [joinInputCode, setJoinInputCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'friends'>('create');

  // Generate 16-digit Grimoire Code: XXXX-XXXX-XXXX-XXXX
  const generateGrimoireCode = () => {
    const code = Array.from({ length: 4 }, () => Math.floor(1000 + Math.random() * 9000)).join('-');
    setCreatedCode(code);
  };

  const handleCopyCode = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleHostLaunch = () => {
    if (createdCode) {
      onStartPrivateMatch(createdCode, 'host');
    }
  };

  const handleJoinLaunch = () => {
    const cleanCode = joinInputCode.trim();
    if (cleanCode.length >= 16) {
      onStartPrivateMatch(cleanCode, 'guest');
    }
  };

  // Mock player's unique 16-digit Grimoire ID
  const playerUniqueId = user ? `${user.id.slice(0, 4)}-8812-4019-2041`.toUpperCase() : '9021-4819-3814-7291';

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-space-md animate-fadeIn">
      <div className="bg-void-surface border-2 border-void-border w-full max-w-xl shadow-[0_0_50px_rgba(9,9,13,0.9)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-ink-black px-space-md py-space-sm border-b border-void-border flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-blood-crimson text-[24px]">group</span>
            <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-bone-ivory">
              Friends Sanctum & Private Lobbies
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-bone-ivory-dim hover:text-bone-ivory p-1 focus:outline-none"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 bg-surface-container-lowest border-b border-void-border">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-space-sm font-label-sm uppercase tracking-wider text-center border-r border-void-border transition-colors ${
              activeTab === 'create' ? 'bg-void-surface text-blood-crimson font-bold border-b-2 border-b-blood-crimson' : 'text-bone-ivory-dim hover:text-bone-ivory'
            }`}
          >
            Create Private Lobby
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`py-space-sm font-label-sm uppercase tracking-wider text-center border-r border-void-border transition-colors ${
              activeTab === 'join' ? 'bg-void-surface text-blood-crimson font-bold border-b-2 border-b-blood-crimson' : 'text-bone-ivory-dim hover:text-bone-ivory'
            }`}
          >
            Join Room Code
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`py-space-sm font-label-sm uppercase tracking-wider text-center transition-colors ${
              activeTab === 'friends' ? 'bg-void-surface text-blood-crimson font-bold border-b-2 border-b-blood-crimson' : 'text-bone-ivory-dim hover:text-bone-ivory'
            }`}
          >
            Grimoire Friends ID
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-space-lg flex flex-col gap-space-md">
          {activeTab === 'create' && (
            <div className="flex flex-col gap-space-md text-left">
              <p className="font-body-md text-bone-ivory-dim text-sm">
                Generate a unique 16-digit Grimoire Code to invite a friend into a private custom duel.
              </p>

              {!createdCode ? (
                <button
                  onClick={generateGrimoireCode}
                  className="w-full py-3 bg-blood-crimson hover:bg-blood-crimson-bright text-bone-ivory font-headline-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(163,19,43,0.4)] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">key</span>
                  GENERATE 16-DIGIT GRIMOIRE CODE
                </button>
              ) : (
                <div className="flex flex-col gap-space-sm bg-ink-black border border-void-border p-space-md">
                  <span className="font-label-sm text-xs text-bone-ivory-dim uppercase tracking-wider">YOUR PRIVATE DUEL ROOM CODE:</span>
                  <div className="flex items-center justify-between bg-surface-container px-space-md py-2 border border-blood-crimson/50 font-mono text-xl font-bold text-pumpkin-orange tracking-widest">
                    <span>{createdCode}</span>
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1 bg-void-surface hover:bg-void-surface-hover text-bone-ivory text-xs font-headline-sm uppercase tracking-wider border border-void-border"
                    >
                      {copied ? 'COPIED!' : 'COPY CODE'}
                    </button>
                  </div>
                  <button
                    onClick={handleHostLaunch}
                    className="w-full mt-2 py-3 bg-blood-crimson hover:bg-blood-crimson-bright text-bone-ivory font-headline-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(163,19,43,0.4)]"
                  >
                    ENTER ROOM LOBBY AS HOST
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'join' && (
            <div className="flex flex-col gap-space-md text-left">
              <p className="font-body-md text-bone-ivory-dim text-sm">
                Enter your friend's 16-digit Grimoire Room Code to connect directly to their private match.
              </p>

              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-xs text-bone-ivory-dim uppercase tracking-wider">
                  ENTER 16-DIGIT ROOM CODE:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4819-9021-3814-7291"
                  value={joinInputCode}
                  onChange={(e) => setJoinInputCode(e.target.value)}
                  className="w-full bg-ink-black border border-void-border focus:border-blood-crimson px-space-md py-3 font-mono text-lg text-bone-ivory uppercase tracking-wider focus:outline-none"
                />
              </div>

              <button
                onClick={handleJoinLaunch}
                disabled={joinInputCode.trim().length < 16}
                className="w-full py-3 bg-blood-crimson disabled:opacity-40 hover:bg-blood-crimson-bright text-bone-ivory font-headline-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(163,19,43,0.4)]"
              >
                JOIN PRIVATE DUEL
              </button>
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="flex flex-col gap-space-md text-left">
              <div className="bg-ink-black border border-void-border p-space-md flex flex-col gap-2">
                <span className="font-label-sm text-xs text-bone-ivory-dim uppercase tracking-wider">
                  YOUR UNIQUE 16-DIGIT SOUL ID CODE:
                </span>
                <span className="font-mono text-lg font-bold text-blood-crimson tracking-widest">
                  {playerUniqueId}
                </span>
                <p className="text-xs text-bone-ivory-dim">
                  Share this 16-digit ID code with other players so they can invite you directly into private duels or add you to their combat roster.
                </p>
              </div>

              {/* Sample Online Friends Roster */}
              <div className="flex flex-col gap-space-xs">
                <span className="font-label-sm text-xs text-bone-ivory-dim uppercase tracking-wider">ONLINE GRIMOIRE FRIENDS (3)</span>
                {[
                  { name: 'Valkyrie_Queen', elo: 2150, title: 'GM', status: 'Online' },
                  { name: 'Shadow_Reaper', elo: 1890, title: 'IM', status: 'In Game' },
                  { name: 'VoidWalker_99', elo: 1620, title: 'FM', status: 'Online' },
                ].map((friend, i) => (
                  <div key={i} className="flex items-center justify-between bg-ink-black p-2 border border-void-border">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="font-headline-sm text-sm text-bone-ivory">{friend.name}</span>
                      <span className="px-1 bg-pumpkin-orange/20 text-pumpkin-orange font-mono text-[10px] font-bold border border-pumpkin-orange/40">
                        {friend.title} {friend.elo}
                      </span>
                    </div>
                    <button className="px-2 py-1 bg-void-surface hover:bg-blood-crimson text-bone-ivory font-label-sm text-[10px] uppercase tracking-wider border border-void-border transition-colors">
                      CHALLENGE
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
