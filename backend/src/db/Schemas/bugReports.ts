import { pgTable, text, timestamp, uuid, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { usersTable } from './users';

// Bug Report Status Enum
export const bugStatusEnum = pgEnum('bug_status', [
  'open',
  'in_progress', 
  'resolved',
  'closed',
  'duplicate',
  'invalid'
]);

// Bug Report Priority Enum
export const bugPriorityEnum = pgEnum('bug_priority', [
  'low',
  'medium',
  'high',
  'critical'
]);

// Bug Report Category Enum
export const bugCategoryEnum = pgEnum('bug_category', [
  'ui',
  'functionality',
  'performance',
  'security',
  'data',
  'other'
]);

// Bug Reports Table
export const bugReportsTable = pgTable('bug_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  
  // Reporter Information
  reporterId: uuid('reporter_id').references(() => usersTable.id).notNull(),
  reporterEmail: text('reporter_email'),
  
  // Bug Details
  category: bugCategoryEnum('category').default('other'),
  priority: bugPriorityEnum('priority').default('medium'),
  status: bugStatusEnum('status').default('open'),
  
  // Browser/System Info (automatically captured)
  browserInfo: text('browser_info'), // JSON string
  userAgent: text('user_agent'),
  currentUrl: text('current_url'),
  screenResolution: text('screen_resolution'),
  
  // Admin/Developer Fields
  assignedTo: uuid('assigned_to').references(() => usersTable.id),
  adminNotes: text('admin_notes'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  
  // Flags
  isDeleted: boolean('is_deleted').default(false)
});