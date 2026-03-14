interface IconProps {
  className?: string;
}

export function OpportunityStackIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="12" rx="3" fill="#BFD2FF" />
      <rect x="6" y="7" width="12" height="2.5" rx="1.25" fill="#7E9FEA" />
      <rect x="6" y="11" width="8" height="2.5" rx="1.25" fill="#E9F0FF" />
      <path d="M7 18h10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2Z" fill="#F1B14A" />
    </svg>
  );
}

export function QualifiedSealIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="11" r="7" fill="#4DBA74" />
      <path d="m8.8 11.2 2.1 2.2 4.4-4.8" stroke="#F7FFF9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 17.2 8.4 20l3-1.4 1.2 1.7 1.1-3.1" fill="#2F8B51" />
    </svg>
  );
}

export function NoGoShieldIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 3.5 18 6v5.4c0 4.1-2.4 7.1-6 8.9-3.6-1.8-6-4.8-6-8.9V6l6-2.5Z" fill="#E1554D" />
      <rect x="10.9" y="7.4" width="2.2" height="6.6" rx="1.1" fill="#FFF4F3" />
      <circle cx="12" cy="16.8" r="1.25" fill="#FFF4F3" />
    </svg>
  );
}

export function PricingHandshakeIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="17.8" cy="7.2" r="3.2" fill="#6D7C9B" />
      <path d="M6.2 10.6 9 8.6l2.6 1.2 1.8-1 4.2 3.8-2 2a2 2 0 0 1-2.8.1l-1.2-1-1 1a2 2 0 0 1-2.8 0l-1.6-1.5Z" fill="#2F3F5C" />
      <path d="M4.2 12.3 7 10l3.1 2.8-2.8 3.4a2 2 0 0 1-3 .1L2.8 15a1.8 1.8 0 0 1 .1-2.7Z" fill="#F0C857" />
      <path d="M16.5 12.2 21 15a1.8 1.8 0 0 1 .1 2.8l-1.3 1.1a2 2 0 0 1-3-.2l-2.6-3.3 2.3-3.2Z" fill="#A9D3F8" />
    </svg>
  );
}

export function DraftClipboardIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="5" y="4.5" width="14" height="16" rx="3" fill="#BCD0F5" />
      <rect x="8" y="3" width="8" height="4" rx="2" fill="#E7EFFD" />
      <rect x="8" y="9" width="8" height="1.8" rx=".9" fill="#6F93D9" />
      <rect x="8" y="12.5" width="6.2" height="1.8" rx=".9" fill="#8EACE7" />
      <path d="m14.8 17.2 1.2 1.2 2.7-3.2" stroke="#4E72C8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SentPlaneIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M3.5 11.3 20 4.5c.9-.4 1.8.5 1.4 1.4l-6.8 16.5c-.4.9-1.7.8-1.9-.2l-1.4-6-6-1.4c-1-.2-1.1-1.5-.2-1.9Z" fill="#3D8BFF" />
      <path d="m9.4 14.6 7.1-7.1" stroke="#EAF3FF" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m12.7 16.2-1.1 3.3" stroke="#0E5FD7" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
