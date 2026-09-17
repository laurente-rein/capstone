import { useState } from 'react'
import { ShieldAlert, ShieldCheck, Star } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { TextInput } from '../ui/Field'
import { StatusBadge } from '../ui/StatusBadge'
import { useDb } from '../../hooks/useDb'
import type { UserAccount } from '../../types'
import { getClearance, getLearnerVerification, getTutorProfile } from '../../lib/selectors'
import { toast } from '../../store/toast'
import { formatDateTime } from '../../lib/utils'
import { LearnerVerificationModal } from '../learner/LearnerVerificationModal'

export function ProfilePage({ user }: { user: UserAccount }) {
  const tutorProfile = useDb(() => (user.roles.includes('tutor') ? getTutorProfile(user.id) : undefined))
  const clearance = useDb(() => getClearance(user.id))
  const verification = useDb(() => getLearnerVerification(user.id))
  const [firstName, setFirstName] = useState(user.firstName)
  const [lastName, setLastName] = useState(user.lastName)
  const [showVerify, setShowVerify] = useState(false)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Profile</h1>
        <p className="text-sm text-neutral-500">Manage your CampusTutor account information.</p>
      </div>

      <Card>
        <CardBody className="flex items-center gap-4">
          <Avatar firstName={user.firstName} lastName={user.lastName} size="lg" />
          <div>
            <p className="text-base font-semibold text-neutral-900">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-neutral-500">{user.email}</p>
            <div className="mt-1 flex gap-1.5">
              {user.roles.map((r) => (
                <StatusBadge key={r} status="ACTIVE" label={r} />
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {tutorProfile && (
        <Card>
          <CardHeader title="Tutor Standing" />
          <CardBody className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1.5">
              <Star className="size-4 fill-gold-500 text-gold-500" />
              <span className="font-semibold">{tutorProfile.averageRating.toFixed(1)}</span>
              <span className="text-neutral-400">({tutorProfile.ratingCount} reviews)</span>
            </div>
            {clearance && (
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400">Clearance:</span>
                <StatusBadge status={clearance.status} />
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Personal Information" />
        <CardBody className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <TextInput label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <TextInput label="CSU Email" value={user.email} disabled hint="Institutional email cannot be changed." />
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Student ID" value={user.studentId ?? ''} disabled />
            <TextInput label="Year Level" value={user.yearLevel ?? ''} disabled />
          </div>
          <TextInput label="College" value={user.college ?? ''} disabled />
          <TextInput label="Program" value={user.program ?? ''} disabled />
          <Button onClick={() => toast.success('Profile updated.')}>Save Changes</Button>
        </CardBody>
      </Card>

      {user.roles.includes('learner') && (
        <Card>
          <CardHeader title="Account Verification" />
          <CardBody>
            {verification ? (
              <div className="flex items-center gap-3 rounded-lg border border-neutral-100 px-3.5 py-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-success-50 text-success-600">
                  <ShieldCheck className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-neutral-800">Verified — you can book sessions</p>
                  <p className="text-xs text-neutral-500">
                    {verification.documentType} on file · verified {formatDateTime(verification.verifiedAt)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-gold-200 bg-gold-50 px-3.5 py-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                  <ShieldAlert className="size-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gold-800">Not verified yet</p>
                  <p className="text-xs text-gold-700">Upload a Class Schedule, COR, or Student ID before you can book a session.</p>
                </div>
                <Button size="sm" onClick={() => setShowVerify(true)}>
                  Verify Now
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Connected Account" />
        <CardBody>
          <div className="flex items-center gap-3 rounded-lg border border-neutral-100 px-3.5 py-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-success-50 text-success-600">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-neutral-800">Signed in with Google</p>
              <p className="text-xs text-neutral-500">{user.email} · verified</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <LearnerVerificationModal
        open={showVerify}
        onClose={() => setShowVerify(false)}
        learnerId={user.id}
        onVerified={() => {
          setShowVerify(false)
          toast.success('Account verified! You can now book tutoring sessions.')
        }}
      />
    </div>
  )
}
