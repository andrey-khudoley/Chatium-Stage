// @shared

export interface DesignCatalogModule {
  slug: string
  title: string
  group: string
  description: string
}

export const DESIGN_CATALOG_MODULES: DesignCatalogModule[] = [
  { slug: 'dashboard', title: 'Dashboard', group: 'Base CRM', description: 'Design demo blueprint for Dashboard workflows and daily operations.' },
  { slug: 'leads-deals', title: 'Leads / Deals', group: 'Base CRM', description: 'Design demo blueprint for Leads / Deals workflows and daily operations.' },
  { slug: 'contacts', title: 'Contacts', group: 'Base CRM', description: 'Design demo blueprint for Contacts workflows and daily operations.' },
  { slug: 'companies', title: 'Companies', group: 'Base CRM', description: 'Design demo blueprint for Companies workflows and daily operations.' },
  { slug: 'tasks', title: 'Tasks', group: 'Base CRM', description: 'Design demo blueprint for Tasks workflows and daily operations.' },
  { slug: 'notifications', title: 'Notifications', group: 'Base CRM', description: 'Design demo blueprint for Notifications workflows and daily operations.' },
  { slug: 'files', title: 'Files', group: 'Base CRM', description: 'Design demo blueprint for Files workflows and daily operations.' },
  { slug: 'activity-log-audit', title: 'Activity Log / Audit', group: 'Base CRM', description: 'Design demo blueprint for Activity Log / Audit workflows and daily operations.' },
  { slug: 'kanban', title: 'Kanban', group: 'Process Management', description: 'Design demo blueprint for Kanban workflows and daily operations.' },
  { slug: 'calendar', title: 'Calendar', group: 'Process Management', description: 'Design demo blueprint for Calendar workflows and daily operations.' },
  { slug: 'timeline', title: 'Timeline', group: 'Process Management', description: 'Design demo blueprint for Timeline workflows and daily operations.' },
  { slug: 'pipeline', title: 'Pipeline', group: 'Process Management', description: 'Design demo blueprint for Pipeline workflows and daily operations.' },
  { slug: 'project-progress', title: 'Project Progress', group: 'Process Management', description: 'Design demo blueprint for Project Progress workflows and daily operations.' },
  { slug: 'milestones', title: 'Milestones', group: 'Process Management', description: 'Design demo blueprint for Milestones workflows and daily operations.' },
  { slug: 'roadmap', title: 'Roadmap', group: 'Process Management', description: 'Design demo blueprint for Roadmap workflows and daily operations.' },
  { slug: 'gantt', title: 'Gantt (Design)', group: 'Process Management', description: 'Design demo blueprint for Gantt (Design) workflows and daily operations.' },
  { slug: 'internal-documentation', title: 'Internal Documentation', group: 'Knowledge Management', description: 'Design demo blueprint for Internal Documentation workflows and daily operations.' },
  { slug: 'knowledge-base', title: 'Knowledge Base', group: 'Knowledge Management', description: 'Design demo blueprint for Knowledge Base workflows and daily operations.' },
  { slug: 'wiki', title: 'Wiki', group: 'Knowledge Management', description: 'Design demo blueprint for Wiki workflows and daily operations.' },
  { slug: 'notes', title: 'Notes', group: 'Knowledge Management', description: 'Design demo blueprint for Notes workflows and daily operations.' },
  { slug: 'templates-library', title: 'Templates Library', group: 'Knowledge Management', description: 'Design demo blueprint for Templates Library workflows and daily operations.' },
  { slug: 'courses', title: 'Courses', group: 'Learning', description: 'Design demo blueprint for Courses workflows and daily operations.' },
  { slug: 'lessons', title: 'Lessons', group: 'Learning', description: 'Design demo blueprint for Lessons workflows and daily operations.' },
  { slug: 'progress-tracking', title: 'Progress Tracking', group: 'Learning', description: 'Design demo blueprint for Progress Tracking workflows and daily operations.' },
  { slug: 'certificates', title: 'Certificates (UI)', group: 'Learning', description: 'Design demo blueprint for Certificates (UI) workflows and daily operations.' },
  { slug: 'reports', title: 'Reports', group: 'Analytics', description: 'Design demo blueprint for Reports workflows and daily operations.' },
  { slug: 'custom-dashboards', title: 'Custom Dashboards', group: 'Analytics', description: 'Design demo blueprint for Custom Dashboards workflows and daily operations.' },
  { slug: 'funnels', title: 'Funnels', group: 'Analytics', description: 'Design demo blueprint for Funnels workflows and daily operations.' },
  { slug: 'cohorts', title: 'Cohorts', group: 'Analytics', description: 'Design demo blueprint for Cohorts workflows and daily operations.' },
  { slug: 'users', title: 'Users', group: 'Administration', description: 'Design demo blueprint for Users workflows and daily operations.' },
  { slug: 'roles-permissions', title: 'Roles & Permissions', group: 'Administration', description: 'Design demo blueprint for Roles & Permissions workflows and daily operations.' },
  { slug: 'feature-toggles', title: 'Feature Toggles', group: 'Administration', description: 'Design demo blueprint for Feature Toggles workflows and daily operations.' },
  { slug: 'integrations', title: 'Integrations', group: 'Administration', description: 'Design demo blueprint for Integrations workflows and daily operations.' },
  { slug: 'system-settings', title: 'System Settings', group: 'Administration', description: 'Design demo blueprint for System Settings workflows and daily operations.' },
  { slug: 'theme-styling-settings', title: 'Theme & Styling Settings', group: 'Administration', description: 'Design demo blueprint for Theme & Styling Settings workflows and daily operations.' },
  { slug: 'chat-comments', title: 'Chat / Comments', group: 'Additional UX', description: 'Design demo blueprint for Chat / Comments workflows and daily operations.' },
  { slug: 'mentions', title: 'Mentions', group: 'Additional UX', description: 'Design demo blueprint for Mentions workflows and daily operations.' },
  { slug: 'tags-labels', title: 'Tags & Labels', group: 'Additional UX', description: 'Design demo blueprint for Tags & Labels workflows and daily operations.' },
  { slug: 'global-search', title: 'Global Search', group: 'Additional UX', description: 'Design demo blueprint for Global Search workflows and daily operations.' },
  { slug: 'command-palette', title: 'Command Palette', group: 'Additional UX', description: 'Design demo blueprint for Command Palette workflows and daily operations.' },
  { slug: 'help-onboarding', title: 'Help / Onboarding', group: 'Additional UX', description: 'Design demo blueprint for Help / Onboarding workflows and daily operations.' },
  { slug: 'system-states', title: 'Empty / Error / Maintenance Screens', group: 'Additional UX', description: 'Design demo blueprint for Empty / Error / Maintenance Screens workflows and daily operations.' },
]

