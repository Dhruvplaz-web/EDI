export default function ClinicalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-slate-900 antialiased overflow-x-hidden">
      {children}
    </div>
  )
}
