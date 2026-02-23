import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'dogcal — Dog care, from people you trust.',
  description:
    'dogcal helps you schedule and coordinate care for your dog with the trusted friends and family who love them. Join the waitlist.',
  openGraph: {
    title: 'dogcal — Dog care, from people you trust.',
    description:
      'dogcal helps you schedule and coordinate care for your dog with the trusted friends and family who love them.',
    type: 'website',
  },
};

const howItWorks = [
  {
    step: '01',
    title: 'Post a hangout',
    body: 'Owners create time slots when their pup needs care — a walk, a day visit, or an overnight stay.',
  },
  {
    step: '02',
    title: 'Friends claim it',
    body: 'Trusted friends and family browse open slots and sign up for the ones that suit them.',
  },
  {
    step: '03',
    title: 'Everyone stays in sync',
    body: 'Notes, care instructions, and WhatsApp notifications keep everyone organised — no chaotic group chats.',
  },
];

const features = [
  'Invite-only — your trusted network, no strangers',
  'Suggest care times that work for both sides',
  'WhatsApp notifications to keep everyone updated',
  'Leave notes and care instructions for your pup',
  'Join a social to meet new dog-loving friends in your area',
];

export default function AboutPage() {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-white">
      {/* ─── Navigation ─── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <nav className="max-w-6xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/about" className="flex items-center gap-2.5">
            <Image src="/paws-pink.svg" alt="" width={32} height={32} className="w-8 h-8" />
            <span className="font-display font-semibold text-xl tracking-tight text-[#1a3a3a]">
              dogcal
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium px-5 py-2 rounded-full transition-colors text-white bg-[#1a3a3a] hover:bg-[#2a4a4a]"
          >
            Open app
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </nav>
      </header>

      {/* ─── Hero ─── */}
      <section className="pt-20 pb-24 px-6 sm:px-8 md:pt-28 md:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Beta badge */}
          <div
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border"
            style={{
              backgroundColor: 'rgba(244, 169, 168, 0.15)',
              borderColor: 'rgba(244, 169, 168, 0.3)',
              color: '#1a3a3a',
            }}
          >
            <Image src="/paws-pink.svg" alt="" width={14} height={14} className="w-3.5 h-3.5" />
            Currently in private beta
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-semibold tracking-tight leading-[1.08] mb-6 text-[#1a3a3a]">
            dog care, from
            <br />
            <span style={{ color: '#f4a9a8' }}>people you trust.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            dogcal makes it simple to schedule and coordinate care for your pup with the trusted
            friends and family who already love them.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#contact"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-[#1a3a3a] hover:bg-[#2a4a4a] text-white text-base font-medium px-8 py-3.5 rounded-full transition-colors"
            >
              Join the waitlist
            </a>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center border-2 border-[#1a3a3a] text-[#1a3a3a] text-base font-medium px-8 py-3.5 rounded-full hover:bg-[#1a3a3a] hover:text-white transition-colors"
            >
              Open app
            </Link>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-20 md:py-28 px-6 sm:px-8 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-[#f4a9a8]">
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-[#1a3a3a]">
              Simple, from start to finish.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {howItWorks.map(({ step, title, body }) => (
              <div
                key={step}
                className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col gap-4"
              >
                <span className="text-xs font-semibold font-mono tracking-widest text-[#f4a9a8]">
                  {step}
                </span>
                <h3 className="text-lg font-display font-semibold text-[#1a3a3a]">{title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why dogcal ─── */}
      <section className="py-20 md:py-28 px-6 sm:px-8 bg-[#1a3a3a]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-[#f4a9a8]">
              Why dogcal
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-white tracking-tight mb-6">
              Care from people who already love your dog.
            </h2>
            <p className="text-slate-300 text-base leading-relaxed mb-8">
              Unlike generic pet-sitting platforms, dogcal is built around your existing circle of
              trust. No strangers, no uncertainty — just the people who already know and love your
              pup.
            </p>
            <ul className="space-y-3.5">
              {features.map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-200 text-sm">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-[#f4a9a8]/15 text-[#f4a9a8]">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Decorative paw */}
          <div className="hidden md:flex justify-center items-center">
            <Image
              src="/paws-white.svg"
              alt=""
              width={288}
              height={288}
              className="w-72 h-72 opacity-10"
            />
          </div>
        </div>
      </section>

      {/* ─── Contact / Waitlist ─── */}
      <section id="contact" className="py-20 md:py-28 px-6 sm:px-8 bg-white">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-[#f4a9a8]">
              Get in touch
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-4 text-[#1a3a3a]">
              Want early access?
            </h2>
            <p className="text-slate-500 leading-relaxed">
              dogcal is currently in private beta. Fill in the form to join the waitlist or send us
              any questions.
            </p>
          </div>

          <ContactForm />
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-100 py-10 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/paws-pink.svg" alt="" width={24} height={24} className="w-6 h-6" />
            <span className="font-display font-semibold text-[#1a3a3a]">dogcal</span>
          </div>
          <p className="text-slate-400 text-sm text-center">
            © {year} dogcal. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
