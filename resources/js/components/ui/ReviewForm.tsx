import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, X } from 'lucide-react'
import { api } from '~/lib/api'
import { useCustomerStore } from '~/store/customer'
import { StarRating } from './StarRating'
import { cn } from '~/lib/utils'

interface ReviewFormProps {
  productSlug: string
}

interface EligibilityResult {
  can_review: boolean
  already_reviewed: boolean
  verified_purchase: boolean
}

function submitReview(slug: string, formData: FormData) {
  return api.post(`/products/${slug}/reviews`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

function checkEligibility(slug: string, email: string, phone: string | null) {
  return api
    .post<EligibilityResult>(`/products/${slug}/reviews/check-eligibility`, { email, phone })
    .then((r) => r.data)
}

export function ReviewForm({ productSlug }: ReviewFormProps) {
  const queryClient = useQueryClient()
  const phone = useCustomerStore((s) => s.phone)

  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [rating, setRating] = useState(0)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const eligibilityQuery = useQuery<EligibilityResult>({
    queryKey: ['review-eligibility', productSlug, email],
    queryFn: () => checkEligibility(productSlug, email, phone),
    enabled: emailSubmitted && !!email,
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: (fd: FormData) => submitReview(productSlug, fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productSlug] })
      queryClient.invalidateQueries({ queryKey: ['reviews', productSlug] })
    },
  })

  function handleEmailCheck(e: React.FormEvent) {
    e.preventDefault()
    setEmailSubmitted(true)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPhoto(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setPhotoPreview(url)
    } else {
      setPhotoPreview(null)
    }
  }

  function removePhoto() {
    setPhoto(null)
    setPhotoPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) return

    const fd = new FormData()
    fd.append('customer_name', name)
    fd.append('customer_email', email)
    if (phone) fd.append('customer_phone', phone)
    fd.append('rating', String(rating))
    if (body) fd.append('body', body)
    if (photo) fd.append('photo', photo)

    mutation.mutate(fd)
  }

  // Step 1 — collect email to check eligibility
  if (!emailSubmitted) {
    return (
      <form onSubmit={handleEmailCheck} className="space-y-3">
        <p className="text-sm text-stone-500">
          Introduza o seu e-mail para verificar se pode deixar uma avaliação.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="o-seu@email.com"
            className="flex-1 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-700 transition-colors"
          >
            Continuar
          </button>
        </div>
      </form>
    )
  }

  // Loading eligibility
  if (eligibilityQuery.isLoading) {
    return <div className="h-10 w-40 bg-stone-100 rounded-xl animate-pulse" />
  }

  // Already reviewed
  if (eligibilityQuery.data?.already_reviewed) {
    return (
      <p className="text-sm text-stone-500 italic">
        Já deixou uma avaliação para este produto. Obrigado!
      </p>
    )
  }

  // Success state
  if (mutation.isSuccess) {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-emerald-800 text-sm">
        Avaliação enviada! Será publicada após revisão. Obrigado pelo seu feedback.
      </div>
    )
  }

  const serverErrors: Record<string, string[]> = (mutation.error as any)?.response?.data?.errors ?? {}

  // Step 2 — full review form
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {eligibilityQuery.data?.verified_purchase && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          Compra verificada — a sua avaliação terá o selo de compra verificada.
        </p>
      )}

      {/* Star picker */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-stone-700">Classificação *</label>
        <StarRating value={rating} onChange={setRating} size={28} />
        {rating === 0 && mutation.isError && (
          <p className="text-xs text-red-500">Seleccione uma classificação.</p>
        )}
      </div>

      {/* Name */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-stone-700">Nome *</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="O seu nome"
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
        />
        {serverErrors.customer_name && (
          <p className="text-xs text-red-500">{serverErrors.customer_name[0]}</p>
        )}
      </div>

      {/* Body */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-stone-700">Comentário</label>
        <textarea
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Partilhe a sua experiência com este produto..."
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
        />
      </div>

      {/* Photo upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700">Foto (opcional)</label>
        {photoPreview ? (
          <div className="relative inline-block">
            <img
              src={photoPreview}
              alt="Preview"
              className="w-24 h-24 rounded-xl object-cover border border-stone-200"
            />
            <button
              type="button"
              onClick={removePhoto}
              className="absolute -top-2 -right-2 w-5 h-5 bg-stone-800 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X size={11} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-sm text-stone-500 border border-dashed border-stone-300 rounded-xl px-4 py-3 hover:border-stone-400 hover:text-stone-700 transition-colors"
          >
            <ImagePlus size={16} />
            Adicionar foto
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      {mutation.isError && !Object.keys(serverErrors).length && (
        <p className="text-sm text-red-500">
          {(mutation.error as any)?.response?.data?.message ?? 'Ocorreu um erro. Tente novamente.'}
        </p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending || rating === 0}
        className={cn(
          'w-full py-3 rounded-xl text-sm font-medium transition-colors',
          mutation.isPending || rating === 0
            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
            : 'bg-stone-900 text-white hover:bg-stone-700',
        )}
      >
        {mutation.isPending ? 'A enviar...' : 'Enviar avaliação'}
      </button>
    </form>
  )
}
