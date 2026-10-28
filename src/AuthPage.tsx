import GoogleAuthModal from "./components/auth/GoogleAuthModal";
import { ChaturangaUser } from "./services/authStore";

export default function AuthPage({
  onAuth,
  onBack,
}: {
  onAuth?: (user: ChaturangaUser) => void;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col items-center justify-center p-4">
      <GoogleAuthModal
        isOpen={true}
        onClose={onBack}
        onSuccess={(u) => {
          onAuth?.(u);
          onBack();
        }}
      />
    </div>
  );
}
