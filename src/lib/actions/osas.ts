import { updateDb } from '../../store/db'
import type { CaseDecisionType, EvidenceValidation } from '../../types'
import { getOsasCase, getUser } from '../selectors'
import { makeId } from '../utils'
import { addAuditLog, notify } from './common'

export class OsasError extends Error {}

export function assignCase(caseId: string, assignedTo: string) {
  updateDb((db) => {
    db.osasCases = db.osasCases.map((c) => (c.id === caseId ? { ...c, assignedTo, status: c.status === 'OPEN' ? 'EVIDENCE_REVIEW' : c.status } : c))
  })
}

export interface EvidenceValidationInput {
  evidenceId: string
  readability: boolean
  contextCompleteness: boolean
  relevance: boolean
  sourceVerification: boolean
  signsOfManipulation: boolean
  result: EvidenceValidation['result']
  notes?: string
  validatedBy: string
}

export function addEvidenceValidation(caseId: string, input: EvidenceValidationInput) {
  updateDb((db) => {
    db.evidenceValidations = [
      ...db.evidenceValidations,
      { id: makeId('eval'), caseId, ...input, validatedAt: new Date().toISOString() },
    ]
    db.osasCases = db.osasCases.map((c) =>
      c.id === caseId
        ? { ...c, timeline: [...c.timeline, { id: makeId('tl'), label: `Evidence validated: ${input.result.replace(/_/g, ' ')}`, at: new Date().toISOString() }] }
        : c,
    )
  })
}

export function addCaseAction(caseId: string, action: string, notes: string, actedBy: string) {
  if (!action.trim()) throw new OsasError('Please describe the case action.')
  updateDb((db) => {
    db.caseActions = [...db.caseActions, { id: makeId('act'), caseId, action, notes, actedBy, createdAt: new Date().toISOString() }]
    db.osasCases = db.osasCases.map((c) =>
      c.id === caseId ? { ...c, timeline: [...c.timeline, { id: makeId('tl'), label: action, at: new Date().toISOString() }] } : c,
    )
  })
}

const HOLD_DECISIONS: CaseDecisionType[] = ['Clearance Hold Recommended']
const CLEAR_DECISIONS: CaseDecisionType[] = ['No Violation', 'Case Dismissed']

export function recordCaseDecision(
  caseId: string,
  decision: CaseDecisionType,
  details: string,
  clearanceEffect: string | undefined,
  decidedBy: string,
) {
  const kase = getOsasCase(caseId)
  if (!kase) throw new OsasError('Case not found.')
  updateDb((db) => {
    db.osasCases = db.osasCases.map((c) =>
      c.id === caseId
        ? {
            ...c,
            status: 'DECIDED',
            decision: { id: makeId('dec'), caseId, decision, details, clearanceEffect, decidedBy, decidedAt: new Date().toISOString() },
            timeline: [...c.timeline, { id: makeId('tl'), label: `Decision recorded: ${decision}`, at: new Date().toISOString() }],
          }
        : c,
    )
    const existingClearance = db.clearanceReviews.find((cr) => cr.userId === kase.reportedUserId)
    if (HOLD_DECISIONS.includes(decision)) {
      const updated = { status: 'ON_HOLD' as const, reason: clearanceEffect || details, relatedCaseIds: [...(existingClearance?.relatedCaseIds ?? []), caseId], updatedAt: new Date().toISOString() }
      db.clearanceReviews = existingClearance
        ? db.clearanceReviews.map((cr) => (cr.userId === kase.reportedUserId ? { ...cr, ...updated } : cr))
        : [...db.clearanceReviews, { id: makeId('clr'), userId: kase.reportedUserId, ...updated }]
    } else if (CLEAR_DECISIONS.includes(decision)) {
      const updated = { status: 'CLEARED' as const, reason: undefined, relatedCaseIds: existingClearance?.relatedCaseIds ?? [], updatedAt: new Date().toISOString() }
      db.clearanceReviews = existingClearance
        ? db.clearanceReviews.map((cr) => (cr.userId === kase.reportedUserId ? { ...cr, ...updated } : cr))
        : [...db.clearanceReviews, { id: makeId('clr'), userId: kase.reportedUserId, ...updated }]
    } else {
      const updated = { status: 'REQUIRES_RESOLUTION' as const, reason: details, relatedCaseIds: [...(existingClearance?.relatedCaseIds ?? []), caseId], updatedAt: new Date().toISOString() }
      db.clearanceReviews = existingClearance
        ? db.clearanceReviews.map((cr) => (cr.userId === kase.reportedUserId ? { ...cr, ...updated } : cr))
        : [...db.clearanceReviews, { id: makeId('clr'), userId: kase.reportedUserId, ...updated }]
    }
  })
  addAuditLog(decidedBy, getUser(decidedBy)?.firstName ?? 'OSAS', 'CASE_DECISION_RECORDED', 'OsasCase', caseId, decision)
  notify(kase.reportedUserId, 'Case decision recorded', `A decision has been recorded on your case: ${decision}.`, 'CASE', '/profile')
}

export function archiveCase(caseId: string) {
  updateDb((db) => {
    db.osasCases = db.osasCases.map((c) => (c.id === caseId ? { ...c, status: 'ARCHIVED' } : c))
  })
}

export function updateClearanceStatus(userId: string, status: 'PENDING_REVIEW' | 'CLEARED' | 'ON_HOLD' | 'REQUIRES_RESOLUTION', reason: string) {
  if ((status === 'ON_HOLD' || status === 'REQUIRES_RESOLUTION') && !reason.trim()) {
    throw new OsasError('An institutional basis/reason is required for this clearance status.')
  }
  updateDb((db) => {
    const existing = db.clearanceReviews.find((cr) => cr.userId === userId)
    db.clearanceReviews = existing
      ? db.clearanceReviews.map((cr) => (cr.userId === userId ? { ...cr, status, reason: reason || undefined, updatedAt: new Date().toISOString() } : cr))
      : [...db.clearanceReviews, { id: makeId('clr'), userId, status, reason: reason || undefined, relatedCaseIds: [], updatedAt: new Date().toISOString() }]
  })
}
