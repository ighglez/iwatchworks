type P = { className?: string };
const base = "h-5 w-5";

function Svg({ className, children }: P & { children: React.ReactNode }) {
  return (
    <svg className={className ?? base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const BagIcon = (p: P) => (
  <Svg {...p}><path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8Z" /><path d="M9 11V6.5a3 3 0 0 1 6 0V11" /></Svg>
);
export const UserIcon = (p: P) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></Svg>
);
export const CloseIcon = (p: P) => (
  <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
);
export const MenuIcon = (p: P) => (
  <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>
);
export const ShieldIcon = (p: P) => (
  <Svg {...p}><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></Svg>
);
export const TruckIcon = (p: P) => (
  <Svg {...p}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></Svg>
);
export const CheckIcon = (p: P) => (
  <Svg {...p}><path d="m5 12 4.5 4.5L19 7" /></Svg>
);
export const LockIcon = (p: P) => (
  <Svg {...p}><rect x="5" y="11" width="14" height="10" rx="1" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>
);
export const ReceiptIcon = (p: P) => (
  <Svg {...p}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></Svg>
);
export const ChatIcon = (p: P) => (
  <Svg {...p}><path d="M4 5h16v11H8l-4 4V5Z" /></Svg>
);
export const ReturnIcon = (p: P) => (
  <Svg {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></Svg>
);
export const StarIcon = ({ className, filled = true }: P & { filled?: boolean }) => (
  <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
    <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8L12 3Z" />
  </svg>
);
export const GiftIcon = (p: P) => (
  <Svg {...p}><rect x="3" y="8" width="18" height="4" /><path d="M5 12v9h14v-9M12 8v13M12 8S10.5 3 8 4s0 4 4 4ZM12 8s1.5-5 4-4 0 4-4 4Z" /></Svg>
);
export const MinusIcon = (p: P) => (
  <Svg {...p}><path d="M5 12h14" /></Svg>
);
export const PlusIcon = (p: P) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
);
export const TrashIcon = (p: P) => (
  <Svg {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></Svg>
);
export const BoltIcon = (p: P) => (
  <Svg {...p}><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" /></Svg>
);
export const WhatsappIcon = ({ className }: P) => (
  <svg className={className ?? base} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3Z" />
  </svg>
);
