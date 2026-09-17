import { FileClock } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { useDb } from '../../hooks/useDb'
import { getAuditLogs } from '../../lib/selectors'
import { formatDateTime } from '../../lib/utils'

export function AdminAuditLogsPage() {
  const logs = useDb(getAuditLogs)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Audit Logs</h1>
        <p className="text-sm text-neutral-500">Read-only record of sensitive administrative actions.</p>
      </div>

      <Card>
        {logs.length === 0 ? (
          <EmptyState icon={<FileClock className="size-6" />} title="No audit logs yet" />
        ) : (
          <div className="divide-y divide-neutral-100">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-800">
                    {log.action.replace(/_/g, ' ')} <span className="font-normal text-neutral-400">· {log.targetType} {log.targetId}</span>
                  </p>
                  {log.details && <p className="text-xs text-neutral-500">{log.details}</p>}
                  <p className="text-[11px] text-neutral-400">by {log.actorName}</p>
                </div>
                <span className="shrink-0 text-xs text-neutral-400">{formatDateTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
