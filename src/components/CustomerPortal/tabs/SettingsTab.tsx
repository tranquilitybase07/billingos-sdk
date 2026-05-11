"use client";
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectOption } from '../../ui/select'
import { Skeleton } from '../../ui/skeleton'
import { cn } from '@/utils/cn'
import type { PortalCustomer, PortalAddress } from '../../../client/types'

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
]

interface SettingsTabProps {
  customer: PortalCustomer
  onSave: (data: { name?: string; email?: string; billingAddress?: PortalAddress }) => void
  isSaving?: boolean
  isLoading?: boolean
  className?: string
}

function SettingsTabSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-10 w-28" />
    </div>
  )
}

export function SettingsTab({
  customer,
  onSave,
  isSaving,
  isLoading,
  className,
}: SettingsTabProps) {
  const [values, setValues] = useState({
    name: customer.name || '',
    email: customer.email || '',
    line1: customer.billingAddress?.line1 || '',
    line2: customer.billingAddress?.line2 || '',
    city: customer.billingAddress?.city || '',
    state: customer.billingAddress?.state || '',
    postalCode: customer.billingAddress?.postalCode || '',
    country: customer.billingAddress?.country || 'US',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (isLoading) {
    return <SettingsTabSkeleton />
  }

  const set = (field: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!values.name.trim()) next.name = 'Name is required'
    if (!values.email.trim()) {
      next.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      next.email = 'Invalid email address'
    }
    return next
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const billingAddress: PortalAddress | undefined =
      values.line1 || values.city || values.state || values.postalCode
        ? {
            line1: values.line1,
            line2: values.line2,
            city: values.city,
            state: values.state,
            postalCode: values.postalCode,
            country: values.country,
          }
        : undefined

    onSave({ name: values.name, email: values.email, billingAddress })
  }

  // Track if any field changed from the original customer data
  const isDirty =
    values.name !== (customer.name || '') ||
    values.email !== (customer.email || '') ||
    values.line1 !== (customer.billingAddress?.line1 || '') ||
    values.line2 !== (customer.billingAddress?.line2 || '') ||
    values.city !== (customer.billingAddress?.city || '') ||
    values.state !== (customer.billingAddress?.state || '') ||
    values.postalCode !== (customer.billingAddress?.postalCode || '') ||
    values.country !== (customer.billingAddress?.country || 'US')

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={values.name}
              onChange={set('name')}
              placeholder="Your name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={set('email')}
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="line1">Address Line 1</Label>
            <Input
              id="line1"
              value={values.line1}
              onChange={set('line1')}
              placeholder="123 Main St"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="line2">Address Line 2</Label>
            <Input
              id="line2"
              value={values.line2}
              onChange={set('line2')}
              placeholder="Apt 4B (optional)"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={values.city}
                onChange={set('city')}
                placeholder="San Francisco"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={values.state}
                onChange={set('state')}
                placeholder="CA"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">ZIP/Postal Code</Label>
              <Input
                id="postalCode"
                value={values.postalCode}
                onChange={set('postalCode')}
                placeholder="94102"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select id="country" value={values.country} onChange={set('country')}>
                {COUNTRIES.map((country) => (
                  <SelectOption key={country.code} value={country.code}>
                    {country.name}
                  </SelectOption>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSaving || !isDirty}>
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}
