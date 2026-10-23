import { BarChart3, Building, DollarSign, Package, LogOut } from "lucide-react"
import { NotificationCenter } from "@/components/notification-center"
import Link from "next/link"

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
      <aside className="w-64 border-r bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Building className="h-6 w-6 text-emerald-500" />
            <span className="font-bold text-lg tracking-tight">Praxis Ops</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4 px-3">Logistics</div>
          <Link href="/operations/dashboard" className="flex items-center gap-3 rounded-md bg-emerald-500/10 px-3 py-2 text-emerald-400 font-medium text-sm">
            <Building className="h-4 w-4" />
            Room Status Map
          </Link>
          <Link href="/operations/inventory" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-slate-800 hover:text-white font-medium text-sm transition-colors">
            <Package className="h-4 w-4" />
            Inventory Control
          </Link>
          
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-3">Finance</div>
          <Link href="/operations/billing" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-slate-800 hover:text-white font-medium text-sm transition-colors">
            <DollarSign className="h-4 w-4" />
            Revenue Analytics
          </Link>
          <Link href="/operations/reports" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-slate-800 hover:text-white font-medium text-sm transition-colors">
            <BarChart3 className="h-4 w-4" />
            Performance Reports
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <Link href="/api/logout" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-red-900/30 hover:text-red-400 font-medium text-sm transition-colors">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-end px-6 bg-white dark:bg-slate-900">
          <NotificationCenter />
        </header>
        {children}
      </main>
    </div>
  )
}
