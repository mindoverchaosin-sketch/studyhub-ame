'use client'

import { useState, useTransition } from 'react'
import { cancelSubscription, downgradeSubscription, expireSubscription, pauseSubscription, renewSubscription, resumeSubscription, upgradeSubscription } from '@/server/actions/billing.actions'

interface Props {
  subscriptionId: string
  currentPlanId: string
  plans: Array<{ id: string; name: string }>
}

export default function SubscriptionAdminActions({ subscriptionId, currentPlanId, plans }: Props) {
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId)
  const [isPending, startTransition] = useTransition()

  const runAction = (action: () => Promise<unknown>, label: string) => {
    if (!window.confirm(`Confirm ${label} for this subscription?`)) {
      return
    }

    startTransition(async () => {
      await action()
    })
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <select
          value={selectedPlanId}
          onChange={(event) => setSelectedPlanId(event.target.value)}
          className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(() => upgradeSubscription(subscriptionId, selectedPlanId), 'upgrade plan')}
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          Upgrade
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(() => downgradeSubscription(subscriptionId, selectedPlanId), 'downgrade plan')}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Downgrade
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(() => pauseSubscription(subscriptionId), 'pause subscription')}
          className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700"
        >
          Pause
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(() => resumeSubscription(subscriptionId), 'resume subscription')}
          className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
        >
          Resume
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(() => cancelSubscription(subscriptionId), 'cancel subscription')}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(() => expireSubscription(subscriptionId), 'expire subscription')}
          className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
        >
          Expire
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(() => renewSubscription(subscriptionId), 'manual renewal')}
          className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700"
        >
          Renew
        </button>
      </div>
    </div>
  )
}
