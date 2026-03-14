export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[999] bg-[#eef1f4]">
      {children}
    </div>
  );
}
