'use client';

import { useRef, useState } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

const interestOptions = [
  { value: 'owner', label: 'I have a dog and want care help' },
  { value: 'friend', label: 'I want to hang out with a dog' },
  { value: 'both', label: 'Both' },
  { value: 'other', label: 'Something else' },
];

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem('email') as HTMLInputElement).value.trim(),
      interest: (form.elements.namedItem('interest') as HTMLSelectElement).value,
      neighbourhood: (form.elements.namedItem('neighbourhood') as HTMLInputElement).value.trim(),
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value.trim(),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setStatus('success');
        formRef.current?.reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a3a]/20 focus:border-[#1a3a3a] transition bg-white';

  if (status === 'success') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-[#f4a9a8]/20 flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-8 h-8 text-[#1a3a3a]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display font-semibold text-xl text-[#1a3a3a] mb-2">
          You&apos;re on the list!
        </h3>
        <p className="text-slate-500 text-sm">
          Thanks for reaching out. We&apos;ll be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Your name"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="interest" className="block text-sm font-medium text-slate-700 mb-1.5">
          I&apos;m interested because…
        </label>
        <select
          id="interest"
          name="interest"
          required
          defaultValue=""
          className={`${inputClass} cursor-pointer`}
        >
          <option value="" disabled>
            Select an option
          </option>
          {interestOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="neighbourhood" className="block text-sm font-medium text-slate-700 mb-1.5">
          Where are you based?
        </label>
        <input
          id="neighbourhood"
          name="neighbourhood"
          type="text"
          required
          placeholder="e.g. North London, Finsbury Park, Stoke Newington…"
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-slate-400">
          What neighbourhood? So we know to pair you up with local doggos.
        </p>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1.5">
          Message{' '}
          <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Tell us about your pup, or ask us anything…"
          className={`${inputClass} resize-none`}
        />
      </div>

      {status === 'error' && (
        <p className="text-red-500 text-sm text-center">
          Something went wrong. Please try again in a moment.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-[#1a3a3a] text-white font-medium py-3.5 px-6 rounded-full hover:bg-[#2a4a4a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
      >
        {status === 'loading' ? 'Sending…' : 'Send message'}
      </button>

      <p className="text-center text-xs text-slate-400">
        We&apos;ll never share your details with anyone.
      </p>
    </form>
  );
}
