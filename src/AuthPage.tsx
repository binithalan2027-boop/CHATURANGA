import OnlinePage from "./online/OnlinePage";
export default function AuthPage({
  onBack,
}: {
  onAuth: (user: { id: string; name: string; email: string }) => void;
  onBack: () => void;
}) {
  return <OnlinePage onExit={onBack} />;
}
