import { type ConfirmOptions, type PromptOptions, useDialogs } from "@/store/dialogs"

/** Custom replacement for window.confirm — resolves true/false. */
export function confirm(opts: ConfirmOptions): Promise<boolean> {
  return useDialogs.getState().openConfirm(opts)
}

/** Custom replacement for window.prompt — resolves the string or null. */
export function promptDialog(opts: PromptOptions): Promise<string | null> {
  return useDialogs.getState().openPrompt(opts)
}
