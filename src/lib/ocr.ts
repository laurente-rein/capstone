import Tesseract from 'tesseract.js'
import type { ClassScheduleEntry } from '../types'
import { makeId } from './utils'

export interface OcrResult {
  text: string
  confidence: number
  supported: boolean
}

/** Runs real client-side Tesseract OCR on an uploaded image. PDFs are not rasterized
 * client-side, so for a .pdf we skip text extraction and let the reviewer key in rows
 * manually — OCR is decision support, never a substitute for the human review step. */
export async function runOcr(file: File, onProgress?: (pct: number) => void): Promise<OcrResult> {
  if (file.type === 'application/pdf') {
    return { text: '', confidence: 0, supported: false }
  }
  const { data } = await Tesseract.recognize(file, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) onProgress(Math.round(m.progress * 100))
    },
  })
  return { text: data.text, confidence: Math.round(data.confidence), supported: true }
}

const DAY_PATTERN = 'MON|TUE|WED|THU|FRI|SAT|SUN'
const LINE_REGEX = new RegExp(
  `([A-Z]{2,6}\\s?\\d{2,4})\\s+(.*?)\\s+(${DAY_PATTERN})\\s+(\\d{1,2}:\\d{2})\\s*(?:AM|PM)?\\s*[-–to]+\\s*(\\d{1,2}:\\d{2})\\s*(?:AM|PM)?\\s*(?:Room\\s*([A-Za-z0-9-]+))?`,
  'i',
)

/** Best-effort regex extraction of course rows from raw OCR text. Always used as a
 * starting point for the human Review step — never as the final data. */
export function parseClassScheduleText(text: string): ClassScheduleEntry[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const entries: ClassScheduleEntry[] = []
  for (const line of lines) {
    const match = line.match(LINE_REGEX)
    if (match) {
      entries.push({
        id: makeId('cse'),
        courseCode: match[1].toUpperCase().replace(/\s+/, ''),
        courseName: match[2].trim(),
        day: match[3].toUpperCase() as ClassScheduleEntry['day'],
        startTime: normalizeTime(match[4]),
        endTime: normalizeTime(match[5]),
        room: match[6],
      })
    }
  }
  return entries
}

function normalizeTime(t: string): string {
  const [h, m] = t.split(':')
  return `${h.padStart(2, '0')}:${m}`
}

export interface OcrFieldGuess {
  name?: string
  studentId?: string
  program?: string
  yearLevel?: string
}

/** Best-effort regex extraction of identity fields from a verification document —
 * decision support only. Confidence and authenticity are for Admin to judge. */
export function parseVerificationFields(text: string): OcrFieldGuess {
  const grab = (label: RegExp) => text.match(label)?.[1]?.trim()
  return {
    name: grab(/name[:\s]+([A-Za-z.,\s]{3,60})/i),
    studentId: grab(/student\s*(?:id|no\.?)[:\s]+([\dA-Z-]{5,15})/i),
    program: grab(/program[:\s]+([A-Za-z\s.]{3,60})/i),
    yearLevel: grab(/year\s*level[:\s]+([\dA-Za-z\s]{3,20})/i),
  }
}
