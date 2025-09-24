/**
 * Shared utility functions
 */

import type { Location } from "../types/domain.types"

/**
 * Calculate distance between two points using Haversine formula
 */
export const calculateDistance = (point1: Location, point2: Location): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat)
  const dLng = toRadians(point2.lng - point1.lng)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180)
}

/**
 * Check if a point is within a radius of another point
 */
export const isWithinRadius = (
  center: Location, 
  point: Location, 
  radiusKm: number
): boolean => {
  return calculateDistance(center, point) <= radiusKm
}

/**
 * Format date consistently across the application
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  return d.toISOString().split('T')[0] || ''
}

/**
 * Format datetime for display
 */
export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Sanitize string for safe usage
 */
export const sanitizeString = (str: string): string => {
  return str.replace(/[<>\"'/&]/g, '').trim()
}

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function
 */
export const throttle = <T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Remove undefined values from object
 */
export const removeUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const result: Partial<T> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (result as any)[key] = value
    }
  }
  return result
}

/**
 * Group array items by a key
 */
export const groupBy = <T, K extends keyof T>(
  array: T[], 
  key: K
): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * Sleep/delay function
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Capitalize first letter of each word
 */
export const titleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  )
}

/**
 * Convert snake_case to camelCase
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
}

/**
 * Convert camelCase to snake_case
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Convert object keys from snake_case to camelCase
 */
export const objectSnakeToCamel = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = objectSnakeToCamel(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map(item => 
        typeof item === 'object' && item !== null 
          ? objectSnakeToCamel(item as Record<string, unknown>)
          : item
      )
    } else {
      result[camelKey] = value
    }
  }
  return result
}