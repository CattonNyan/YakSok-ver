import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InteractionClient from '@/components/medicine/InteractionClient'

export default async function InteractionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: schedules } = await supabase
    .from('schedules')
    .select(`medication_id, medication:medications(id, item_name, entp_name)`)
    .eq('user_id', user.id)
    .eq('is_active', true)

  const medIds = schedules?.map(s => s.medication_id) ?? []

  // 2개 이상일 때 상호작용 조회
  let interactions: any[] = []
  if (medIds.length >= 2) {
    const { data } = await supabase
      .from('drug_interactions')
      .select(`*, medication_a:medications!medication_a_id(item_name), medication_b:medications!medication_b_id(item_name)`)
      .or(
        medIds.flatMap((a, i) =>
          medIds.slice(i + 1).map(b =>
            `and(medication_a_id.eq.${a},medication_b_id.eq.${b}),and(medication_a_id.eq.${b},medication_b_id.eq.${a})`
          )
        ).join(',')
      )
    interactions = data ?? []
  }

  return (
    <InteractionClient
      medications={schedules?.map(s => s.medication as any) ?? []}
      interactions={interactions}
    />
  )
}
