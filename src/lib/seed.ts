import type { DbState } from '../store/dbTypes'
import type { SystemSettings } from '../types'
import { PAYMENT_ALLOCATION, PAYMENT_METHOD, PAYMENT_PROVIDER } from './constants'
import { addDaysToDateStr, makeId, todayStr } from './utils'

export const SEED_VERSION = 9

function iso(dateStr: string, time = '09:00') {
  return new Date(`${dateStr}T${time}:00`).toISOString()
}

/** Builds a fully-connected sample dataset anchored on "today" so the demo feels live. */
export function buildSeedData(): DbState {
  const today = todayStr()
  const d = (offset: number) => addDaysToDateStr(today, offset)

  const users: DbState['users'] = [
    {
      id: 'u-admin',
      firstName: 'Grace',
      lastName: 'Mendoza',
      email: 'admin@csu.edu.ph',
      authProvider: 'google',
      emailVerified: true,
      roles: ['admin'],
      status: 'active',
      createdAt: iso(d(-400)),
    },
    {
      id: 'u-osas',
      firstName: 'Ramon',
      lastName: 'Villareal',
      email: 'osas@csu.edu.ph',
      authProvider: 'google',
      emailVerified: true,
      roles: ['osas'],
      status: 'active',
      createdAt: iso(d(-400)),
    },
    {
      id: 'u-juan',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      studentId: '2022-00145',
      email: 'juan@csu.edu.ph',
      college: 'College of Information and Computing',
      program: 'BS Computer Science',
      yearLevel: '4th Year',
      authProvider: 'google',
      emailVerified: true,
      roles: ['learner', 'tutor'],
      status: 'active',
      createdAt: iso(d(-200)),
    },
    {
      id: 'u-maria',
      firstName: 'Maria',
      lastName: 'Angela R.',
      studentId: '2023-00892',
      email: 'maria.angela@csu.edu.ph',
      college: 'College of Engineering and Geosciences',
      program: 'BS Civil Engineering',
      yearLevel: '2nd Year',
      authProvider: 'google',
      emailVerified: true,
      roles: ['learner'],
      status: 'active',
      createdAt: iso(d(-150)),
    },
    {
      id: 'u-allen',
      firstName: 'Allen',
      lastName: 'Ezra M.',
      studentId: '2023-01120',
      email: 'allen.ezra@csu.edu.ph',
      college: 'College of Information and Computing',
      program: 'BS Information Technology',
      yearLevel: '1st Year',
      authProvider: 'google',
      emailVerified: true,
      roles: ['learner'],
      status: 'active',
      createdAt: iso(d(-120)),
    },
    {
      id: 'u-lyla',
      firstName: 'Lyla',
      lastName: 'Shane B.',
      studentId: '2022-00456',
      email: 'lyla.shane@csu.edu.ph',
      college: 'College of Science and Mathematics',
      program: 'BS Mathematics',
      yearLevel: '3rd Year',
      authProvider: 'google',
      emailVerified: true,
      roles: ['learner'],
      status: 'active',
      createdAt: iso(d(-110)),
    },
    {
      id: 'u-bea',
      firstName: 'Bea',
      lastName: 'Santos',
      studentId: '2021-00231',
      email: 'bea.santos@csu.edu.ph',
      college: 'College of Science and Mathematics',
      program: 'BS Chemistry',
      yearLevel: '4th Year',
      authProvider: 'google',
      emailVerified: true,
      roles: ['learner', 'tutor'],
      status: 'active',
      createdAt: iso(d(-300)),
    },
    {
      id: 'u-carlo',
      firstName: 'Carlo',
      lastName: 'Reyes',
      studentId: '2022-00998',
      email: 'carlo.reyes@csu.edu.ph',
      college: 'College of Information and Computing',
      program: 'BS Information Technology',
      yearLevel: '3rd Year',
      authProvider: 'google',
      emailVerified: true,
      roles: ['learner'],
      status: 'active',
      createdAt: iso(d(-90)),
    },
    {
      id: 'u-suspended',
      firstName: 'Miguel',
      lastName: 'Torres',
      studentId: '2020-00341',
      email: 'miguel.torres@csu.edu.ph',
      college: 'College of Arts and Sciences',
      program: 'BA Communication',
      yearLevel: '4th Year',
      authProvider: 'google',
      emailVerified: true,
      roles: ['learner'],
      status: 'suspended',
      suspensionReason: 'Repeated no-shows on confirmed paid sessions without notice.',
      createdAt: iso(d(-250)),
    },
  ]

  const tutorApplications: DbState['tutorApplications'] = [
    {
      id: 'ta-juan',
      userId: 'u-juan',
      status: 'APPROVED',
      subjects: ['Calculus', 'Programming', 'Statistics'],
      motivation: 'I want to help fellow CS students master programming fundamentals and math.',
      documents: [
        {
          id: 'doc-juan-1',
          applicationId: 'ta-juan',
          fileName: 'juan_cor_2026.jpg',
          fileUrl: '',
          ocrExtractedText: 'DELA CRUZ, JUAN R. | 2022-00145 | BS COMPUTER SCIENCE | 4TH YEAR',
          ocrFields: {
            Name: 'Dela Cruz, Juan R.',
            'Student ID': '2022-00145',
            Program: 'BS Computer Science',
            'Year Level': '4th Year',
          },
          ocrConfidence: 92,
          uploadedAt: iso(d(-70)),
        },
      ],
      adminNotes: 'Documents verified against student records. Approved.',
      submittedAt: iso(d(-72)),
      reviewedAt: iso(d(-70)),
      reviewedBy: 'u-admin',
    },
    {
      id: 'ta-bea',
      userId: 'u-bea',
      status: 'APPROVED',
      subjects: ['Chemistry', 'Biology'],
      motivation: 'Peer tutoring helped me pass Chem 2 — I want to pay it forward.',
      documents: [
        {
          id: 'doc-bea-1',
          applicationId: 'ta-bea',
          fileName: 'bea_cor_2026.jpg',
          fileUrl: '',
          ocrConfidence: 88,
          ocrFields: {
            Name: 'Santos, Bea',
            'Student ID': '2021-00231',
            Program: 'BS Chemistry',
            'Year Level': '4th Year',
          },
          uploadedAt: iso(d(-250)),
        },
      ],
      adminNotes: 'Approved after document match.',
      submittedAt: iso(d(-252)),
      reviewedAt: iso(d(-250)),
      reviewedBy: 'u-admin',
    },
  ]

  const tutorProfiles: DbState['tutorProfiles'] = [
    { userId: 'u-juan', bio: 'CS senior focused on programming & math fundamentals.', averageRating: 4.8, ratingCount: 24, totalEarnings: 0 },
    { userId: 'u-bea', bio: 'Chemistry major, patient and detail-oriented tutor.', averageRating: 4.6, ratingCount: 11, totalEarnings: 0 },
  ]

  // ---- Class schedules ----
  const classSchedules: DbState['classSchedules'] = [
    {
      id: 'cs-juan',
      tutorId: 'u-juan',
      status: 'CONFIRMED',
      sourceFileName: 'juan_class_schedule_1st_sem_2026.jpg',
      ocrConfidence: 91,
      entries: [
        { id: makeId('cse'), courseCode: 'IT108', courseName: 'Data Structures & Algorithms', day: 'MON', startTime: '09:00', endTime: '10:30', room: 'CIC-301' },
        { id: makeId('cse'), courseCode: 'IT108', courseName: 'Data Structures & Algorithms', day: 'WED', startTime: '09:00', endTime: '10:30', room: 'CIC-301' },
        { id: makeId('cse'), courseCode: 'CS201', courseName: 'Automata Theory', day: 'TUE', startTime: '13:00', endTime: '14:30', room: 'CIC-204' },
        { id: makeId('cse'), courseCode: 'CS201', courseName: 'Automata Theory', day: 'THU', startTime: '13:00', endTime: '14:30', room: 'CIC-204' },
        { id: makeId('cse'), courseCode: 'CS210', courseName: 'Software Engineering', day: 'FRI', startTime: '08:00', endTime: '11:00', room: 'CIC-101' },
      ],
      uploadedAt: iso(d(-2), '15:10'),
      confirmedAt: iso(d(-1), '15:45'),
    },
    {
      id: 'cs-bea',
      tutorId: 'u-bea',
      status: 'CONFIRMED',
      sourceFileName: 'bea_class_schedule_1st_sem_2026.jpg',
      ocrConfidence: 87,
      entries: [
        { id: makeId('cse'), courseCode: 'CHEM301', courseName: 'Organic Chemistry 2', day: 'MON', startTime: '10:00', endTime: '12:00', room: 'SCI-210' },
        { id: makeId('cse'), courseCode: 'CHEM301', courseName: 'Organic Chemistry 2', day: 'WED', startTime: '10:00', endTime: '12:00', room: 'SCI-210' },
      ],
      uploadedAt: iso(d(-200), '09:00'),
      confirmedAt: iso(d(-200), '09:30'),
    },
  ]

  // ---- Services ----
  const services: DbState['services'] = [
    {
      id: 'svc-calc1',
      tutorId: 'u-juan',
      title: 'Calculus 1 Tutoring',
      subject: 'Calculus 1',
      category: 'Mathematics',
      level: 'College - 1st/2nd Year',
      description: 'One-on-one help with limits, derivatives, and applications of differentiation.',
      topics: ['Limits', 'Derivatives', 'Related Rates', 'Optimization'],
      hourlyRate: 300,
      sessionType: 'BOTH',
      status: 'ACTIVE',
      createdAt: iso(d(-60)),
    },
    {
      id: 'svc-python',
      tutorId: 'u-juan',
      title: 'Basic Programming (Python)',
      subject: 'Basic Programming',
      category: 'Programming',
      level: 'College - 1st Year',
      description: 'Learn Python fundamentals — syntax, functions, lists, and problem solving.',
      topics: ['Syntax Basics', 'Functions', 'Lists & Dictionaries', 'Loops'],
      hourlyRate: 280,
      sessionType: 'ONLINE',
      status: 'ACTIVE',
      createdAt: iso(d(-58)),
    },
    {
      id: 'svc-stats',
      tutorId: 'u-juan',
      title: 'Statistics Tutoring',
      subject: 'Statistics',
      category: 'Statistics',
      level: 'College - 2nd/3rd Year',
      description: 'Probability, distributions, hypothesis testing, and applied statistics.',
      topics: ['Probability Distributions', 'Hypothesis Testing', 'Regression'],
      hourlyRate: 300,
      sessionType: 'BOTH',
      status: 'ACTIVE',
      createdAt: iso(d(-55)),
    },
    {
      id: 'svc-physics',
      tutorId: 'u-juan',
      title: 'Physics 1: Mechanics',
      subject: 'Physics 1',
      category: 'Sciences',
      level: 'College - 1st/2nd Year',
      description: 'Kinematics, Newton’s laws, work-energy theorem, and problem sets.',
      topics: ['Kinematics', "Newton's Laws", 'Energy & Work'],
      hourlyRate: 300,
      sessionType: 'ONLINE',
      status: 'ACTIVE',
      createdAt: iso(d(-50)),
    },
    {
      id: 'svc-chem',
      tutorId: 'u-bea',
      title: 'Organic Chemistry Help',
      subject: 'Organic Chemistry',
      category: 'Sciences',
      level: 'College - 2nd/3rd Year',
      description: 'Reaction mechanisms, nomenclature, and lab report guidance.',
      topics: ['Nomenclature', 'Reaction Mechanisms'],
      hourlyRate: 320,
      sessionType: 'IN_PERSON',
      status: 'ACTIVE',
      createdAt: iso(d(-180)),
    },
  ]

  // ---- Availability ----
  const availabilitySlots: DbState['availabilitySlots'] = []
  // Juan: several open slots this week (avoiding his class blocks) + next week.
  const juanSlotDefs: Array<[number, string, string]> = [
    [1, '09:00', '10:30'],
    [1, '14:00', '17:00'],
    [2, '09:00', '12:00'],
    [3, '14:00', '17:00'],
    [4, '09:00', '12:30'],
    [5, '13:00', '17:00'],
    [6, '09:00', '12:00'],
    [7, '09:00', '12:00'],
    [8, '14:00', '17:00'],
    [9, '09:00', '12:00'],
    [10, '13:00', '16:00'],
    [11, '09:00', '11:00'],
  ]
  juanSlotDefs.forEach(([offset, start, end]) => {
    availabilitySlots.push({
      id: makeId('avail'),
      tutorId: 'u-juan',
      date: d(offset),
      startTime: start,
      endTime: end,
      isActive: true,
      createdAt: iso(d(-10)),
    })
  })
  ;[[2, '13:00', '16:00'], [4, '13:00', '17:00'], [6, '10:00', '13:00']].forEach(([offset, start, end]: any) => {
    availabilitySlots.push({
      id: makeId('avail'),
      tutorId: 'u-bea',
      date: d(offset),
      startTime: start,
      endTime: end,
      isActive: true,
      createdAt: iso(d(-10)),
    })
  })

  // ---- Bookings, Payments, Allocations, Ratings ----
  const bookings: DbState['bookings'] = []
  const payments: DbState['payments'] = []
  const paymentAllocations: DbState['paymentAllocations'] = []
  const ratings: DbState['ratings'] = []

  function addPaidBooking(opts: {
    id: string
    learnerId: string
    tutorId: string
    serviceId: string
    topic: string
    date: string
    startTime: string
    endTime: string
    sessionType: 'ONLINE' | 'IN_PERSON'
    meetingPlatform?: string
    location?: string
    rate: number
    hours: number
    bookingStatus: DbState['bookings'][number]['bookingStatus']
    paymentStatus: DbState['bookings'][number]['paymentStatus']
    createdOffset: number
    rating?: { stars: number; comment: string }
  }) {
    const amount = Math.round(opts.rate * opts.hours)
    bookings.push({
      id: opts.id,
      learnerId: opts.learnerId,
      tutorId: opts.tutorId,
      serviceId: opts.serviceId,
      specificTopic: opts.topic,
      date: opts.date,
      startTime: opts.startTime,
      endTime: opts.endTime,
      sessionType: opts.sessionType,
      location: opts.location,
      meetingPlatform: opts.meetingPlatform,
      meetingUrl: opts.sessionType === 'ONLINE' ? 'https://meet.google.com/campus-tutor-demo' : undefined,
      amount,
      bookingStatus: opts.bookingStatus,
      paymentStatus: opts.paymentStatus,
      createdAt: iso(d(opts.createdOffset)),
    })
    if (opts.paymentStatus === 'PAID') {
      const paymentId = makeId('pay')
      payments.push({
        id: paymentId,
        bookingId: opts.id,
        provider: PAYMENT_PROVIDER as 'PayMongo',
        method: PAYMENT_METHOD as 'GCash',
        providerReferenceId: `pm_${makeId('ref')}`,
        grossAmount: amount,
        status: 'PAID',
        createdAt: iso(d(opts.createdOffset), '10:24'),
      })
      paymentAllocations.push({
        id: makeId('alloc'),
        paymentId,
        tutorShare: Math.round(amount * PAYMENT_ALLOCATION.TUTOR_SHARE),
        osasShare: Math.round(amount * PAYMENT_ALLOCATION.OSAS_SHARE),
        platformShare: Math.round(amount * PAYMENT_ALLOCATION.PLATFORM_SHARE),
        tutorSharePct: PAYMENT_ALLOCATION.TUTOR_SHARE,
        osasSharePct: PAYMENT_ALLOCATION.OSAS_SHARE,
        platformSharePct: PAYMENT_ALLOCATION.PLATFORM_SHARE,
      })
    }
    if (opts.rating) {
      ratings.push({
        id: makeId('rate'),
        bookingId: opts.id,
        learnerId: opts.learnerId,
        tutorId: opts.tutorId,
        stars: opts.rating.stars,
        comment: opts.rating.comment,
        createdAt: iso(opts.date, '18:00'),
      })
    }
  }

  // Upcoming sessions (matches provided Tutor Dashboard mockup)
  addPaidBooking({
    id: 'CTB-2026-101',
    learnerId: 'u-maria',
    tutorId: 'u-juan',
    serviceId: 'svc-calc1',
    topic: 'Derivatives',
    date: d(1),
    startTime: '14:00',
    endTime: '15:30',
    sessionType: 'ONLINE',
    meetingPlatform: 'Google Meet',
    rate: 300,
    hours: 1.5,
    bookingStatus: 'CONFIRMED',
    paymentStatus: 'PAID',
    createdOffset: -1,
  })
  addPaidBooking({
    id: 'CTB-2026-102',
    learnerId: 'u-allen',
    tutorId: 'u-juan',
    serviceId: 'svc-python',
    topic: 'Functions and Lists',
    date: d(2),
    startTime: '16:00',
    endTime: '17:00',
    sessionType: 'ONLINE',
    meetingPlatform: 'Zoom',
    rate: 280,
    hours: 1,
    bookingStatus: 'CONFIRMED',
    paymentStatus: 'PAID',
    createdOffset: -1,
  })
  addPaidBooking({
    id: 'CTB-2026-103',
    learnerId: 'u-lyla',
    tutorId: 'u-juan',
    serviceId: 'svc-stats',
    topic: 'Probability Distributions',
    date: d(4),
    startTime: '10:00',
    endTime: '11:30',
    sessionType: 'IN_PERSON',
    location: 'CIC Library, Study Room 2',
    rate: 300,
    hours: 1.5,
    bookingStatus: 'PENDING',
    paymentStatus: 'UNPAID',
    createdOffset: 0,
  })

  // Completed sessions this semester (24 total incl. above eventually) for earnings history + ratings
  const learnerPool = ['u-maria', 'u-allen', 'u-lyla', 'u-carlo']
  const svcPool = ['svc-calc1', 'svc-python', 'svc-stats', 'svc-physics']
  const topics = ['Limits', 'Loops & Iteration', 'Hypothesis Testing', "Newton's Laws", 'Optimization', 'Dictionaries', 'Regression', 'Kinematics']
  const comments = [
    'Explained everything so clearly, passed my exam!',
    'Very patient and prepared. Highly recommend.',
    'Helped me finally understand the topic.',
    'Good session, would book again.',
  ]
  for (let i = 0; i < 21; i++) {
    const offset = -3 - i * 3
    const learner = learnerPool[i % learnerPool.length]
    const svc = svcPool[i % svcPool.length]
    addPaidBooking({
      id: `CTB-2026-${String(200 + i).padStart(3, '0')}`,
      learnerId: learner,
      tutorId: 'u-juan',
      serviceId: svc,
      topic: topics[i % topics.length],
      date: d(offset),
      startTime: '13:00',
      endTime: '14:30',
      sessionType: i % 3 === 0 ? 'IN_PERSON' : 'ONLINE',
      meetingPlatform: i % 3 === 0 ? undefined : i % 2 === 0 ? 'Google Meet' : 'Zoom',
      location: i % 3 === 0 ? 'CIC Building, Room 105' : undefined,
      rate: services.find((s) => s.id === svc)?.hourlyRate ?? 300,
      hours: 1.5,
      bookingStatus: 'COMPLETED',
      paymentStatus: 'PAID',
      createdOffset: offset - 2,
      rating: i % 4 !== 3 ? { stars: 4 + (i % 2), comment: comments[i % comments.length] } : undefined,
    })
  }
  // A cancelled example
  bookings.push({
    id: 'CTB-2026-190',
    learnerId: 'u-carlo',
    tutorId: 'u-juan',
    serviceId: 'svc-physics',
    specificTopic: 'Work-Energy Theorem',
    date: d(-15),
    startTime: '09:00',
    endTime: '10:00',
    sessionType: 'ONLINE',
    meetingPlatform: 'Google Meet',
    amount: 300,
    bookingStatus: 'CANCELLED',
    paymentStatus: 'REFUNDED',
    createdAt: iso(d(-17)),
    cancelledBy: 'u-carlo',
    cancelReason: 'Schedule conflict with a school activity.',
  })

  // Bea's history (lighter)
  addPaidBooking({
    id: 'CTB-2026-301',
    learnerId: 'u-maria',
    tutorId: 'u-bea',
    serviceId: 'svc-chem',
    topic: 'Reaction Mechanisms',
    date: d(-6),
    startTime: '10:00',
    endTime: '11:30',
    sessionType: 'IN_PERSON',
    location: 'Science Building, Rm 210',
    rate: 320,
    hours: 1.5,
    bookingStatus: 'COMPLETED',
    paymentStatus: 'PAID',
    createdOffset: -8,
    rating: { stars: 5, comment: 'Bea made organic chem finally make sense.' },
  })

  // Update tutor profile earnings totals from allocations
  function totalTutorEarnings(tutorId: string) {
    return bookings
      .filter((b) => b.tutorId === tutorId && b.paymentStatus === 'PAID')
      .reduce((sum, b) => {
        const pay = payments.find((p) => p.bookingId === b.id)
        const alloc = pay && paymentAllocations.find((a) => a.paymentId === pay.id)
        return sum + (alloc?.tutorShare ?? 0)
      }, 0)
  }
  tutorProfiles.forEach((tp) => {
    tp.totalEarnings = totalTutorEarnings(tp.userId)
  })

  // ---- Conversations & Messages ----
  const conversations: DbState['conversations'] = [
    { id: 'conv-juan-maria', participantIds: ['u-juan', 'u-maria'], contextBookingId: 'CTB-2026-101', lastMessageAt: iso(d(0), '08:00') },
    { id: 'conv-juan-allen', participantIds: ['u-juan', 'u-allen'], contextBookingId: 'CTB-2026-102', lastMessageAt: iso(d(-1), '18:12') },
    { id: 'conv-juan-lyla', participantIds: ['u-juan', 'u-lyla'], contextBookingId: 'CTB-2026-103', lastMessageAt: iso(d(0), '07:30') },
  ]
  const messages: DbState['messages'] = [
    { id: makeId('msg'), conversationId: 'conv-juan-maria', senderId: 'u-maria', body: 'Hi Juan! Looking forward to our Calculus session tomorrow.', createdAt: iso(d(0), '07:55'), readBy: ['u-maria', 'u-juan'] },
    { id: makeId('msg'), conversationId: 'conv-juan-maria', senderId: 'u-juan', body: 'Hi Maria! Yes, see you at 2 PM on Google Meet. Bring your derivatives worksheet.', createdAt: iso(d(0), '08:00'), readBy: ['u-maria', 'u-juan'] },
    { id: makeId('msg'), conversationId: 'conv-juan-allen', senderId: 'u-allen', body: 'Hi Kuya Juan, can we cover default arguments too?', createdAt: iso(d(-1), '18:12'), readBy: ['u-allen'] },
    { id: makeId('msg'), conversationId: 'conv-juan-lyla', senderId: 'u-lyla', body: 'Good morning po, is the venue still the CIC Library?', createdAt: iso(d(0), '07:30'), readBy: ['u-lyla'] },
  ]

  // ---- Notifications ----
  const notifications: DbState['notifications'] = [
    { id: makeId('ntf'), userId: 'u-juan', title: 'Payment received', body: 'Payment received for Maria Angela R. — ₱450 (Calculus 1)', type: 'PAYMENT', linkTo: '/tutor/sessions', read: false, createdAt: iso(d(0), '10:24') },
    { id: makeId('ntf'), userId: 'u-juan', title: 'New message', body: 'New message from Allen Ezra M.', type: 'MESSAGE', linkTo: '/tutor/messages', read: false, createdAt: iso(d(-1), '18:12') },
    { id: makeId('ntf'), userId: 'u-juan', title: 'Class schedule confirmed', body: 'Your class schedule was successfully confirmed.', type: 'SCHEDULE', linkTo: '/tutor/availability', read: true, createdAt: iso(d(-1), '15:45') },
    { id: makeId('ntf'), userId: 'u-juan', title: 'New booking request', body: 'Lyla Shane B. requested a Statistics session.', type: 'BOOKING', linkTo: '/tutor/sessions', read: false, createdAt: iso(d(0), '07:20') },
    { id: makeId('ntf'), userId: 'u-maria', title: 'Booking confirmed', body: 'Your session with Juan Dela Cruz is confirmed for ' + d(1) + '.', type: 'BOOKING', linkTo: '/learner/sessions', read: false, createdAt: iso(d(-1)) },
  ]

  // ---- Incidents & OSAS ----
  const incidentReports: DbState['incidentReports'] = [
    {
      id: 'INC-2026-001',
      bookingId: 'CTB-2026-190',
      reporterId: 'u-carlo',
      reportedUserId: 'u-suspended',
      incidentType: 'No Show',
      description: 'Tutor did not show up for the confirmed session and did not respond to messages.',
      evidence: [{ id: makeId('ev'), incidentId: 'INC-2026-001', fileName: 'chat_screenshot.png', fileUrl: '', uploadedAt: iso(d(-14)) }],
      status: 'REFERRED_TO_OSAS',
      adminNotes: 'Pattern of repeated no-shows — referring to OSAS for institutional review.',
      createdAt: iso(d(-15)),
    },
    {
      id: 'INC-2026-002',
      reporterId: 'u-allen',
      reportedUserId: 'u-juan',
      incidentType: 'Technical Issue',
      description: 'Google Meet link did not work at session start, had to reschedule.',
      evidence: [],
      status: 'RESOLVED_PLATFORM',
      adminNotes: 'Confirmed isolated Meet outage. No action needed against tutor.',
      createdAt: iso(d(-9)),
    },
  ]

  const osasCases: DbState['osasCases'] = [
    {
      id: 'CASE-2026-001',
      incidentReportId: 'INC-2026-001',
      bookingId: 'CTB-2026-190',
      reporterId: 'u-carlo',
      reportedUserId: 'u-suspended',
      incidentType: 'No Show',
      priority: 'MEDIUM',
      status: 'EVIDENCE_REVIEW',
      assignedTo: 'u-osas',
      description: 'Referred by Admin: repeated no-shows on confirmed, paid tutoring sessions.',
      timeline: [
        { id: makeId('tl'), label: 'Incident reported by learner', at: iso(d(-15)) },
        { id: makeId('tl'), label: 'Referred to OSAS by Admin', at: iso(d(-14)) },
        { id: makeId('tl'), label: 'Case opened, assigned to Ramon Villareal', at: iso(d(-13)) },
      ],
      openedAt: iso(d(-13)),
    },
  ]

  const evidenceValidations: DbState['evidenceValidations'] = []

  const clearanceReviews: DbState['clearanceReviews'] = [
    { id: makeId('clr'), userId: 'u-suspended', status: 'ON_HOLD', reason: 'Active OSAS case regarding repeated no-shows.', relatedCaseIds: ['CASE-2026-001'], updatedAt: iso(d(-13)) },
    { id: makeId('clr'), userId: 'u-juan', status: 'CLEARED', relatedCaseIds: [], updatedAt: iso(d(-100)) },
  ]

  const policies: DbState['policies'] = [
    {
      id: 'pol-1',
      title: 'Peer Tutoring Code of Conduct',
      category: 'Conduct',
      body: 'All tutors and learners must attend confirmed sessions on time. Repeated no-shows without notice may be referred to OSAS for institutional review.',
      updatedAt: iso(d(-300)),
    },
    {
      id: 'pol-2',
      title: 'Incident Reporting & Referral Procedure',
      category: 'Procedure',
      body: 'Incidents reported by students are first reviewed by Admin. Institutional conduct matters are referred to OSAS for formal case review, evidence validation, and decision.',
      updatedAt: iso(d(-300)),
    },
    {
      id: 'pol-3',
      title: 'Clearance Hold Guidelines',
      category: 'Clearance',
      body: 'A clearance hold requires an OSAS case decision with an explicit clearance effect. An incident report alone does not establish a hold.',
      updatedAt: iso(d(-300)),
    },
  ]

  const auditLogs: DbState['auditLogs'] = [
    { id: makeId('log'), actorId: 'u-admin', actorName: 'Grace Mendoza', action: 'TUTOR_APPROVED', targetType: 'TutorApplication', targetId: 'ta-juan', details: 'Approved Juan Dela Cruz as Tutor', createdAt: iso(d(-70)) },
    { id: makeId('log'), actorId: 'u-admin', actorName: 'Grace Mendoza', action: 'TUTOR_APPROVED', targetType: 'TutorApplication', targetId: 'ta-bea', details: 'Approved Bea Santos as Tutor', createdAt: iso(d(-250)) },
    { id: makeId('log'), actorId: 'u-admin', actorName: 'Grace Mendoza', action: 'USER_SUSPENDED', targetType: 'User', targetId: 'u-suspended', details: 'Suspended for repeated no-shows', createdAt: iso(d(-14)) },
    { id: makeId('log'), actorId: 'u-admin', actorName: 'Grace Mendoza', action: 'INCIDENT_REFERRED_TO_OSAS', targetType: 'IncidentReport', targetId: 'INC-2026-001', details: 'Referred to OSAS for institutional review', createdAt: iso(d(-14)) },
  ]

  const settings: SystemSettings = {
    ocrConfidenceThreshold: 80,
    automaticTutorApproval: false,
    paymentProvider: PAYMENT_PROVIDER,
    paymentMethod: PAYMENT_METHOD,
    tutorSharePct: PAYMENT_ALLOCATION.TUTOR_SHARE,
    osasSharePct: PAYMENT_ALLOCATION.OSAS_SHARE,
    platformSharePct: PAYMENT_ALLOCATION.PLATFORM_SHARE,
  }

  return {
    seedVersion: SEED_VERSION,
    users,
    tutorApplications,
    tutorProfiles,
    classSchedules,
    services,
    availabilitySlots,
    bookings,
    rescheduleRequests: [],
    payments,
    paymentAllocations,
    refunds: [],
    ratings,
    conversations,
    messages,
    notifications,
    incidentReports,
    evidenceValidations,
    caseActions: [],
    osasCases,
    clearanceReviews,
    policies,
    auditLogs,
    settings,
    savedTutors: [
      { id: makeId('saved'), learnerId: 'u-maria', tutorId: 'u-bea', createdAt: iso(d(-5)) },
    ],
    notificationPreferences: [],
  }
}

// Every account below is a single, unified identity — there is no separate "tutor account".
// Juan and Bea already have an approved Tutor capability on their same Learner account so
// there's a working marketplace (services, bookings, ratings) to browse from day one. Any
// other Learner account — or a brand new Google sign-in — can go through the real pipeline
// end to end: Apply as Tutor -> Admin approves -> upload & confirm class schedule -> create
// services, all on that one account.
//
// These populate the simulated Google account picker on the login page — standing in for
// the real Google OAuth consent screen, which this demo environment has no client ID for.
export const DEMO_ACCOUNTS = [
  { name: 'Juan Dela Cruz', role: 'Learner / Tutor — established marketplace', email: 'juan@csu.edu.ph' },
  { name: 'Maria Angela R.', role: 'Learner — try Apply as Tutor from scratch', email: 'maria.angela@csu.edu.ph' },
  { name: 'Grace Mendoza', role: 'Admin', email: 'admin@csu.edu.ph' },
  { name: 'Ramon Villareal', role: 'OSAS', email: 'osas@csu.edu.ph' },
]
