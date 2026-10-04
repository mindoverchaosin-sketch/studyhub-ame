export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'
export type SuspensionType = 'TEMPORARY' | 'INDEFINITE'

export type AccountStatusSource = {
  accountStatus?: string | null
  isActive?: boolean | null
  suspensionType?: string | null
  suspensionEndsAt?: Date | string | null
}

export function normalizeAccountStatus(value?: string | null): AccountStatus {
  const normalized = (value ?? '').toString().trim().toUpperCase()

  switch (normalized) {
    case 'TERMINATED':
      return 'TERMINATED'
    case 'SUSPENDED':
      return 'SUSPENDED'
    case 'ACTIVE':
    default:
      return 'ACTIVE'
  }
}

export function isTemporarySuspensionExpired(user?: AccountStatusSource | null): boolean {
  if (!user || user.suspensionType !== 'TEMPORARY') {
    return false
  }

  const endsAt = user.suspensionEndsAt ? new Date(user.suspensionEndsAt) : null
  if (!endsAt || Number.isNaN(endsAt.getTime())) {
    return false
  }

  return endsAt.getTime() <= Date.now()
}

export function getAccountStatus(user?: AccountStatusSource | null): AccountStatus {
  const normalizedStatus = normalizeAccountStatus(user?.accountStatus)

  if (normalizedStatus === 'TERMINATED') {
    return 'TERMINATED'
  }

  if (user?.isActive === false || normalizedStatus === 'SUSPENDED') {
    return isTemporarySuspensionExpired(user) ? 'ACTIVE' : 'SUSPENDED'
  }

  if (isTemporarySuspensionExpired(user)) {
    return 'ACTIVE'
  }

  return 'ACTIVE'
}

export function getSuspensionType(user?: AccountStatusSource | null): SuspensionType | null {
  if (!user?.suspensionType) {
    return null
  }

  const value = user.suspensionType.toString().trim().toUpperCase()
  if (value === 'TEMPORARY' || value === 'INDEFINITE') {
    return value as SuspensionType
  }

  return null
}