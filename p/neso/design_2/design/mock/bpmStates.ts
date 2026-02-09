export interface BpmShowcaseState {
  id: string
  title: string
  stage: string
  slaMinutes: number
  owner: string
  risk: 'low' | 'medium' | 'high'
}

export const bpmShowcaseStates: BpmShowcaseState[] = [
  {
    id: 'WF-4101',
    title: 'Invoice Verification',
    stage: 'Execution',
    slaMinutes: 44,
    owner: 'Ops Team A',
    risk: 'medium'
  },
  {
    id: 'WF-4102',
    title: 'Chargeback Handling',
    stage: 'Validation',
    slaMinutes: 18,
    owner: 'Risk Desk',
    risk: 'high'
  },
  {
    id: 'WF-4103',
    title: 'Contract Renewal',
    stage: 'Backlog',
    slaMinutes: 180,
    owner: 'Legal Ops',
    risk: 'low'
  }
]
