# Loop-It Database Schema

Eine modulare, skalierbare PostgreSQL-Datenbank für die Loop-It Social Platform.

## 📋 Inhaltsverzeichnis

- [Überblick](#überblick)
- [Architektur](#architektur)
- [Schema-Module](#schema-module)
- [Tabellen-Übersicht](#tabellen-übersicht)
- [Verwendung](#verwendung)
- [Migration](#migration)
- [Entwicklung](#entwicklung)
- [Best Practices](#best-practices)

---

## 🌟 Überblick

Das Loop-It Datenbank-Schema ist **modular aufgebaut** und in logische Gruppen unterteilt. Jedes Modul verwaltet einen spezifischen Bereich der Anwendung und kann unabhängig entwickelt und getestet werden.

### **Warum modular?**
- ✅ **Bessere Wartbarkeit** - Einzelne Module sind übersichtlicher
- ✅ **Team-Entwicklung** - Weniger Merge-Konflikte
- ✅ **Skalierbarkeit** - Einfaches Hinzufügen neuer Features
- ✅ **Testing** - Isolierte Tests pro Modul möglich

---

## 🏗️ Architektur

```
backend/src/db/
├── Schemas/                    # 🗂️ Modulare Schema-Dateien
│   ├── index.ts               # 📤 Central Export Hub
│   ├── users.ts               # 👤 User System & Auth
│   ├── profiles.ts            # 👥 Profile & Social Features
│   ├── roles.ts               # 🔐 Rollen & Permissions
│   ├── media.ts               # 📸 Media & File Uploads
│   ├── posts.ts               # 📝 Posts & Reactions
│   ├── comments.ts            # 💬 Comments & Replies
│   ├── universes.ts           # 🌌 Universe Communities
│   ├── conversations.ts       # 💬 Modern Chat System
│   ├── search.ts              # 🔍 Search & Discovery
│   ├── analytics.ts           # 📊 Analytics & A/B Testing
│   ├── moderation.ts          # 🛡️ Content Moderation
│   └── legacy.ts              # 🏗️ Legacy System Migration
├── connection.ts              # 🔌 Database Connection
├── drizzle.config.ts          # ⚙️ Drizzle Configuration
└── README.md                  # 📖 This file
```

---

## 📦 Schema-Module

### 🔐 **Authentication & Users**

#### **`users.ts`** - Core User System
```typescript
// Tables:
- users                    // Haupt-User-Tabelle
- user_auth_tokens         // JWT & API Tokens
- user_sessions           // Session Management
- user_verifications      // Email/Phone Verification
- refresh_tokens          // Token Refresh System
- user_activities         // Activity Logging
```

#### **`profiles.ts`** - Social Features
```typescript
// Tables:
- profiles                // User Profile Data
- friendships            // Friend Connections
- user_blocks            // Blocked Users
```

#### **`roles.ts`** - Permission System
```typescript
// Tables:
- roles                   // System Roles
- user_roles             // User-Role Assignments
```

### 📝 **Content Management**

#### **`posts.ts`** - Post System
```typescript
// Tables:
- posts                   // Main Posts
- post_reactions         // Likes, Dislikes, etc.
- post_shares            // Share Tracking
```

#### **`comments.ts`** - Comment System
```typescript
// Tables:
- comments               // Post Comments
- comment_reactions      // Comment Likes/Dislikes
```

#### **`media.ts`** - File Management
```typescript
// Tables:
- media                  // Files, Images, Videos
```

### 🌌 **Communities**

#### **`universes.ts`** - Universe System
```typescript
// Tables:
- universes              // Universe Communities
- universe_members       // Membership Management
- universe_join_requests // Join Request System
```

### 💬 **Communication**

#### **`conversations.ts`** - Modern Chat
```typescript
// Tables:
- conversations          // Chat Conversations
- conversation_participants  // Participant Management
- messages              // Chat Messages
```

### 🔍 **Search & Discovery**

#### **`search.ts`** - Search System
```typescript
// Tables:
- search_index          // Search Optimization
- search_history        // Search Analytics
- trending_topics       // Trending Hashtags
- search_suggestions    // Autocomplete Data
```

### 📊 **Analytics & Optimization**

#### **`analytics.ts`** - Data Analytics
```typescript
// Tables:
- user_analytics        // User Behavior Data
- universe_analytics    // Universe Performance
- system_analytics      // System Metrics
- event_tracking        // Event Logging
- search_query_analytics // Search Analysis
- search_metrics        // Search Performance
- search_clicks         // Click Tracking
- ab_tests             // A/B Test Configuration
- ab_test_participants // A/B Test Data
```

### 🛡️ **Moderation & Safety**

#### **`moderation.ts`** - Content Moderation
```typescript
// Tables:
- moderation_reports    // User Reports
- moderation_actions    // Moderator Actions
- user_strikes         // Warning System
- moderation_queue      // Review Queue
- banned_patterns       // Auto-Moderation
```

### 🏗️ **Legacy System**

#### **`legacy.ts`** - Migration Support
```typescript
// Tables:
- chat_rooms            // Old Chat System
- chat_room_members     // Old Members
- chat_messages         // Old Messages
- messages_in_chat_rooms // Legacy Messages
- migration_log         // Migration Tracking
```

---

## 📊 Tabellen-Übersicht

### **Core Tables (Production Ready)**
| Modul | Tabelle | Zweck | Status |
|-------|---------|-------|--------|
| users | `users` | Haupttabelle für User-Daten | ✅ Active |
| users | `refresh_tokens` | JWT Token Management | ✅ Active |
| posts | `posts` | Haupt-Posts der Platform | ✅ Active |
| posts | `post_reactions` | Likes, Dislikes, etc. | ✅ Active |
| universes | `universes` | Community-Bereiche | ✅ Active |
| universes | `universe_members` | Mitgliedschaften | ✅ Active |
| moderation | `moderation_reports` | User-Meldungen | ✅ Active |

### **Advanced Tables (Feature Complete)**
| Modul | Tabelle | Zweck | Status |
|-------|---------|-------|--------|
| analytics | `user_analytics` | User-Verhalten | 🔄 Implementing |
| analytics | `ab_tests` | A/B Testing | 🔄 Implementing |
| search | `search_index` | Suchoptimierung | 🔄 Implementing |
| search | `trending_topics` | Trending Hashtags | 🔄 Implementing |
| conversations | `conversations` | Modern Chat | 🔄 Implementing |

### **Legacy Tables (Migration Only)**
| Modul | Tabelle | Zweck | Status |
|-------|---------|-------|--------|
| legacy | `chat_rooms` | Alte Chat-Räume | 🔄 Migrating |
| legacy | `chat_messages` | Alte Nachrichten | 🔄 Migrating |
| legacy | `migration_log` | Migration-Tracking | 🔄 Migrating |

---

## 🚀 Verwendung

### **1. Import der Schema-Module**

```typescript
// Alle Tables importieren
import { usersTable, postsTable, universesTable } from '../db/Schemas';

// Spezifische Module importieren
import { usersTable } from '../db/Schemas/users';
import { postsTable } from '../db/Schemas/posts';

// Types importieren
import type { User, Post, Universe } from '../db/Schemas';
```

### **2. Service-Layer Integration**

```typescript
// UserService.ts
import { db } from '../db/connection';
import { usersTable, profilesTable } from '../db/Schemas';
import type { User, NewUser } from '../db/Schemas';

export class UserService {
  static async createUser(userData: NewUser): Promise<User> {
    const [user] = await db.insert(usersTable)
      .values(userData)
      .returning();
    return user;
  }

  static async getUserById(id: string): Promise<User | null> {
    const [user] = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    return user || null;
  }
}
```

### **3. Controller Integration**

```typescript
// UserController.ts
import { UserService } from '../services/UserService';
import type { User } from '../db/Schemas';

export class UserController {
  static async getUser(req: Request, res: Response) {
    try {
      const user: User | null = await UserService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

---

## 🔄 Migration

### **Database Setup**

```bash
# 1. Schema generieren
npm run db:generate

# 2. Migration anwenden
npm run db:push

# 3. Seed-Daten (optional)
npm run db:seed
```

### **Legacy System Migration**

```typescript
// Migration von alter zu neuer Chat-Struktur
export async function migrateChatRooms() {
  // 1. Legacy chat_rooms → conversations
  // 2. Legacy chat_room_members → conversation_participants
  // 3. Legacy chat_messages → messages
  // 4. Log migration in migration_log
}
```

---

## 🛠️ Entwicklung

### **Neues Modul hinzufügen**

1. **Neue Schema-Datei erstellen**
```typescript
// features.ts
export const featuresTable = pgTable("features", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 100 }).notNull(),
  isEnabled: boolean().default(false).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export type Feature = typeof featuresTable.$inferSelect;
export type NewFeature = typeof featuresTable.$inferInsert;
```

2. **In index.ts exportieren**
```typescript
// index.ts
export * from './features';

export type {
  Feature,
  NewFeature
} from './features';
```

3. **Migration generieren**
```bash
npm run db:generate
npm run db:push
```

### **Bestehende Tabelle erweitern**

```typescript
// users.ts
export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).notNull().unique(),
  // ✅ Neue Spalte hinzufügen
  twoFactorEnabled: boolean().default(false).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});
```

---

## 🎯 Best Practices

### **1. Naming Conventions**

```typescript
// ✅ Gut: Deskriptive Namen
export const userAuthTokensTable = pgTable("user_auth_tokens", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull(),
  tokenHash: varchar({ length: 255 }).notNull(),
});

// ❌ Schlecht: Abkürzungen
export const uatTable = pgTable("uat", {
  id: uuid().primaryKey().defaultRandom(),
  uid: uuid().notNull(),
  th: varchar({ length: 255 }).notNull(),
});
```

### **2. Index Optimization**

```typescript
// ✅ Wichtige Queries optimieren
export const postsTable = pgTable("posts", {
  id: uuid().primaryKey().defaultRandom(),
  authorId: uuid().notNull(),
  universeId: uuid().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
  // Oft verwendete Queries
  authorIdx: index("posts_author_idx").on(table.authorId),
  universeIdx: index("posts_universe_idx").on(table.universeId),
  createdAtIdx: index("posts_created_at_idx").on(table.createdAt),
  // Composite Index für komplexe Queries
  authorUniverseIdx: index("posts_author_universe_idx").on(table.authorId, table.universeId),
}));
```

### **3. Foreign Key Relationships**

```typescript
// ✅ Explizite Referenzen
export const commentsTable = pgTable("comments", {
  id: uuid().primaryKey().defaultRandom(),
  postId: uuid().notNull().references(() => postsTable.id),
  authorId: uuid().notNull().references(() => usersTable.id),
  content: text().notNull(),
});
```

### **4. Type Safety**

```typescript
// ✅ Immer Types exportieren
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type UserUpdate = Partial<NewUser>;

// ✅ Service-Layer mit Types
export class UserService {
  static async createUser(userData: NewUser): Promise<User> {
    // TypeScript enforced type safety
  }
}
```

### **5. JSON Fields**

```typescript
// ✅ Structured JSON für komplexe Daten
export const userAnalyticsTable = pgTable("user_analytics", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull(),
  // Strukturiertes JSON
  deviceInfo: json().$type<{
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
    screen: { width: number; height: number };
  }>(),
  // Flexibles JSON
  customData: json(),
});
```

---

## 🔧 Drizzle Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/Schemas/index.ts', // ← Unser modulares Schema
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

---

## 📈 Performance Monitoring

### **Query Optimization**

```typescript
// Slow Query Monitoring
export async function getUserPosts(userId: string) {
  const startTime = performance.now();
  
  const posts = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.authorId, userId))
    .orderBy(desc(postsTable.createdAt));
  
  const duration = performance.now() - startTime;
  
  // Log slow queries
  if (duration > 100) {
    console.warn(`Slow query: getUserPosts took ${duration}ms`);
  }
  
  return posts;
}
```

### **Connection Pool Monitoring**

```typescript
// connection.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Pool Configuration
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Monitor pool health
pool.on('connect', () => {
  console.log('Database connected');
});

