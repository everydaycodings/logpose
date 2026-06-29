"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useDialogs } from "@/store/dialogs"

/**
 * Renders the app's custom confirm + prompt dialogs (no native window.*).
 * Mounted once in the app shell; driven imperatively via lib/dialog.ts.
 */
export function DialogHost() {
  return (
    <>
      <ConfirmDialog />
      <PromptDialog />
    </>
  )
}

function ConfirmDialog() {
  const state = useDialogs((s) => s.confirmState)
  const resolve = useDialogs((s) => s.resolveConfirm)

  return (
    <Dialog open={!!state} onOpenChange={(v) => !v && resolve(false)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {state?.title}
          </DialogTitle>
          {state?.description && (
            <DialogDescription>{state.description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => resolve(false)}>
            {state?.cancelLabel ?? "Cancel"}
          </Button>
          <Button
            variant={state?.destructive ? "destructive" : "default"}
            onClick={() => resolve(true)}
          >
            {state?.confirmLabel ?? "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PromptDialog() {
  const state = useDialogs((s) => s.promptState)
  const resolve = useDialogs((s) => s.resolvePrompt)
  const [value, setValue] = useState("")

  // Seed the input with the default each time a new prompt opens.
  useEffect(() => {
    if (state) setValue(state.defaultValue ?? "")
  }, [state])

  return (
    <Dialog open={!!state} onOpenChange={(v) => !v && resolve(null)}>
      <DialogContent className="sm:max-w-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const trimmed = value.trim()
            if (trimmed) resolve(trimmed)
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {state?.title}
            </DialogTitle>
            {state?.description && (
              <DialogDescription>{state.description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="py-4">
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={state?.placeholder}
              aria-label={state?.label ?? state?.title}
              maxLength={200}
              className="h-11"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => resolve(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!value.trim()}>
              {state?.confirmLabel ?? "OK"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
