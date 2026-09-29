import { useState } from 'react';

interface ProfilePageProps {
  onBack: () => void;
  user: { name: string; email: string } | null;
}

export default function ProfilePage({ onBack, user }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'friends' | 'verification'>('profile');
  
  // Mock Data (until Supabase tables are linked)
  const [profile, setProfile] = useState({
    displayName: user?.name || 'Wandering Soul',
    friendCode: '8492-1049-5582-9901',
    bio: 'Lost in the abyss. Seeking worthy opponents.',
    age: 'Unknown',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
    title: 'UNVERIFIED',
    fideRating: 'N/A'
  });

  const [friends] = useState([
    { name: 'VoidWalker99', status: 'online', code: '1122-3344-5566-7788' },
    { name: 'CrimsonKing', status: 'offline', code: '9988-7766-5544-3322' }
  ]);

  const [addFriendCode, setAddFriendCode] = useState('');
  
  // Verification Form State
  const [fideId, setFideId] = useState('');
  const [fideLink, setFideLink] = useState('');

  return (
    <div className="min-h-screen bg-void-black flex flex-col p-space-lg text-bone-ivory font-body-md">
      
      {/* Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between mb-space-xl">
        <button onClick={onBack} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors font-label-sm uppercase tracking-widest">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Return to Hub
        </button>
        <h1 className="font-display-md text-bone-ivory uppercase tracking-wider">Sanctum of Identity</h1>
        <div className="w-24"></div> {/* Spacer for flex balance */}
      </div>

      <div className="max-w-6xl w-full mx-auto flex flex-col lg:flex-row gap-gutter">
        
        {/* Left Sidebar: Navigation & ID */}
        <div className="w-full lg:w-80 flex flex-col gap-space-md">
          <div className="bg-surface-card border border-surface-container-high rounded-xl p-space-md flex flex-col items-center text-center shadow-xl relative overflow-hidden">
            <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-primary-container/20 to-transparent"></div>
            <img src={profile.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-surface-container-highest z-10 mb-4 bg-surface-container-lowest" />
            <h2 className="font-headline-lg uppercase">{profile.displayName}</h2>
            <div className="font-label-sm text-primary uppercase tracking-widest mb-4 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              {profile.title}
            </div>
            
            <div className="w-full bg-surface-container-lowest rounded p-3 mb-2 flex flex-col items-center border border-surface-container">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Unique Grimoire ID</span>
              <span className="font-mono text-tertiary tracking-[0.2em]">{profile.friendCode}</span>
            </div>
            <button className="text-xs text-on-surface-variant hover:text-white underline" onClick={() => navigator.clipboard.writeText(profile.friendCode)}>Copy ID to Clipboard</button>
          </div>

          <div className="bg-surface-card border border-surface-container-high rounded-xl flex flex-col overflow-hidden">
            <button onClick={() => setActiveTab('profile')} className={`p-4 text-left font-headline-sm uppercase tracking-wider border-l-4 transition-colors ${activeTab === 'profile' ? 'border-primary bg-surface-container-high text-white' : 'border-transparent text-on-surface-variant hover:bg-surface-container-low'}`}>
              Profile Details
            </button>
            <button onClick={() => setActiveTab('friends')} className={`p-4 text-left font-headline-sm uppercase tracking-wider border-l-4 transition-colors ${activeTab === 'friends' ? 'border-secondary bg-surface-container-high text-white' : 'border-transparent text-on-surface-variant hover:bg-surface-container-low'}`}>
              Friends & Invites
            </button>
            <button onClick={() => setActiveTab('verification')} className={`p-4 text-left font-headline-sm uppercase tracking-wider border-l-4 transition-colors ${activeTab === 'verification' ? 'border-tertiary bg-surface-container-high text-white' : 'border-transparent text-on-surface-variant hover:bg-surface-container-low'}`}>
              FIDE Title Verification
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-surface-card border border-surface-container-high rounded-xl p-space-xl shadow-2xl relative">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-space-lg animate-fade-in">
              <h2 className="font-display-sm text-bone-ivory uppercase border-b border-surface-container pb-2">Mortal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-on-surface-variant uppercase tracking-widest">Display Name</label>
                  <input type="text" value={profile.displayName} onChange={(e) => setProfile({...profile, displayName: e.target.value})} className="bg-surface-container-low border border-surface-container-highest rounded p-3 text-bone-ivory outline-none focus:border-primary transition-colors" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-on-surface-variant uppercase tracking-widest">Age / Eons</label>
                  <input type="text" value={profile.age} onChange={(e) => setProfile({...profile, age: e.target.value})} className="bg-surface-container-low border border-surface-container-highest rounded p-3 text-bone-ivory outline-none focus:border-primary transition-colors" />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-label-sm text-on-surface-variant uppercase tracking-widest">Bio / Curse Description</label>
                  <textarea value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} className="bg-surface-container-low border border-surface-container-highest rounded p-3 text-bone-ivory outline-none focus:border-primary transition-colors h-24 resize-none" />
                </div>
              </div>
              <button className="self-end px-8 py-3 bg-primary-container text-on-primary-container hover:bg-crimson-glow hover:text-white font-headline-sm uppercase tracking-wider rounded transition-colors mt-4">
                Update Manifest
              </button>
            </div>
          )}

          {/* FRIENDS TAB */}
          {activeTab === 'friends' && (
            <div className="flex flex-col gap-space-lg animate-fade-in">
              <h2 className="font-display-sm text-bone-ivory uppercase border-b border-surface-container pb-2">Blood Pacts (Friends)</h2>
              
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  placeholder="Enter 16-Digit Friend ID (e.g. 1234-5678-9012-3456)" 
                  value={addFriendCode}
                  onChange={(e) => setAddFriendCode(e.target.value)}
                  className="flex-1 bg-surface-container-lowest border border-surface-container-high rounded p-3 font-mono text-sm outline-none focus:border-secondary" 
                />
                <button className="px-6 py-2 bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-void-black font-headline-sm uppercase tracking-wider rounded transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined">person_add</span>
                  Send Pact
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {friends.map((friend, i) => (
                  <div key={i} className="flex items-center justify-between bg-surface-container-low border border-surface-container rounded p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${friend.status === 'online' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-surface-container-highest'}`}></div>
                      <div className="flex flex-col">
                        <span className="font-headline-sm uppercase">{friend.name}</span>
                        <span className="font-mono text-xs text-on-surface-variant">{friend.code}</span>
                      </div>
                    </div>
                    <button className="text-xs font-label-sm uppercase tracking-widest text-secondary hover:text-white border border-secondary px-3 py-1 rounded transition-colors">
                      Invite to Room
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VERIFICATION TAB */}
          {activeTab === 'verification' && (
            <div className="flex flex-col gap-space-lg animate-fade-in">
              <div className="flex flex-col gap-2 border-b border-surface-container pb-4">
                <h2 className="font-display-sm text-bone-ivory uppercase text-tertiary">FIDE Title Ascension</h2>
                <p className="text-on-surface-variant font-body-sm max-w-2xl">
                  Are you a Grandmaster (GM), International Master (IM), or FIDE Master (FM) in the mortal realm? 
                  Submit your official FIDE details below. Once the High Council verifies your identity, you will be granted a permanent title badge in the Arena.
                </p>
              </div>
              
              <div className="flex flex-col gap-space-md max-w-xl">
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-on-surface-variant uppercase tracking-widest">Official FIDE ID</label>
                  <input type="text" value={fideId} onChange={(e) => setFideId(e.target.value)} placeholder="e.g. 1503014" className="bg-surface-container-low border border-surface-container-highest rounded p-3 text-bone-ivory outline-none focus:border-tertiary transition-colors font-mono" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-on-surface-variant uppercase tracking-widest">FIDE Profile URL</label>
                  <input type="text" value={fideLink} onChange={(e) => setFideLink(e.target.value)} placeholder="https://ratings.fide.com/profile/..." className="bg-surface-container-low border border-surface-container-highest rounded p-3 text-bone-ivory outline-none focus:border-tertiary transition-colors font-mono" />
                </div>
                
                <div className="bg-tertiary-container/10 border border-tertiary-container rounded p-4 mt-2">
                  <p className="text-xs text-on-tertiary-container font-body-sm mb-3">
                    <strong className="uppercase">Identity Verification Required:</strong> For security, you must also email a photo of yourself holding a physical ID (Passport/Driver's License) next to a piece of paper with your 16-digit Grimoire ID to <code className="bg-black/30 px-1 rounded">ascension@chaturanga.com</code>.
                  </p>
                </div>

                <button className="self-start px-8 py-3 bg-tertiary-container text-on-tertiary-container hover:bg-tertiary hover:text-white font-headline-sm uppercase tracking-wider rounded transition-colors mt-2 flex items-center gap-2">
                  <span className="material-symbols-outlined">shield</span>
                  Submit for Ascension
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
