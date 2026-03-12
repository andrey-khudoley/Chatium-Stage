// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TPUnitsGoncharovLpLiveahalfLiveahalfRegistrationsJpz = Heap.Table(
  't_p_units_goncharov_lp_liveahalf_liveahalf_registrations_jwp',
  {
    name: Heap.Optional(Heap.String({ customMeta: { title: 'Имя' }, searchable: { langs: ['ru', 'en'] } })),
    email: Heap.Optional(Heap.String({ customMeta: { title: 'Email' }, searchable: { langs: ['ru', 'en'] } })),
    phone: Heap.Optional(Heap.String({ customMeta: { title: 'Телефон' }, searchable: { langs: ['ru', 'en'] } })),
    utmSource: Heap.Optional(Heap.String({ customMeta: { title: 'UTM Source' } })),
    utmMedium: Heap.Optional(Heap.String({ customMeta: { title: 'UTM Medium' } })),
    utmCampaign: Heap.Optional(Heap.String({ customMeta: { title: 'UTM Campaign' } })),
  },
  { customMeta: { title: 'Регистрации на вебинар', description: 'Регистрации на вебинар' } },
)

export default TPUnitsGoncharovLpLiveahalfLiveahalfRegistrationsJpz

export type TPUnitsGoncharovLpLiveahalfLiveahalfRegistrationsJpzRow =
  typeof TPUnitsGoncharovLpLiveahalfLiveahalfRegistrationsJpz.T
export type TPUnitsGoncharovLpLiveahalfLiveahalfRegistrationsJpzRowJson =
  typeof TPUnitsGoncharovLpLiveahalfLiveahalfRegistrationsJpz.JsonT
