import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { getLatestOrderId } from '~/lib/adminApi'

function playChime() {
  try {
    const ctx = new AudioContext()
    const notes = [523.25, 659.25, 783.99] // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = ctx.currentTime + i * 0.13
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
      osc.start(start)
      osc.stop(start + 0.35)
    })
    setTimeout(() => ctx.close(), 1200)
  } catch {
    // AudioContext not available
  }
}

export function OrderNotifier() {
  const lastIdRef = useRef<number | null>(null)
  const [visible, setVisible] = useState(false)
  const audioUnlocked = useRef(false)

  // Unlock AudioContext on first user interaction
  useEffect(() => {
    function unlock() {
      audioUnlocked.current = true
      document.removeEventListener('click', unlock)
      document.removeEventListener('keydown', unlock)
    }
    document.addEventListener('click', unlock)
    document.addEventListener('keydown', unlock)
    return () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [])

  const { data: latestId } = useQuery({
    queryKey: ['admin', 'latest-order-id'],
    queryFn: getLatestOrderId,
    refetchInterval: 15_000,
  })

  useEffect(() => {
    if (latestId === undefined) return

    if (lastIdRef.current === null) {
      // First load — just record baseline, don't notify
      lastIdRef.current = latestId
      return
    }

    if (latestId > lastIdRef.current) {
      lastIdRef.current = latestId
      if (audioUnlocked.current) playChime()
      setVisible(true)
      setTimeout(() => setVisible(false), 5000)
    }
  }, [latestId])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
      <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
        <Bell size={15} className="text-white" />
      </div>
      <div>
        <p className="text-sm font-medium">Nova encomenda recebida!</p>
        <p className="text-xs text-stone-400">Verifique as encomendas</p>
      </div>
    </div>
  )
}
