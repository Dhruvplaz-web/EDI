import { PatientConsultClient } from "./client"

// THE FIX: Make the component async and treat params as a Promise for Next.js 15
export default async function PatientConsultPage({ params }: { params: Promise<{ id: string }> }) {
  // THE FIX: Await the params before accessing properties
  const resolvedParams = await params;

  // Pass the safely unwrapped appointment or consult ID
  return <PatientConsultClient consultId={resolvedParams.id} />
}