export type RoleCode =
  'SUPER_ADMIN' | 'DATA_ENGINEER' | 'DATA_GOVERNANCE' | 'DATA_ANALYST' | 'ACADEMIC_ADMIN' | 'USER'

export interface AuthUser {
  id?: string | number
  username: string
  email?: string
  fullName?: string
  roles: RoleCode[]
}

export interface RoleDefinition {
  code: RoleCode
  name: string
  homePath: string
  description: string
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive'
}

export interface MenuItem {
  title: string
  href: string
  iconName: string
  badge?: string
  description?: string
}

export interface MenuGroup {
  groupTitle?: string
  items: MenuItem[]
}
