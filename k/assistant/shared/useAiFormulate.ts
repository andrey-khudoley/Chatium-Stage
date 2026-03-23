// @shared
import { ref } from 'vue'

export type AiFormulateResult = {
  summary: string
  stats: {
    projectUpdated: boolean
    createdTasks: string[]
    updatedTasks: string[]
  }
}

export function useAiFormulate() {
  const showFormulateModal = ref(false)
  const formulateResult = ref<AiFormulateResult | null>(null)
  const formulateResultVisible = ref(false)

  function openFormulateModal() {
    showFormulateModal.value = true
  }

  function closeFormulateModal() {
    showFormulateModal.value = false
  }

  function showFormulateResult(result: AiFormulateResult) {
    formulateResult.value = result
    formulateResultVisible.value = true
    setTimeout(() => {
      formulateResultVisible.value = false
    }, 8000)
  }

  function closeFormulateResult() {
    formulateResultVisible.value = false
  }

  return {
    showFormulateModal,
    formulateResult,
    formulateResultVisible,
    openFormulateModal,
    closeFormulateModal,
    showFormulateResult,
    closeFormulateResult
  }
}