pool.on('error', (err) => {
  console.error('Database error:', err);
});

export const db = drizzle(pool, { schema });
```

---

## 🚨 Troubleshooting

### **Häufige Probleme & Lösungen**

#### **1. Import/Export Errors**
```bash
# ❌ Problem: Cannot find module './users'
# ✅ Lösung: Prüfe ob alle Module in index.ts exportiert sind

# Check index.ts
export * from './users';    # ← Muss vorhanden sein
export * from './posts';    # ← Muss vorhanden sein
```

#### **2. Migration Errors**
```bash
# ❌ Problem: Table already exists
# ✅ Lösung: Reset Database
npm run db:drop
npm run db:push

# ❌ Problem: Column does not exist
# ✅ Lösung: Generate new migration
npm run db:generate
npm run db:push
```

#### **3. Type Errors**
```typescript
// ❌ Problem: Property 'xyz' does not exist on type 'User'
// ✅ Lösung: Prüfe Type Export

// In users.ts
export type User = typeof usersTable.$inferSelect;  // ← Muss vorhanden sein
export type NewUser = typeof usersTable.$inferInsert;  // ← Muss vorhanden sein

// In index.ts
export type { User, NewUser } from './users';  // ← Muss re-exportiert werden
```

#### **4. Foreign Key Errors**
```typescript
// ❌ Problem: insert or update on table "posts" violates foreign key constraint
// ✅ Lösung: Prüfe Referenzen

