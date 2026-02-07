import { uiCoreStyles } from './ui-core'

export const darkUiStyles = `
.bg-layer {
  background:
    radial-gradient(circle at 8% -6%, rgba(146, 164, 71, 0.26), transparent 44%),
    radial-gradient(circle at 84% 4%, rgba(61, 88, 80, 0.32), transparent 48%),
    radial-gradient(circle at 50% 120%, rgba(146, 164, 71, 0.14), transparent 52%);
}

.bg-overlay {
  background:
    linear-gradient(160deg, rgba(7, 11, 13, 0.9), rgba(12, 19, 18, 0.8) 52%, rgba(7, 11, 13, 0.9));
}

${uiCoreStyles}
`
