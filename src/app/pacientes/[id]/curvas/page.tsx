import { redirect } from 'next/navigation'

export default function CurvasRedirect({ params }: { params: { id: string } }) {
  redirect(`/pacientes/${params.id}`)
}
