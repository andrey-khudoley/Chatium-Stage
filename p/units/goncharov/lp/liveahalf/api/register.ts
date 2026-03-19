import Registrations from "../tables/registrations.table"
import Settings from "../tables/settings.table"
import { captureCustomerEvent, ContactType } from "@crm/sdk"
import { sendNotificationToAccountOwners } from "@user-notifier/sdk"
import { writeWorkspaceEvent, getWorkspaceEventUrl } from '@start/sdk'
import { request } from "@app/request"

export const apiRegisterRoute = app.post('/register', async (ctx, req) => {
  const { name, email, phone, utmSource, utmMedium, utmCampaign, utmContent, utmTerm, clrtUid } = req.body

  if (!name || name.trim().length < 2) {
    return ctx.resp.json({ success: false, error: 'Имя должно содержать минимум 2 символа' }, 400)
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return ctx.resp.json({ success: false, error: 'Укажите корректный email' }, 400)
  }

  if (phone && phone.length > 0 && !/^\+?[0-9]{10,15}$/.test(phone.replace(/[\s()-]/g, ''))) {
    return ctx.resp.json({ success: false, error: 'Укажите корректный номер телефона' }, 400)
  }

  const registration = await Registrations.create(ctx, {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '',
    utmSource: utmSource || '',
    utmMedium: utmMedium || '',
    utmCampaign: utmCampaign || '',
    utmContent: utmContent || '',
    utmTerm: utmTerm || '',
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
    action_param1_mapstrstr: {
      utm_content: utmContent || '',
      utm_term: utmTerm || '',
    },
  })

  await sendNotificationToAccountOwners(ctx, {
    title: "Новая регистрация на вебинар «Жизнь вполсилы»",
    html: `<h3>Новая регистрация на вебинар</h3><p><b>Имя:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Телефон:</b> ${phone || 'не указан'}</p>`,
    plain: `Новая регистрация: ${name}, ${email}, ${phone || 'не указан'}`,
    md: `**Новая регистрация на вебинар**\nИмя: ${name}\nEmail: ${email}\nТелефон: ${phone || 'не указан'}`,
  })

  const getcourseResult = await sendToGetcourse(ctx, {
    name,
    email,
    phone,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
  })

  if (!getcourseResult.success) {
    await writeWorkspaceEvent(ctx, 'getcourse_integration_error', {
      action_param1: name,
      action_param2: email,
      action_param3: getcourseResult.error,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    })
  }

  return { 
    success: true,
    paymentUrl: getcourseResult.paymentUrl,
  }
})

interface GetcoursePayload {
  name: string
  email: string
  phone?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
}

interface GetcourseResult {
  success: boolean
  error?: string
  paymentUrl?: string
}

