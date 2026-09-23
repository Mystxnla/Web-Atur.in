import { Link } from 'react-router-dom';

export default function Logo({ dark = false, compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-2 select-none" aria-label="Beranda Digital Workspace Architect">
      {/* Icon mark */}
      <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M4 13L9 5L14 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.5 10.5H11.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      {!compact && (
        <div className={`text-lg font-extrabold leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
          Atur.in
        </div>
      )}
    </Link>
  );
}
