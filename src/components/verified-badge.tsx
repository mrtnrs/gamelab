"use client"

import { FaCheckCircle } from 'react-icons/fa'

interface VerifiedBadgeProps {
  className?: string
}

export default function VerifiedBadge({ className = "" }: VerifiedBadgeProps) {
  return (
    <span 
      className={`inline-flex ${className}`}
      title="Verified Developer"
    >
      <FaCheckCircle className="h-4 w-4 text-blue-500" />
    </span>
  )
}