const MODULE_MAP = DESIGN_CATALOG_MODULES.reduce((acc, module) => {
  acc[module.slug] = module
  return acc
}, {} as Record<string, DesignCatalogModule>)

export function getDesignCatalogModule(slug: string): DesignCatalogModule | undefined {
  return MODULE_MAP[slug]
}

export function getDesignCatalogModuleOrThrow(slug: string): DesignCatalogModule {
  const module = MODULE_MAP[slug]
  if (!module) throw new Error(`Unknown design module slug: ${slug}`)
  return module
}

export function getDesignCatalogGroups(): Array<{ group: string; modules: DesignCatalogModule[] }> {
  const grouped = new Map<string, DesignCatalogModule[]>()
  for (const module of DESIGN_CATALOG_MODULES) {
    const current = grouped.get(module.group) || []
    current.push(module)
    grouped.set(module.group, current)
  }

  return Array.from(grouped.entries()).map(([group, modules]) => ({ group, modules }))
}

export function getDesignCatalogNeighbors(slug: string): { previous?: DesignCatalogModule; next?: DesignCatalogModule } {
  const index = DESIGN_CATALOG_MODULES.findIndex((module) => module.slug === slug)
  if (index === -1) return {}

  return {
    previous: index > 0 ? DESIGN_CATALOG_MODULES[index - 1] : undefined,
    next: index < DESIGN_CATALOG_MODULES.length - 1 ? DESIGN_CATALOG_MODULES[index + 1] : undefined
  }
}
