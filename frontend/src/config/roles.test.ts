import { describe, expect, it } from 'vitest'

import {
  ROLE_DEFINITIONS,
  hasCapability,
  getDefaultHomeForRoles,
  getRoleFromPrefix,
  hasAccessToRoute,
  normalizeRoleCode,
} from './roles'

describe('9-role RBAC', () => {
  it('defines exactly the roles agreed with backend', () => {
    expect(Object.keys(ROLE_DEFINITIONS)).toEqual([
      'ADMIN',
      'DATA_ADMIN',
      'VIEWER',
      'ADMISSIONS_MANAGER',
      'ADMISSIONS_STAFF',
      'ACADEMIC_MANAGER',
      'ACADEMIC_STAFF',
      'HR_MANAGER',
      'HR_STAFF',
    ])
  })

  it('maps each domain workspace to its exact role', () => {
    expect(getRoleFromPrefix('/workspaces/admissions/manager/approvals')).toBe('ADMISSIONS_MANAGER')
    expect(getRoleFromPrefix('/workspaces/academic/staff/records')).toBe('ACADEMIC_STAFF')
    expect(getRoleFromPrefix('/workspaces/hr/manager/analytics')).toBe('HR_MANAGER')
  })

  it('does not allow one domain role to enter another workspace', () => {
    expect(hasAccessToRoute('/workspaces/hr/staff', ['ADMISSIONS_STAFF'])).toBe(false)
    expect(hasAccessToRoute('/workspaces/admissions/staff', ['ADMISSIONS_STAFF'])).toBe(true)
    expect(hasAccessToRoute('/workspaces/hr/staff', ['ADMIN'])).toBe(false)
  })

  it('matches the capability matrix in the latest backend handoff', () => {
    expect(hasCapability(['VIEWER'], 'datasource.read')).toBe(true)
    expect(hasCapability(['VIEWER'], 'datasource.write')).toBe(false)
    expect(hasCapability(['ADMIN'], 'catalog.manage')).toBe(false)
    expect(hasCapability(['DATA_ADMIN'], 'catalog.manage')).toBe(true)
    expect(hasCapability(['ADMISSIONS_MANAGER'], 'datasource.read')).toBe(false)
  })

  it('keeps old backend roles compatible without granting elevated access', () => {
    expect(normalizeRoleCode('SUPER_ADMIN')).toBe('ADMIN')
    expect(normalizeRoleCode('ANALYST')).toBe('VIEWER')
    expect(normalizeRoleCode('MANAGER')).toBe('VIEWER')
  })

  it('prefers a scoped workspace over VIEWER when a user has both roles', () => {
    expect(getDefaultHomeForRoles(['VIEWER', 'ACADEMIC_MANAGER'])).toBe(
      '/workspaces/academic/manager'
    )
  })
})