// Falsch: Referenced record doesn't exist
await db.insert(postsTable).values({
  authorId: 'non-existing-user-id',  // ← Dieser User existiert nicht
  content: 'Hello World'
});

// Richtig: Stelle sicher dass Referenced Record existiert
const user = await db.select().from(usersTable).where(eq(usersTable.id, userId));
if (!user.length) {
  throw new Error('User not found');
}

await db.insert(postsTable).values({
  authorId: userId,
  content: 'Hello World'
});
```

#### **5. Performance Issues**
```typescript
// ❌ Problem: Slow Queries
// ✅ Lösung: Add Indexes

// Langsame Abfrage
const posts = await db.select()
  .from(postsTable)
  .where(eq(postsTable.authorId, userId))  // ← Needs index
  .orderBy(desc(postsTable.createdAt));    // ← Needs index

// Lösung: Add indexes in schema
export const postsTable = pgTable("posts", {
  // ... columns
}, (table) => ({
  authorIdx: index("posts_author_idx").on(table.authorId),      // ← Add this
  createdAtIdx: index("posts_created_at_idx").on(table.createdAt), // ← Add this
}));
```

### **Debug Tools**

```typescript
// Abfrage Logging
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(pool, { 
  schema,
  logger: {
    logQuery: (query, params) => {
      console.log('🔍 Query:', query);
      console.log('📝 Params:', params);
    }
  }
});

