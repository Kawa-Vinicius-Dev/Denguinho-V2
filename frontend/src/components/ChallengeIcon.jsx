import {
  BookOpen,
  BriefcaseBusiness,
  HeartHandshake,
  HeartPulse,
  Lightbulb,
  ListChecks,
  PartyPopper,
  PiggyBank,
  Target,
} from 'lucide-react'

const icons = {
  STUDIES: BookOpen,
  WORK: BriefcaseBusiness,
  PROJECTS: Lightbulb,
  HEALTH: HeartPulse,
  ORGANIZATION: ListChecks,
  FINANCES: PiggyBank,
  RELATIONSHIP: HeartHandshake,
  LEISURE: PartyPopper,
  OTHER: Target,
}

export function ChallengeIcon({ category, tone, size = 20 }) {
  const Icon = icons[category] || Target
  return (
    <span className={`challenge-icon ${tone}`} aria-hidden="true">
      <Icon size={size} />
    </span>
  )
}
