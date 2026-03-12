import Registrations from "../tables/registrations.table"
import { captureCustomerEvent, ContactType } from "@crm/sdk"
import { sendNotificationToAccountOwners } from "@user-notifier/sdk"
import { writeWorkspaceEvent, getWorkspaceEventUrl } from '@start/sdk'

export const apiRegisterRoute = app.post('/register', async (ctx, req) => {
  const { name, email, phone, utmSource, utmMedium, utmCampaign, clrtUid } = req.body

  const registration = await Registrations.create(ctx, {
    name,
    email,
    phone,
    utmSource: utmSource || '',
    utmMedium: utmMedium || '',
    utmCampaign: utmCampaign || '',
  })

  await captureCustomerEvent(ctx, {
    event: "webinar_registration",
    customer: {
      displayName: name,
    },
    contacts: [
      ...(email ? [{ type: ContactType.Email, value: email }] : []),
      ...(phone ? [{ type: ContactType.Phone, value: phone }] : []),
    ],
    linkRecords: [registration],
  })

  await writeWorkspaceEvent(ctx, 'webinar_registration', {
    uid: clrtUid || undefined,
    customer_contacts: [
      ...(email ? [{ type: 'email' as const, value: email }] : []),
      ...(phone ? [{ type: 'phone' as const, value: phone }] : []),
    ],
    action_param1: name,
    action_param2: email,
    action_param3: phone,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
  })

  await sendNotificationToAccountOwners(ctx, {
    title: "Новая регистрация на вебинар «Жизнь вполсилы»",
    html: `<h3>Новая регистрация на вебинар</h3><p><b>Имя:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Телефон:</b> ${phone || 'не указан'}</p>`,
    plain: `Новая регистрация: ${name}, ${email}, ${phone || 'не указан'}`,
    md: `**Новая регистрация на вебинар**\nИмя: ${name}\nEmail: ${email}\nТелефон: ${phone || 'не указан'}`,
  })

  return { success: true }
})

app.accountHook('@start/account-events', async (ctx) => {
  return [
    {
      name: 'Регистрация на вебинар «Жизнь вполсилы»',
      description: 'Посетитель зарегистрировался на вебинар через лендинг',
      url: await getWorkspaceEventUrl(ctx, 'webinar_registration'),
      icon: '📅',
      category: 'bookings',
      payloadMapping: {
        name: { title: 'Имя', fieldName: 'action_param1', type: 'string' },
        email: { title: 'Email', fieldName: 'action_param2', type: 'string' },
        phone: { title: 'Телефон', fieldName: 'action_param3', type: 'string' },
      },
    },
  ]
})