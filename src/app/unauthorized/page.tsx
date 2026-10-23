import { ShieldAlert, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cookies } from "next/headers"

export default async function UnauthorizedPage() {
  const cookieStore = await cookies()
  const role = cookieStore.get("user_role")?.value
  
  // Determine fallback route based on role if possible, else /login
  let fallbackRoute = "/login"
  if (role) {
    if (['clinician', 'specialist', 'nurse', 'medical_assistant'].includes(role)) fallbackRoute = "/clinical/queue"
    else if (['patient', 'guardian'].includes(role)) fallbackRoute = "/patient/dashboard"
    else if (['billing_admin', 'clinic_manager'].includes(role)) fallbackRoute = "/operations/dashboard"
    else if (['it_support', 'super_admin'].includes(role)) fallbackRoute = "/admin/dashboard"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-8 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-500">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Access Denied</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Your current security clearance level ({role || 'Guest'}) does not authorize access to this environment. This incident has been securely logged.
        </p>
        <Link 
          href={fallbackRoute}
          className="inline-flex items-center justify-center w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Return to Authorized Dashboard
        </Link>
      </div>
    </div>
  )
}