async function sendToGetcourse(ctx: app.Ctx, payload: GetcoursePayload): Promise<GetcourseResult> {
  try {
    const accountNameSetting = await Settings.findOneBy(ctx, { key: 'getcourse_account_name' })
    const apiKeySetting = await Settings.findOneBy(ctx, { key: 'getcourse_api_key' })
    const offerCodeSetting = await Settings.findOneBy(ctx, { key: 'getcourse_offer_code' })
    const priceSetting = await Settings.findOneBy(ctx, { key: 'getcourse_price' })
    const utmSourceFieldSetting = await Settings.findOneBy(ctx, { key: 'getcourse_utm_source_field' })
    const utmMediumFieldSetting = await Settings.findOneBy(ctx, { key: 'getcourse_utm_medium_field' })
    const utmCampaignFieldSetting = await Settings.findOneBy(ctx, { key: 'getcourse_utm_campaign_field' })
    const utmContentFieldSetting = await Settings.findOneBy(ctx, { key: 'getcourse_utm_content_field' })
    const utmTermFieldSetting = await Settings.findOneBy(ctx, { key: 'getcourse_utm_term_field' })

    if (!accountNameSetting?.value) {
      return { success: false, error: 'GetCourse account name not configured' }
    }

    if (!apiKeySetting?.value || !offerCodeSetting?.value) {
      return { success: false, error: 'GetCourse settings not configured' }
    }

    const accountName = accountNameSetting.value
    const apiKey = apiKeySetting.value
    const offerCode = offerCodeSetting.value
    const price = parseFloat(priceSetting?.value || '0')

    const [firstName, ...lastNameParts] = payload.name.split(' ')
    const lastName = lastNameParts.join(' ') || ''

    const paramsObj: any = {
      user: {
        email: payload.email,
        first_name: firstName,
        phone: payload.phone || undefined,
      },
      system: {
        refresh_if_exists: 1,
        multiple_offers: 1,
        return_payment_link: 1,
      },
      session: {} as any,
      deal: {
        offer_code: offerCode,
      } as any,
    }

    if (lastName) {
      paramsObj.user.last_name = lastName
    }

    if (price > 0) {
      paramsObj.deal.deal_cost = price
    }

    if (payload.utmSource) paramsObj.session.utm_source = payload.utmSource
    if (payload.utmMedium) paramsObj.session.utm_medium = payload.utmMedium
    if (payload.utmCampaign) paramsObj.session.utm_campaign = payload.utmCampaign
    if (payload.utmContent) paramsObj.session.utm_content = payload.utmContent
    if (payload.utmTerm) paramsObj.session.utm_term = payload.utmTerm

    const addfields: Record<string, string> = {}
    if (utmSourceFieldSetting?.value && payload.utmSource) {
      addfields[utmSourceFieldSetting.value] = payload.utmSource
    }
    if (utmMediumFieldSetting?.value && payload.utmMedium) {
      addfields[utmMediumFieldSetting.value] = payload.utmMedium
    }
    if (utmCampaignFieldSetting?.value && payload.utmCampaign) {
      addfields[utmCampaignFieldSetting.value] = payload.utmCampaign
    }
    if (utmContentFieldSetting?.value && payload.utmContent) {
      addfields[utmContentFieldSetting.value] = payload.utmContent
    }
    if (utmTermFieldSetting?.value && payload.utmTerm) {
      addfields[utmTermFieldSetting.value] = payload.utmTerm
    }
    if (Object.keys(addfields).length > 0) {
      paramsObj.deal.addfields = addfields
    }

    const paramsJson = JSON.stringify(paramsObj)
    const paramsBase64 = btoa(unescape(encodeURIComponent(paramsJson)))

    const response = await request({
      method: 'post',
      url: `https://${accountName}.getcourse.ru/pl/api/deals`,
      form: {
        action: 'add',
        key: apiKey,
        params: paramsBase64,
      },
      throwHttpErrors: false,
    })

    const body = response.body as any

    await writeWorkspaceEvent(ctx, 'getcourse_api_debug', {
      action_param1: payload.email,
      action_param2: offerCode,
      action_param1_int: response.statusCode,
      action_param1_mapstrstr: {
        request_params: paramsJson,
        response_body: JSON.stringify(body),
      },
    })

    if (body && String(body.success) === 'true') {
      let paymentUrl: string | undefined
      if (price > 0 && body.result && body.result.payment_link) {
        paymentUrl = body.result.payment_link
      }

      await writeWorkspaceEvent(ctx, 'getcourse_integration_success', {
        action_param1: payload.email,
        action_param2: offerCode,
        action_param1_float: price,
        action_param1_mapstrstr: {
          has_payment_url: paymentUrl ? 'true' : 'false',
          payment_url: paymentUrl || '',
        },
      })

      return { success: true, paymentUrl }
    } else {
      const errorMessage = body?.error_message || body?.error || JSON.stringify(body)
      await writeWorkspaceEvent(ctx, 'getcourse_api_error', {
        action_param1: payload.email,
        action_param2: offerCode,
        action_param3: errorMessage,
        action_param1_int: response.statusCode,
        action_param1_mapstrstr: {
          response_body: JSON.stringify(body),
          request_params: paramsJson,
        },
      })
      return { success: false, error: errorMessage }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await writeWorkspaceEvent(ctx, 'getcourse_integration_exception', {
      action_param1: payload.email,
      action_param3: errorMessage,
    })
    return { success: false, error: errorMessage }
  }
}

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