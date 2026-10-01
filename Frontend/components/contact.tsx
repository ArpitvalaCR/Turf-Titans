'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Check } from 'lucide-react'
import { submitRegistration, mapContactSportToBackend } from '@/lib/services'

const details = [
  { icon: Mail, label: 'Email', value: 'play@turftitans.com' },
  { icon: Phone, label: 'Phone', value: '+1 (555) 040-2026' },
  { icon: MapPin, label: 'HQ', value: 'Metro Arena, Downtown' },
]

export function Contact() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const sport = String(formData.get('sport') || '')

    try {
      await submitRegistration({
        captainName: String(formData.get('name') || ''),
        teamName: String(formData.get('team') || ''),
        captainEmail: String(formData.get('email') || ''),
        sport: mapContactSportToBackend(sport),
        message: String(formData.get('message') || ''),
      })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact" className="scroll-mt-20 border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 md:grid-cols-2 md:px-6">
        <div>
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Get in the game
          </span>
          <h2 className="mt-2 font-display text-4xl font-bold uppercase tracking-tight text-balance md:text-5xl">
            Register your team
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
            Drop your details and our tournament crew will reach out with open slots, fixtures,
            and everything you need to compete.
          </p>

          <ul className="mt-10 space-y-5">
            {details.map((d) => (
              <li key={d.label} className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <d.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{d.label}</p>
                  <p className="font-medium text-foreground">{d.value}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-background p-6 sm:p-8">
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-7 w-7" strokeWidth={3} />
              </span>
              <h3 className="mt-5 font-display text-2xl font-bold uppercase tracking-wide">
                You&apos;re on the list
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Thanks for reaching out — we&apos;ll be in touch with your team&apos;s next steps soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Your name" id="name" name="name" placeholder="Alex Striker" required />
                <Field label="Team name" id="team" name="team" placeholder="Downtown FC" required />
              </div>
              <Field
                label="Email"
                id="email"
                name="email"
                type="email"
                placeholder="you@team.com"
                required
              />
              <div>
                <label htmlFor="sport" className="mb-2 block text-sm font-medium text-foreground">
                  Sport
                </label>
                <select
                  id="sport"
                  name="sport"
                  className="w-full rounded-md border border-input bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
                >
                  <option>Football 7s</option>
                  <option>Football 11s</option>
                  <option>Futsal</option>
                  <option>Cricket</option>
                  <option>Badminton</option>
                  <option>Basketball</option>
                  <option>Volleyball</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder="Tell us about your squad..."
                  className="w-full resize-none rounded-md border border-input bg-secondary px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40"
                />
              </div>
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

function Field({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  required = false,
}: {
  label: string
  id: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md border border-input bg-secondary px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40"
      />
    </div>
  )
}
