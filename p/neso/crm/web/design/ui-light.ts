import { uiCoreStyles } from './ui-core'

export const lightUiStyles = `
.bg-layer {
  background:
    radial-gradient(circle at 12% -8%, rgba(111, 129, 65, 0.26), transparent 46%),
    radial-gradient(circle at 90% 0%, rgba(255, 255, 255, 0.74), transparent 58%),
    radial-gradient(circle at 52% 116%, rgba(181, 198, 123, 0.2), transparent 52%);
}

.bg-overlay {
  background:
    linear-gradient(160deg, rgba(245, 248, 240, 0.88), rgba(233, 239, 224, 0.72) 52%, rgba(255, 255, 255, 0.72));
}

${uiCoreStyles}
`
