import { useState } from 'react'
import { ChevronDown, LifeBuoy, Mail, ShieldCheck } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { cn } from '../../lib/utils'

const FAQS = [
  { q: 'How do I book a tutoring session?', a: 'Go to Find a Tutor, choose a service, select an available date/time, and complete payment via GCash to confirm your booking.' },
  { q: 'What happens if I cancel a session?', a: 'Cancelling does not automatically issue a refund. Contact your tutor/learner and Admin if a refund is warranted.' },
  { q: 'How do I become a tutor?', a: 'Go to Apply as Tutor, submit your subjects and a verification document. Admin reviews every application manually.' },
  { q: 'What if something goes wrong during a session?', a: 'Open the session in My Sessions and use Report an Issue. Admin reviews all reports and may refer serious matters to OSAS.' },
]

export function HelpSafetyPage() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Help & Safety</h1>
        <p className="text-sm text-neutral-500">Guidelines, FAQs, and how to reach support.</p>
      </div>

      <Card>
        <CardHeader title="Safety Guidelines" icon={<ShieldCheck className="size-4" />} />
        <CardBody>
          <ul className="list-disc space-y-1.5 pl-4 text-sm text-neutral-600">
            <li>Only communicate through CampusTutor Messages and use the official Google Meet/Zoom link for sessions.</li>
            <li>Never share your password or OTP code with anyone.</li>
            <li>Report no-shows, harassment, or payment issues immediately using Report an Issue.</li>
            <li>Payments are processed exclusively through PayMongo (GCash) — never send money directly.</li>
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Frequently Asked Questions" />
        <CardBody className="divide-y divide-neutral-100 !p-0">
          {FAQS.map((f, i) => (
            <div key={f.q} className="px-5 py-3.5">
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-3 text-left">
                <span className="text-sm font-medium text-neutral-800">{f.q}</span>
                <ChevronDown className={cn('size-4 text-neutral-400 transition-transform', open === i && 'rotate-180')} />
              </button>
              {open === i && <p className="mt-2 text-sm text-neutral-500">{f.a}</p>}
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Contact Support" icon={<LifeBuoy className="size-4" />} />
        <CardBody>
          <a href="mailto:support@campustutor.csu.edu.ph" className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline">
            <Mail className="size-4" /> support@campustutor.csu.edu.ph
          </a>
        </CardBody>
      </Card>
    </div>
  )
}
