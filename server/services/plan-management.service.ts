import { getPlanBySlug } from '@/server/domains/billing/plans/plan.config'
import { planRepository } from '@/server/domains/billing/plans/plan.repository'
import type { PlanDTO, PlanListDTO } from '@/server/domains/billing/dto/billing.dto'
import { auditLogService } from '@/server/services/audit-log.service'

export interface PlanManagementQueryDTO {
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL'
  search?: string
}

export interface UpdatePlanInput {
  name?: string
  description?: string
  price?: number
  displayOrder?: number
  interval?: PlanDTO['interval']
  features?: string[]
  isActive?: boolean
}

export interface PlanManagementActor {
  id: string
  role?: string | null
}

type PlanMetadataRecord = {
  name?: string
  description?: string
  price?: number
  displayOrder?: number
  features?: string[]
  interval?: PlanDTO['interval']
  isActive?: boolean
}

export class PlanManagementService {
  private metadataByPlanId = new Map<string, PlanMetadataRecord>()

  async getPlans(query: PlanManagementQueryDTO = {}): Promise<PlanListDTO> {
    const plans = await planRepository.findAll()
    const filtered = plans
      .map((plan) => this.mapPlanToDTO(plan))
      .filter((plan) => this.matchesQuery(plan, query))
      .sort((a, b) => (a.displayOrder - b.displayOrder) || a.name.localeCompare(b.name))

    return {
      plans: filtered,
      total: filtered.length,
    }
  }

  async getPlan(id: string): Promise<PlanDTO | null> {
    const plan = await planRepository.findById(id)
    return plan ? this.mapPlanToDTO(plan) : null
  }

  async updatePlan(id: string, input: UpdatePlanInput, actor: PlanManagementActor): Promise<PlanDTO> {
    const existingPlan = await planRepository.findById(id)

    if (!existingPlan) {
      throw new Error('Plan not found')
    }

    const updateData: Record<string, unknown> = {}

    if (input.name !== undefined) {
      updateData.name = input.name
    }

    if (input.interval !== undefined) {
      updateData.interval = input.interval
    }

    if (input.isActive !== undefined) {
      updateData.isActive = input.isActive
    }

    const metadata: PlanMetadataRecord = {
      ...(this.metadataByPlanId.get(id) ?? {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
      ...(input.features !== undefined ? { features: input.features } : {}),
      ...(input.interval !== undefined ? { interval: input.interval } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    }

    this.metadataByPlanId.set(id, metadata)

    const updatedPlan = Object.keys(updateData).length > 0 ? await planRepository.update(id, updateData as any) : existingPlan

    const dto = this.mapPlanToDTO(updatedPlan)

    await auditLogService.recordEvent({
      actorId: actor.id,
      actorRole: actor.role ?? null,
      action: 'plan.updated',
      entityType: 'SubscriptionPlan',
      entityId: id,
      metadata: {
        name: dto.name,
        price: dto.price,
        displayOrder: dto.displayOrder,
        isActive: dto.isActive,
        features: dto.features,
      },
    })

    return dto
  }

  async togglePlanStatus(id: string, isActive: boolean, actor: PlanManagementActor): Promise<PlanDTO> {
    const existingPlan = await planRepository.findById(id)

    if (!existingPlan) {
      throw new Error('Plan not found')
    }

    const updatedPlan = await planRepository.update(id, { isActive })
    const dto = this.mapPlanToDTO(updatedPlan)

    await auditLogService.recordEvent({
      actorId: actor.id,
      actorRole: actor.role ?? null,
      action: isActive ? 'plan.activated' : 'plan.deactivated',
      entityType: 'SubscriptionPlan',
      entityId: id,
      metadata: {
        isActive: dto.isActive,
      },
    })

    return dto
  }

  private matchesQuery(plan: PlanDTO, query: PlanManagementQueryDTO): boolean {
    if (query.status === 'ACTIVE' && !plan.isActive) {
      return false
    }

    if (query.status === 'INACTIVE' && plan.isActive) {
      return false
    }

    const search = query.search?.trim().toLowerCase()

    if (!search) {
      return true
    }

    return [plan.name, plan.slug, plan.description ?? '', plan.interval].some((value) => value.toLowerCase().includes(search))
  }

  private mapPlanToDTO(plan: any): PlanDTO {
    const metadata = this.metadataByPlanId.get(plan.id) ?? {}
    const configPlan = getPlanBySlug(plan.slug)
    const resolvedPrice = this.resolvePrice(plan.productPrice?.amount, metadata.price ?? configPlan?.price)
    const resolvedCurrency = plan.productPrice?.currency ?? configPlan?.currency ?? 'INR'
    const resolvedDescription = metadata.description ?? configPlan?.description ?? plan.name
    const resolvedFeatures = metadata.features ?? configPlan?.features?.map((feature) => feature) ?? []
    const resolvedDisplayOrder = metadata.displayOrder ?? configPlan?.displayOrder ?? 0
    const resolvedInterval = (metadata.interval ?? plan.interval ?? configPlan?.interval ?? 'monthly') as PlanDTO['interval']

    return {
      id: plan.id,
      slug: plan.slug,
      name: metadata.name ?? plan.name ?? configPlan?.name ?? plan.slug,
      interval: resolvedInterval,
      price: resolvedPrice,
      currency: resolvedCurrency,
      isActive: metadata.isActive ?? plan.isActive ?? true,
      features: resolvedFeatures,
      description: resolvedDescription,
      displayOrder: resolvedDisplayOrder,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    }
  }

  private resolvePrice(amount: unknown, fallback: number | undefined): number {
    if (typeof amount === 'number') {
      return amount
    }

    if (typeof amount === 'string') {
      const parsed = Number(amount)
      return Number.isFinite(parsed) ? parsed : fallback ?? 0
    }

    if (amount && typeof amount === 'object' && 'toString' in amount) {
      const parsed = Number((amount as { toString: () => string }).toString())
      return Number.isFinite(parsed) ? parsed : fallback ?? 0
    }

    return fallback ?? 0
  }
}

export const planManagementService = new PlanManagementService()
