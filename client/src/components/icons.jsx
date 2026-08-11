function Svg({ children, ...props }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconFinance(props) {
  return (
    <Svg {...props}>
      <rect x="2.5" y="6" width="19" height="13" rx="2" />
      <path d="M2.5 10.5h19" />
      <path d="M6 15h4" />
    </Svg>
  );
}

export function IconExchange(props) {
  return (
    <Svg {...props}>
      <path d="M4 8h13l-3.5-3.5" />
      <path d="M20 16H7l3.5 3.5" />
    </Svg>
  );
}

export function IconDelivery(props) {
  return (
    <Svg {...props}>
      <rect x="1.5" y="7" width="12" height="10" rx="1.2" />
      <path d="M13.5 10.5H17l3.5 3.2V17h-2" />
      <circle cx="6" cy="18.5" r="1.6" />
      <circle cx="16.5" cy="18.5" r="1.6" />
    </Svg>
  );
}

export function IconStar(props) {
  return (
    <Svg fill="currentColor" stroke="none" {...props}>
      <path d="M12 2.7l2.7 5.9 6.4.7-4.8 4.4 1.3 6.4L12 16.9l-5.6 3.2 1.3-6.4-4.8-4.4 6.4-.7z" />
    </Svg>
  );
}

export function IconShield(props) {
  return (
    <Svg {...props}>
      <path d="M12 2.5l7.5 3v5.5c0 5-3.2 8.6-7.5 10.5-4.3-1.9-7.5-5.5-7.5-10.5V5.5z" />
      <path d="M8.7 12l2.3 2.3 4.3-4.6" />
    </Svg>
  );
}

export function IconCheckBadge(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.3l2.6 2.6L16 9.4" />
    </Svg>
  );
}

export function IconPlay(props) {
  return (
    <Svg fill="currentColor" stroke="none" {...props}>
      <path d="M8 5.5v13l11-6.5z" />
    </Svg>
  );
}

export function IconMail(props) {
  return (
    <Svg {...props}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="M3.5 6.5l8.5 6 8.5-6" />
    </Svg>
  );
}

export function IconCamera(props) {
  return (
    <Svg {...props}>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.4" />
    </Svg>
  );
}

export function IconClose(props) {
  return (
    <Svg {...props}>
      <path d="M5 5l14 14" />
      <path d="M19 5L5 19" />
    </Svg>
  );
}

export function IconPin(props) {
  return (
    <Svg {...props}>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </Svg>
  );
}

export function IconGlobe(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.8 2.5 4.3 5.7 4.3 9s-1.5 6.5-4.3 9c-2.8-2.5-4.3-5.7-4.3-9S9.2 5.5 12 3z" />
    </Svg>
  );
}

export function IconShip(props) {
  return (
    <Svg {...props}>
      <path d="M3.5 14.5l1.8 5c.3.9 1.1 1.5 2 1.5h9.4c.9 0 1.7-.6 2-1.5l1.8-5" />
      <path d="M5.5 14.5V9h13v5.5" />
      <path d="M9.5 9V4.5h5V9" />
      <path d="M2.5 14.5h19" />
    </Svg>
  );
}

export function IconScale(props) {
  return (
    <Svg {...props}>
      <path d="M12 3v18" />
      <path d="M6 7h12" />
      <path d="M6 7l-3 6a3 3 0 0 0 6 0z" />
      <path d="M18 7l-3 6a3 3 0 0 0 6 0z" />
    </Svg>
  );
}
