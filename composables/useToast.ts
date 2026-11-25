export function useToast() {
  const message = useState<string>('shousar_toast_msg', () => '')
  const visible = useState<boolean>('shousar_toast_visible', () => false)
  let timer: ReturnType<typeof setTimeout> | null = null

  function showToast(msg: string) {
    message.value = msg
    visible.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      visible.value = false
    }, 2600)
  }

  return { message, visible, showToast }
}
