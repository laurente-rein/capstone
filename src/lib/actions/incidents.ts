import { getDb, updateDb } from '../../store/db'
import type { IncidentEvidence, IncidentReport, IncidentType } from '../../types'
import { fullName, getIncident, getUser } from '../selectors'
import { makeId } from '../utils'
import { addAuditLog, notify } from './common'

export class IncidentError extends Error {}

export interface SubmitIncidentInput {
  bookingId?: string
  reporterId: string
  reportedUserId: string
  incidentType: IncidentType
  description: string
  evidenceFileNames: string[]
}

export function submitIncident(input: SubmitIncidentInput): IncidentReport {
  if (!input.description.trim()) throw new IncidentError('Please describe what happened.')
  const id = `INC-${new Date().getFullYear()}-${makeId('').replace(/\D/g, '').slice(-4)}`
  const report: IncidentReport = {
    id,
    bookingId: input.bookingId,
    reporterId: input.reporterId,
    reportedUserId: input.reportedUserId,
    incidentType: input.incidentType,
    description: input.description,
    evidence: input.evidenceFileNames.map<IncidentEvidence>((fileName) => ({
      id: makeId('ev'),
      incidentId: id,
      fileName,
      fileUrl: '',
      uploadedAt: new Date().toISOString(),
    })),
    status: 'SUBMITTED',
    createdAt: new Date().toISOString(),
  }
  updateDb((db) => {
    db.incidentReports = [...db.incidentReports, report]
  })
  getDb()
    .users.filter((u) => u.roles.includes('admin'))
    .forEach((admin) =>
      notify(admin.id, 'New incident report', `${fullName(getUser(input.reporterId))} filed a report: ${input.incidentType}`, 'INCIDENT', '/admin/incidents'),
    )
  return report
}

export function adminMarkUnderReview(incidentId: string) {
  updateDb((db) => {
    db.incidentReports = db.incidentReports.map((i) =>
      i.id === incidentId && i.status === 'SUBMITTED' ? { ...i, status: 'UNDER_ADMIN_REVIEW' } : i,
    )
  })
}

export function adminResolvePlatformIssue(incidentId: string, adminId: string, notes: string) {
  const incident = getIncident(incidentId)
  if (!incident) throw new IncidentError('Incident not found.')
  updateDb((db) => {
    db.incidentReports = db.incidentReports.map((i) =>
      i.id === incidentId ? { ...i, status: 'RESOLVED_PLATFORM', adminNotes: notes } : i,
    )
  })
  addAuditLog(adminId, getUser(adminId)?.firstName ?? 'Admin', 'INCIDENT_RESOLVED_PLATFORM', 'IncidentReport', incidentId, notes)
  notify(incident.reporterId, 'Incident resolved', `Your report ${incidentId} was reviewed and resolved: ${notes}`, 'INCIDENT', '/learner/sessions')
}

export function adminReferToOsas(incidentId: string, adminId: string, notes: string, priority: 'LOW' | 'MEDIUM' | 'HIGH') {
  const incident = getIncident(incidentId)
  if (!incident) throw new IncidentError('Incident not found.')
  const caseId = `CASE-${new Date().getFullYear()}-${makeId('').replace(/\D/g, '').slice(-4)}`
  updateDb((db) => {
    db.incidentReports = db.incidentReports.map((i) =>
      i.id === incidentId ? { ...i, status: 'REFERRED_TO_OSAS', adminNotes: notes } : i,
    )
    db.osasCases = [
      ...db.osasCases,
      {
        id: caseId,
        incidentReportId: incidentId,
        bookingId: incident.bookingId,
        reporterId: incident.reporterId,
        reportedUserId: incident.reportedUserId,
        incidentType: incident.incidentType,
        priority,
        status: 'OPEN',
        description: incident.description,
        timeline: [
          { id: makeId('tl'), label: 'Incident reported', at: incident.createdAt },
          { id: makeId('tl'), label: 'Referred to OSAS by Admin', at: new Date().toISOString() },
        ],
        openedAt: new Date().toISOString(),
      },
    ]
  })
  addAuditLog(adminId, getUser(adminId)?.firstName ?? 'Admin', 'INCIDENT_REFERRED_TO_OSAS', 'IncidentReport', incidentId, notes)
  getDb()
    .users.filter((u) => u.roles.includes('osas'))
    .forEach((osas) => notify(osas.id, 'New case referred', `Case ${caseId} referred by Admin for institutional review.`, 'CASE', '/osas/case-review'))
}
