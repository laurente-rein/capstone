// Centralized business rules — never hardcode these values elsewhere.

export const OCR_CONFIDENCE_THRESHOLD = 80 // percent

export const PAYMENT_ALLOCATION = {
  TUTOR_SHARE: 0.9,
  OSAS_SHARE: 0.05,
  PLATFORM_SHARE: 0.05,
} as const

export const PAYMENT_PROVIDER = 'PayMongo'
export const PAYMENT_METHOD = 'GCash'

export const AUTOMATIC_TUTOR_APPROVAL = false

export const CSU_EMAIL_DOMAIN = 'csu.edu.ph'

export const OTP_LENGTH = 6
export const OTP_EXPIRY_SECONDS = 5 * 60
export const OTP_RESEND_COOLDOWN_SECONDS = 30

export const COLLEGES = [
  'College of Engineering and Geosciences',
  'College of Information and Computing',
  'College of Science and Mathematics',
  'College of Agriculture and Agri-Industries',
  'College of Education',
  'College of Arts and Sciences',
  'College of Forestry and Environmental Science',
  'College of Economics and Management',
]

export const PROGRAMS: Record<string, string[]> = {
  'College of Information and Computing': [
    'BS Information Technology',
    'BS Computer Science',
    'BS Information Systems',
  ],
  'College of Engineering and Geosciences': [
    'BS Civil Engineering',
    'BS Electrical Engineering',
    'BS Geodetic Engineering',
    'BS Mining Engineering',
  ],
  'College of Science and Mathematics': ['BS Biology', 'BS Mathematics', 'BS Chemistry'],
  'College of Agriculture and Agri-Industries': ['BS Agriculture', 'BS Agribusiness'],
  'College of Education': ['BSEd English', 'BSEd Mathematics', 'BEEd'],
  'College of Arts and Sciences': ['BA Communication', 'BA Political Science'],
  'College of Forestry and Environmental Science': ['BS Forestry', 'BS Environmental Science'],
  'College of Economics and Management': ['BS Accountancy', 'BS Business Administration'],
}

export const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']

export const SUBJECT_CATEGORIES = [
  'Mathematics',
  'Programming',
  'Sciences',
  'Languages',
  'Engineering',
  'Business',
  'Statistics',
  'General Education',
]
