import { BookMarked } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { useDb } from '../../hooks/useDb'
import { getDb } from '../../store/db'
import { formatDateTime } from '../../lib/utils'

export function OsasPoliciesPage() {
  const policies = useDb(() => getDb().policies)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Policies & Procedures</h1>
        <p className="text-sm text-neutral-500">Institutional reference documents for case handling.</p>
      </div>

      {policies.length === 0 ? (
        <Card>
          <EmptyState icon={<BookMarked className="size-6" />} title="No policies published" />
        </Card>
      ) : (
        policies.map((p) => (
          <Card key={p.id}>
            <CardHeader title={p.title} subtitle={`${p.category} · Updated ${formatDateTime(p.updatedAt)}`} icon={<BookMarked className="size-4" />} />
            <CardBody>
              <p className="text-sm text-neutral-600">{p.body}</p>
            </CardBody>
          </Card>
        ))
      )}
    </div>
  )
}
