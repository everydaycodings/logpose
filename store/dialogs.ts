import { create } from "zustand"

export type ConfirmOptions = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

export type PromptOptions = {
  title: string
  description?: string
  label?: string
  placeholder?: string
  defaultValue?: string
  confirmLabel?: string
}

type ConfirmState = ConfirmOptions & { resolve: (v: boolean) => void }
type PromptState = PromptOptions & { resolve: (v: string | null) => void }

type DialogStore = {
  confirmState: ConfirmState | null
  promptState: PromptState | null
  openConfirm: (opts: ConfirmOptions) => Promise<boolean>
  openPrompt: (opts: PromptOptions) => Promise<string | null>
  resolveConfirm: (v: boolean) => void
  resolvePrompt: (v: string | null) => void
}

export const useDialogs = create<DialogStore>((set, get) => ({
  confirmState: null,
  promptState: null,
  openConfirm: (opts) =>
    new Promise<boolean>((resolve) => set({ confirmState: { ...opts, resolve } })),
  openPrompt: (opts) =>
    new Promise<string | null>((resolve) =>
      set({ promptState: { ...opts, resolve } }),
    ),
  resolveConfirm: (v) => {
    get().confirmState?.resolve(v)
    set({ confirmState: null })
  },
  resolvePrompt: (v) => {
    get().promptState?.resolve(v)
    set({ promptState: null })
  },
}))
