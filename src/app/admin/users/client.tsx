"use client"

import { useState } from "react"
import { Shield, Users, Edit, UserX, Eye, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Mock User Data
const initialUsers = [
  { id: "USR-01", email: "clinician@test.com", role: "clinician", status: "active", lastLogin: "2 mins ago" },
  { id: "USR-02", email: "nurse@test.com", role: "nurse", status: "active", lastLogin: "1 hour ago" },
  { id: "USR-03", email: "billing@test.com", role: "billing_admin", status: "active", lastLogin: "4 hours ago" },
  { id: "USR-04", email: "patient@test.com", role: "patient", status: "inactive", lastLogin: "2 days ago" },
]

export function AdminUsersClient({ canManageRoles, canViewLogs }: { canManageRoles: boolean, canViewLogs: boolean }) {
  const [users, setUsers] = useState(initialUsers)
  const [isProvisionOpen, setIsProvisionOpen] = useState(false)

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <header className="mb-8 border-b border-zinc-800 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="h-6 w-6" /> User & Role Management
          </h1>
          <p className="text-zinc-500 mt-1">Manage platform access and security clearances.</p>
        </div>
        
        {canManageRoles && (
          <Dialog open={isProvisionOpen} onOpenChange={setIsProvisionOpen}>
            <DialogTrigger render={
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2">
                <Plus className="h-4 w-4" /> Provision New User
              </button>
            } />
            <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Provision User</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Assign an email and security role. This will dispatch an invite link.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 mt-2">
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-zinc-300">Email Address</label>
                  <input id="email" type="email" placeholder="doctor@praxis.ai" className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-red-500 focus:outline-none" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="role" className="text-sm font-medium text-zinc-300">Security Role</label>
                  <select id="role" className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-red-500 focus:outline-none text-zinc-300">
                    <option value="clinician">Clinician (Full Medical Access)</option>
                    <option value="specialist">Specialist (Controlled Prescriptions)</option>
                    <option value="nurse">Nurse (Triage Access)</option>
                    <option value="billing_admin">Billing Admin (Financial Data)</option>
                    <option value="clinic_manager">Clinic Manager (Operations)</option>
                    <option value="it_support">IT Support (System Audits)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setIsProvisionOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={() => setIsProvisionOpen(false)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Send Invite
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <div className="bg-black/50 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-900/80 text-xs uppercase font-semibold text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">User Details</th>
              <th className="px-6 py-4">Security Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Last Active</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center">
                    <UserX className="h-10 w-10 mb-3 opacity-20" />
                    <p>No users found in the system.</p>
                  </div>
                </td>
              </tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{u.email}</div>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5">{u.id}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-300">
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 ${u.status === 'active' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-400">{u.lastLogin}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  {canViewLogs && (
                    <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors" title="Impersonate (IT Troubleshooting)">
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  {canManageRoles && (
                    <button className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-900/20 rounded transition-colors" title="Edit Role">
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
