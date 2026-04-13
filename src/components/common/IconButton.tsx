import { ReactNode } from 'react';

interface IconButtonProps {
  onClick: () => void;
  children: ReactNode;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
}

const variants = {
  primary: 'bg-blue-500 hover:bg-blue-600 text-white',
  secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200',
  danger: 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400',
};

export function IconButton({
  onClick,
  children,
  title,
  variant = 'secondary',
  disabled = false,
  className = '',
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors duration-150 flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
