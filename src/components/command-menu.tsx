"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Calculator, Calendar, Settings, User, Building, Shield, HeartPulse } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <span className="text-muted-foreground flex-1 text-left">Search patients...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Recent Patients">
            <CommandItem onSelect={() => runCommand(() => router.push('/clinical/records/PT-12345'))}>
              <User className="mr-2 h-4 w-4" />
              <span>Jane Doe (MRN: 12345)</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/clinical/records/PT-67890'))}>
              <User className="mr-2 h-4 w-4" />
              <span>John Smith (MRN: 67890)</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Dashboards & Navigation">
            <CommandItem onSelect={() => runCommand(() => router.push('/clinical/queue'))}>
              <User className="mr-2 h-4 w-4" />
              <span>Clinical Triage Queue</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/patient/dashboard'))}>
              <HeartPulse className="mr-2 h-4 w-4" />
              <span>Patient Environment</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/operations/dashboard'))}>
              <Building className="mr-2 h-4 w-4" />
              <span>Operations & Billing</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/admin/dashboard'))}>
              <Shield className="mr-2 h-4 w-4" />
              <span>SysAdmin Console</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

