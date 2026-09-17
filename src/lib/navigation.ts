import {
  Archive,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  Briefcase,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileSearch,
  FileClock,
  FolderSearch,
  Heart,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Star,
  User,
  Users,
  Wallet,
} from 'lucide-react'
import type { ComponentType } from 'react'

export interface NavItem {
  label: string
  path: string
  icon: ComponentType<{ className?: string }>
}

export const learnerNav: NavItem[] = [
  { label: 'Dashboard', path: '/learner/dashboard', icon: LayoutDashboard },
  { label: 'Find a Tutor', path: '/learner/find-tutor', icon: Search },
  { label: 'My Sessions', path: '/learner/sessions', icon: CalendarDays },
  { label: 'Messages', path: '/learner/messages', icon: MessageSquare },
  { label: 'Saved Tutors', path: '/learner/saved-tutors', icon: Heart },
  { label: 'My Reviews', path: '/learner/my-reviews', icon: Star },
  { label: 'Notifications', path: '/learner/notifications', icon: Bell },
]

export const learnerAccountNav: NavItem[] = [
  { label: 'Profile', path: '/learner/profile', icon: User },
  { label: 'Settings', path: '/learner/settings', icon: Settings },
  { label: 'Help & Support', path: '/learner/help', icon: HelpCircle },
]

export const tutorNav: NavItem[] = [
  { label: 'Dashboard', path: '/tutor/dashboard', icon: LayoutDashboard },
  { label: 'My Services', path: '/tutor/services', icon: Briefcase },
  { label: 'Availability & Schedule', path: '/tutor/availability', icon: CalendarClock },
  { label: 'My Sessions', path: '/tutor/sessions', icon: CalendarDays },
  { label: 'Messages', path: '/tutor/messages', icon: MessageSquare },
  { label: 'Earnings', path: '/tutor/earnings', icon: Wallet },
  { label: 'Notifications', path: '/tutor/notifications', icon: Bell },
  { label: 'Profile', path: '/tutor/profile', icon: User },
  { label: 'Help & Safety', path: '/tutor/help', icon: HelpCircle },
]

export const adminNav: NavItem[] = [
  { label: 'Overview', path: '/admin/overview', icon: LayoutDashboard },
  { label: 'User Management', path: '/admin/users', icon: Users },
  { label: 'Tutor Verification', path: '/admin/tutor-verification', icon: ShieldCheck },
  { label: 'Service Management', path: '/admin/services', icon: ClipboardList },
  { label: 'Bookings Monitoring', path: '/admin/bookings', icon: BookOpen },
  { label: 'Payments & Transactions', path: '/admin/payments', icon: CreditCard },
  { label: 'Incident Reports', path: '/admin/incidents', icon: ShieldAlert },
  { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileClock },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
]

export const osasNav: NavItem[] = [
  { label: 'Overview', path: '/osas/overview', icon: LayoutDashboard },
  { label: 'Case Review', path: '/osas/case-review', icon: FolderSearch },
  { label: 'Evidence Validation', path: '/osas/evidence-validation', icon: FileSearch },
  { label: 'Incident Monitoring', path: '/osas/incident-monitoring', icon: ShieldAlert },
  { label: 'Student Clearance Review', path: '/osas/clearance', icon: ClipboardCheck },
  { label: 'Policies & Procedures', path: '/osas/policies', icon: BookMarked },
  { label: 'Case Archive', path: '/osas/archive', icon: Archive },
  { label: 'Reports & Analytics', path: '/osas/reports', icon: BarChart3 },
  { label: 'Settings', path: '/osas/settings', icon: Settings },
]
