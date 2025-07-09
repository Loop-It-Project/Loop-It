import { 
  integer, 
  pgTable, 
  varchar, 
  boolean, 
  timestamp,
  uuid,
  json,
  index
} from "drizzle-orm/pg-core";

// Enhanced Media System
export const mediaTable = pgTable("media", {
  id: uuid().primaryKey().defaultRandom(),
  uploaderId: uuid().notNull(),
  
  // File Information
  originalName: varchar({ length: 255 }).notNull(),
  filename: varchar({ length: 255 }).notNull(),
  mimeType: varchar({ length: 100 }).notNull(),
  fileSize: integer().notNull(),
  
  // URLs
  url: varchar({ length: 500 }).notNull(),
  thumbnailUrl: varchar({ length: 500 }),
  previewUrl: varchar({ length: 500 }),
  
  // Media Metadata
  dimensions: json(),
  duration: integer(),
  quality: varchar({ length: 20 }),
  
  // Processing Status
  processingStatus: varchar({ length: 20 }).default('pending').notNull(),
  processingProgress: integer().default(0).notNull(),
  
  // Storage Information
  storageProvider: varchar({ length: 50 }).default('local').notNull(),
  storagePath: varchar({ length: 500 }),
  
  // Usage & Analytics
  downloadCount: integer().default(0).notNull(),
  viewCount: integer().default(0).notNull(),
  
  // Moderation
  isPublic: boolean().default(true).notNull(),
  isNsfw: boolean().default(false).notNull(),
  moderationStatus: varchar({ length: 20 }).default('approved').notNull(),
  
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
  expiresAt: timestamp(),
}, (table) => ({
  uploaderIdx: index("media_uploader_idx").on(table.uploaderId),
  filenameIdx: index("media_filename_idx").on(table.filename),
  mimeTypeIdx: index("media_mime_type_idx").on(table.mimeType),
  createdAtIdx: index("media_created_at_idx").on(table.createdAt),
}));

// Type exports
export type Media = typeof mediaTable.$inferSelect;
export type NewMedia = typeof mediaTable.$inferInsert;