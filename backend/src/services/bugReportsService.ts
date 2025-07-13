import { db } from '../db/connection';
import { bugReportsTable, usersTable, profilesTable } from '../db/Schemas';
import { eq, and, desc, sql, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

// Aliases für bessere Lesbarkeit
const reporter = alias(usersTable, 'reporter');
const reporterProfile = alias(profilesTable, 'reporterProfile');
const assignee = alias(usersTable, 'assignee');
const assigneeProfile = alias(profilesTable, 'assigneeProfile');

export class BugReportService {

  // ✅ Create Bug Report
  static async createBugReport(data: {
    title: string;
    description: string;
    reporterId: string;
    reporterEmail?: string;
    category?: string;
    priority?: string;
    browserInfo?: string;
    userAgent?: string;
    currentUrl?: string;
    screenResolution?: string;
  }) {
    try {
      console.log('📝 Creating bug report:', data.title);

      const bugReport = await db
        .insert(bugReportsTable)
        .values({
          title: data.title,
          description: data.description,
          reporterId: data.reporterId,
          reporterEmail: data.reporterEmail,
          category: data.category as any || 'other',
          priority: data.priority as any || 'medium',
          browserInfo: data.browserInfo,
          userAgent: data.userAgent,
          currentUrl: data.currentUrl,
          screenResolution: data.screenResolution,
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      console.log('✅ Bug report created successfully:', bugReport[0].id);
      return { success: true, data: bugReport[0] };

    } catch (error) {
      console.error('❌ Error creating bug report:', error);
      return { success: false, error: 'Failed to create bug report' };
    }
  }

  // ✅ Get All Bug Reports (Admin)
  static async getAllBugReports(filters: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
    search?: string;
  } = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        category,
        assignedTo,
        search
      } = filters;

      const offset = (page - 1) * limit;

      // Build where conditions
      let whereConditions = [eq(bugReportsTable.isDeleted, false)];

      if (status) {
        whereConditions.push(eq(bugReportsTable.status, status as any));
      }

      if (priority) {
        whereConditions.push(eq(bugReportsTable.priority, priority as any));
      }

      if (category) {
        whereConditions.push(eq(bugReportsTable.category, category as any));
      }

      if (assignedTo) {
        whereConditions.push(eq(bugReportsTable.assignedTo, assignedTo));
      }

      if (search) {
        whereConditions.push(
          or(
            sql`${bugReportsTable.title} ILIKE ${`%${search}%`}`,
            sql`${bugReportsTable.description} ILIKE ${`%${search}%`}`
          )
        );
      }

      // Get bug reports with reporter and assignee info
      const bugReports = await db
        .select({
          id: bugReportsTable.id,
          title: bugReportsTable.title,
          description: bugReportsTable.description,
          category: bugReportsTable.category,
          priority: bugReportsTable.priority,
          status: bugReportsTable.status,
          browserInfo: bugReportsTable.browserInfo,
          userAgent: bugReportsTable.userAgent,
          currentUrl: bugReportsTable.currentUrl,
          screenResolution: bugReportsTable.screenResolution,
          adminNotes: bugReportsTable.adminNotes,
          createdAt: bugReportsTable.createdAt,
          updatedAt: bugReportsTable.updatedAt,
          resolvedAt: bugReportsTable.resolvedAt,
          // Reporter info
          reporter: {
            id: reporter.id,
            username: reporter.username,
            email: reporter.email,
            displayName: reporterProfile.displayName
          },
          // Assignee info
          assignee: {
            id: assignee.id,
            username: assignee.username,
            email: assignee.email,
            displayName: assigneeProfile.displayName
          }
        })
        .from(bugReportsTable)
        .leftJoin(reporter, eq(bugReportsTable.reporterId, reporter.id))
        .leftJoin(reporterProfile, eq(reporter.id, reporterProfile.userId))
        .leftJoin(assignee, eq(bugReportsTable.assignedTo, assignee.id))
        .leftJoin(assigneeProfile, eq(assignee.id, assigneeProfile.userId))
        .where(and(...whereConditions))
        .orderBy(desc(bugReportsTable.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(bugReportsTable)
        .where(and(...whereConditions));

      const totalCount = totalCountResult[0].count;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          bugReports,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasMore: page < totalPages
          }
        }
      };

    } catch (error) {
      console.error('❌ Error getting bug reports:', error);
      return { success: false, error: 'Failed to get bug reports' };
    }
  }

  // ✅ Get Bug Report by ID
  static async getBugReportById(id: string) {
    try {
      const bugReport = await db
        .select({
          id: bugReportsTable.id,
          title: bugReportsTable.title,
          description: bugReportsTable.description,
          category: bugReportsTable.category,
          priority: bugReportsTable.priority,
          status: bugReportsTable.status,
          browserInfo: bugReportsTable.browserInfo,
          userAgent: bugReportsTable.userAgent,
          currentUrl: bugReportsTable.currentUrl,
          screenResolution: bugReportsTable.screenResolution,
          adminNotes: bugReportsTable.adminNotes,
          createdAt: bugReportsTable.createdAt,
          updatedAt: bugReportsTable.updatedAt,
          resolvedAt: bugReportsTable.resolvedAt,
          // Reporter info
          reporter: {
            id: reporter.id,
            username: reporter.username,
            email: reporter.email,
            displayName: reporterProfile.displayName
          },
          // Assignee info
          assignee: {
            id: assignee.id,
            username: assignee.username,
            email: assignee.email,
            displayName: assigneeProfile.displayName
          }
        })
        .from(bugReportsTable)
        .leftJoin(reporter, eq(bugReportsTable.reporterId, reporter.id))
        .leftJoin(reporterProfile, eq(reporter.id, reporterProfile.userId))
        .leftJoin(assignee, eq(bugReportsTable.assignedTo, assignee.id))
        .leftJoin(assigneeProfile, eq(assignee.id, assigneeProfile.userId))
        .where(
          and(
            eq(bugReportsTable.id, id),
            eq(bugReportsTable.isDeleted, false)
          )
        )
        .limit(1);

      if (bugReport.length === 0) {
        return { success: false, error: 'Bug report not found' };
      }

      return { success: true, data: bugReport[0] };

    } catch (error) {
      console.error('❌ Error getting bug report:', error);
      return { success: false, error: 'Failed to get bug report' };
    }
  }

  // ✅ Update Bug Report Status
  static async updateBugReportStatus(id: string, updates: {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
    adminNotes?: string;
  }) {
    try {
      console.log('📝 Updating bug report status:', id, updates);

      const updateData: any = {
        updatedAt: new Date()
      };

      if (updates.status) {
        updateData.status = updates.status;
        if (updates.status === 'resolved' || updates.status === 'closed') {
          updateData.resolvedAt = new Date();
        }
      }

      if (updates.priority) updateData.priority = updates.priority;
      if (updates.category) updateData.category = updates.category;
      if (updates.assignedTo) updateData.assignedTo = updates.assignedTo;
      if (updates.adminNotes !== undefined) updateData.adminNotes = updates.adminNotes;

      const updatedBugReport = await db
        .update(bugReportsTable)
        .set(updateData)
        .where(eq(bugReportsTable.id, id))
        .returning();

      if (updatedBugReport.length === 0) {
        return { success: false, error: 'Bug report not found' };
      }

      console.log('✅ Bug report updated successfully:', id);
      return { success: true, data: updatedBugReport[0] };

    } catch (error) {
      console.error('❌ Error updating bug report:', error);
      return { success: false, error: 'Failed to update bug report' };
    }
  }

  // ✅ Delete Bug Report (Soft Delete)
  static async deleteBugReport(id: string) {
    try {
      console.log('🗑️ Deleting bug report:', id);

      const deletedBugReport = await db
        .update(bugReportsTable)
        .set({
          isDeleted: true,
          updatedAt: new Date()
        })
        .where(eq(bugReportsTable.id, id))
        .returning();

      if (deletedBugReport.length === 0) {
        return { success: false, error: 'Bug report not found' };
      }

      console.log('✅ Bug report deleted successfully:', id);
      return { success: true, data: deletedBugReport[0] };

    } catch (error) {
      console.error('❌ Error deleting bug report:', error);
      return { success: false, error: 'Failed to delete bug report' };
    }
  }

  // ✅ Get Bug Report Statistics
  static async getBugReportStats() {
    try {
      const stats = await db
        .select({
          status: bugReportsTable.status,
          priority: bugReportsTable.priority,
          category: bugReportsTable.category,
          count: sql<number>`count(*)`
        })
        .from(bugReportsTable)
        .where(eq(bugReportsTable.isDeleted, false))
        .groupBy(bugReportsTable.status, bugReportsTable.priority, bugReportsTable.category);

      // Process stats into organized structure
      const processedStats = {
        total: 0,
        byStatus: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        byCategory: {} as Record<string, number>
      };

      stats.forEach(stat => {
        processedStats.total += stat.count;
        processedStats.byStatus[stat.status] = (processedStats.byStatus[stat.status] || 0) + stat.count;
        processedStats.byPriority[stat.priority] = (processedStats.byPriority[stat.priority] || 0) + stat.count;
        processedStats.byCategory[stat.category] = (processedStats.byCategory[stat.category] || 0) + stat.count;
      });

      return { success: true, data: processedStats };

    } catch (error) {
      console.error('❌ Error getting bug report stats:', error);
      return { success: false, error: 'Failed to get bug report stats' };
    }
  }

  // ✅ Get User's Bug Reports
  static async getUserBugReports(userId: string, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const bugReports = await db
        .select({
          id: bugReportsTable.id,
          title: bugReportsTable.title,
          description: bugReportsTable.description,
          category: bugReportsTable.category,
          priority: bugReportsTable.priority,
          status: bugReportsTable.status,
          createdAt: bugReportsTable.createdAt,
          updatedAt: bugReportsTable.updatedAt,
          resolvedAt: bugReportsTable.resolvedAt
        })
        .from(bugReportsTable)
        .where(
          and(
            eq(bugReportsTable.reporterId, userId),
            eq(bugReportsTable.isDeleted, false)
          )
        )
        .orderBy(desc(bugReportsTable.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(bugReportsTable)
        .where(
          and(
            eq(bugReportsTable.reporterId, userId),
            eq(bugReportsTable.isDeleted, false)
          )
        );

      const totalCount = totalCountResult[0].count;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          bugReports,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasMore: page < totalPages
          }
        }
      };

    } catch (error) {
      console.error('❌ Error getting user bug reports:', error);
      return { success: false, error: 'Failed to get user bug reports' };
    }
  }
}