// Performance Monitoring
export async function executeWithTiming<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - start;
    
    console.log(`✅ ${operationName} completed in ${duration.toFixed(2)}ms`);
    
    if (duration > 1000) {
      console.warn(`⚠️  Slow operation detected: ${operationName}`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`❌ ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

// Nutzbarkeit
const users = await executeWithTiming(
  () => db.select().from(usersTable),
  'Get all users'
);
```

### **Health Checks**

```typescript
// Database Health Check
export async function checkDatabaseHealth() {
  try {
    // Basic connectivity
    await db.execute(sql`SELECT 1`);
    
    // Check core tables
    const tables = [
      usersTable,
      postsTable,
      universesTable,
      moderationReportsTable
    ];
    
    for (const table of tables) {
      const [count] = await db.select({ count: count() }).from(table);
      console.log(`✅ ${table[Table.Symbol.Name]}: ${count.count} records`);
    }
    
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return { status: 'unhealthy', error: error.message, timestamp: new Date() };
  }
}
```

---

## 📚 Resources

### **Documentation**
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js PostgreSQL Best Practices](https://node-postgres.com/)

### **Development Tools**
- [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) - Schema Management
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview) - Database GUI
- [pgAdmin](https://www.pgadmin.org/) - PostgreSQL Administration

### **Monitoring & Performance**
- [pg_stat_statements](https://www.postgresql.org/docs/current/pgstatstatements.html) - Query Performance
- [DataDog APM](https://www.datadoghq.com/product/apm/) - Application Performance Monitoring
- [New Relic](https://newrelic.com/) - Full Stack Monitoring

---

## 🎯 Nächste Schritte

### **Kurzfristig (1–2 Wochen)**
- [ ] A/B-Testing-Implementierung abschließen
- [ ] Echtzeit-Chat-System implementieren
- [ ] Suchfunktion hinzufügen
- [ ] Performance-Optimierung

### **Mittelfristig (1–2 Monate)**
- [ ] Erweitertes Analytics-Dashboard
- [ ] Machine-Learning-Integration
- [ ] Optimierung der Mobile-App-API
- [ ] Mehrsprachigkeit

### **Langfristig (3–6 Monate)**
- [ ] Microservices-Architektur
- [ ] Ereignisgesteuerte Architektur
- [ ] Erweiterte Caching-Strategie
- [ ] Elasticsearch-Integration

---

**Loop-It Database Schema v2.0 - Modular, Scalable, Production-Ready** 🚀

*Last updated: $(date)*
*Maintained by: Loop-It Development Team*