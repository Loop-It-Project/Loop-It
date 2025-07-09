import { 
  pgTable, 
  varchar, 
  boolean, 
  timestamp, 
  text,
  uuid,
  json,
  unique,
  index
} from "drizzle-orm/pg-core";
import { usersTable } from './users';

// Roles and Permissions System
export const rolesTable = pgTable("roles", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 50 }).notNull().unique(),
  description: text(),
  permissions: json(),
  isActive: boolean().default(true).notNull(),
  isDefault: boolean().default(false).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// User-Role Assignments
export const userRolesTable = pgTable("user_roles", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  roleId: uuid().notNull().references(() => rolesTable.id, { onDelete: 'cascade' }),
  assignedBy: uuid().references(() => usersTable.id),
  assignedAt: timestamp().defaultNow().notNull(),
  expiresAt: timestamp(),
  isActive: boolean().default(true).notNull(),
  metadata: json(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  userRoleUnique: unique().on(table.userId, table.roleId),
  userIdx: index("user_roles_user_idx").on(table.userId),
  roleIdx: index("user_roles_role_idx").on(table.roleId),
  assignedAtIdx: index("user_roles_assigned_at_idx").on(table.assignedAt),
}));

// Type exports
export type Role = typeof rolesTable.$inferSelect;
export type NewRole = typeof rolesTable.$inferInsert;
export type UserRole = typeof userRolesTable.$inferSelect;
export type NewUserRole = typeof userRolesTable.$inferInsert;