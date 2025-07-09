import { db } from '../db/connection';
import { 
  moderationReportsTable, 
  postsTable, 
  usersTable, 
  userActivitiesTable 
} from '../db/Schemas';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface CreateReportData {
  reporterId: string;
  reportedContentType: 'post' | 'comment' | 'user';
  reportedContentId: string;
  reportedUserId?: string;
  reason: string;
  description?: string;
  category?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  priority?: number;
}

export interface ReportActionData {
  action: 'dismiss' | 'resolve' | 'escalate';
  resolution?: string;
  contentAction?: 'none' | 'hide' | 'delete';
  userAction?: 'none' | 'warning' | 'timeout' | 'ban';
  timeoutDuration?: number; // in hours
}

export class ReportService {
  
  // Report erstellen
  static async createReport(data: CreateReportData) {
    try {
      const reportId = uuidv4();
      const now = new Date();

      // Prüfe ob Content existiert
      if (data.reportedContentType === 'post') {
        const post = await db
          .select({ id: postsTable.id, authorId: postsTable.authorId })
          .from(postsTable)
          .where(eq(postsTable.id, data.reportedContentId))
          .limit(1);

        if (post.length === 0) {
          throw new Error('Post not found');
        }

        // Setze reportedUserId falls nicht angegeben
        if (!data.reportedUserId) {
          data.reportedUserId = post[0].authorId;
        }
      }

      // Prüfe ob bereits ein Report existiert
      const existingReport = await db
        .select()
        .from(moderationReportsTable)
        .where(
          and(
            eq(moderationReportsTable.reporterId, data.reporterId),
            eq(moderationReportsTable.reportedContentType, data.reportedContentType),
            eq(moderationReportsTable.reportedContentId, data.reportedContentId),
            eq(moderationReportsTable.status, 'pending')
          )
        )
        .limit(1);

      if (existingReport.length > 0) {
        throw new Error('You have already reported this content');
      }

      // Mapping für category basierend auf reason
      const categoryMapping: Record<string, string> = {
        'spam': 'spam',
        'harassment': 'harassment', 
        'hate_speech': 'hate_speech',
        'inappropriate_content': 'inappropriate',
        'copyright': 'copyright',
        'misinformation': 'misinformation',
        'other': 'other'
      };

      // Severity basierend auf reason
      const severityMapping: Record<string, string> = {
        'spam': 'low',
        'harassment': 'high',
        'hate_speech': 'critical',
        'inappropriate_content': 'medium',
        'copyright': 'high',
        'misinformation': 'medium',
        'other': 'medium'
      };

      // Report erstellen
      await db
        .insert(moderationReportsTable)
        .values({
          id: reportId,
          reporterId: data.reporterId,
          reportedUserId: data.reportedUserId || null,
          reportedContentType: data.reportedContentType,
          reportedContentId: data.reportedContentId,
          reason: data.reason,
          description: data.description || null,
          category: categoryMapping[data.reason] || 'other',
          severity: severityMapping[data.reason] || 'medium',
          priority: data.reason === 'hate_speech' ? 1 : 
                   data.reason === 'harassment' ? 2 : 3,
          status: 'pending',
          createdAt: now,
          updatedAt: now
        });

      // Aktivität loggen
      await db
        .insert(userActivitiesTable)
        .values({
          id: uuidv4(),
          userId: data.reporterId,
          activityType: 'report_created',
          entityType: data.reportedContentType,
          entityId: data.reportedContentId,
          metadata: {
            reason: data.reason,
            reportId: reportId
          },
          createdAt: now
        });

      console.log(`✅ Report created: ${reportId}`);

      return {
        success: true,
        reportId,
        message: 'Report submitted successfully'
      };

    } catch (error) {
      console.error('❌ Error creating report:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create report');
    }
  }

  // Report bearbeiten (Admin)
  static async processReport(reportId: string, adminId: string, actionData: ReportActionData) {
    try {
      const now = new Date();

      // Report laden
      const report = await db
        .select()
        .from(moderationReportsTable)
        .where(eq(moderationReportsTable.id, reportId))
        .limit(1);

      if (report.length === 0) {
        throw new Error('Report not found');
      }

      const reportData = report[0];

      // Content-Aktion ausführen
      if (actionData.contentAction && actionData.contentAction !== 'none') {
        await this.executeContentAction(
          reportData.reportedContentType,
          reportData.reportedContentId,
          actionData.contentAction,
          adminId
        );
      }

      // User-Aktion ausführen
      if (actionData.userAction && actionData.userAction !== 'none' && reportData.reportedUserId) {
        await this.executeUserAction(
          reportData.reportedUserId,
          actionData.userAction,
          adminId,
          actionData.timeoutDuration
        );
      }

      // Report Status aktualisieren
      await db
        .update(moderationReportsTable)
        .set({
          status: actionData.action === 'dismiss' ? 'dismissed' : 'resolved',
          reviewedBy: adminId,
          reviewedAt: now,
          resolution: actionData.resolution || null,
          actionTaken: this.formatActionTaken(actionData),
          updatedAt: now
        })
        .where(eq(moderationReportsTable.id, reportId));

      // Admin-Aktivität loggen
      await db
        .insert(userActivitiesTable)
        .values({
          id: uuidv4(),
          userId: adminId,
          activityType: 'report_processed',
          entityType: 'report',
          entityId: reportId,
          metadata: {
            action: actionData.action,
            contentAction: actionData.contentAction,
            userAction: actionData.userAction,
            reportedUserId: reportData.reportedUserId
          },
          createdAt: now
        });

      console.log(`✅ Report processed: ${reportId} by admin: ${adminId}`);

      return {
        success: true,
        message: 'Report processed successfully'
      };

    } catch (error) {
      console.error('❌ Error processing report:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to process report');
    }
  }

  // Content-Aktion ausführen
  private static async executeContentAction(
    contentType: string, 
    contentId: string, 
    action: string, 
    adminId: string
  ) {
    const now = new Date();

    if (contentType === 'post') {
      switch (action) {
        case 'hide':
          await db
            .update(postsTable)
            .set({
              isPublic: false,
              moderationNotes: 'Hidden by admin due to report',
              updatedAt: now
            })
            .where(eq(postsTable.id, contentId));
          break;

        case 'delete':
          await db
            .update(postsTable)
            .set({
              isDeleted: true,
              deletedBy: adminId,
              deletedAt: now,
              moderationNotes: 'Deleted by admin due to report',
              updatedAt: now
            })
            .where(eq(postsTable.id, contentId));
          break;
      }
    }
    // Weitere Content-Typen können hier hinzugefügt werden
  }

  // User-Aktion ausführen
  private static async executeUserAction(
    userId: string, 
    action: string, 
    adminId: string, 
    timeoutDuration?: number
  ) {
    const now = new Date();

    switch (action) {
      case 'warning':
        // User-Strike System (kann später erweitert werden)
        await db
          .insert(userActivitiesTable)
          .values({
            id: uuidv4(),
            userId: userId,
            activityType: 'warning_received',
            entityType: 'user',
            entityId: userId,
            metadata: {
              issuedBy: adminId,
              reason: 'Content violation',
              severity: 'warning'
            },
            createdAt: now
          });
        break;

      case 'timeout':
        const timeoutEnd = new Date(now.getTime() + (timeoutDuration || 24) * 60 * 60 * 1000);
        
        await db
          .update(usersTable)
          .set({
            accountStatus: 'restricted',
            updatedAt: now
          })
          .where(eq(usersTable.id, userId));

        await db
          .insert(userActivitiesTable)
          .values({
            id: uuidv4(),
            userId: userId,
            activityType: 'timeout_applied',
            entityType: 'user',
            entityId: userId,
            metadata: {
              issuedBy: adminId,
              duration: timeoutDuration || 24,
              endsAt: timeoutEnd.toISOString(),
              reason: 'Content violation'
            },
            createdAt: now
          });
        break;

      case 'ban':
        await db
          .update(usersTable)
          .set({
            accountStatus: 'suspended',
            updatedAt: now
          })
          .where(eq(usersTable.id, userId));

        await db
          .insert(userActivitiesTable)
          .values({
            id: uuidv4(),
            userId: userId,
            activityType: 'ban_applied',
            entityType: 'user',
            entityId: userId,
            metadata: {
              issuedBy: adminId,
              reason: 'Content violation',
              severity: 'permanent'
            },
            createdAt: now
          });
        break;
    }
  }

  // Action-Beschreibung formatieren
  private static formatActionTaken(actionData: ReportActionData): string {
    const actions = [];
    
    if (actionData.contentAction && actionData.contentAction !== 'none') {
      actions.push(`Content: ${actionData.contentAction}`);
    }
    
    if (actionData.userAction && actionData.userAction !== 'none') {
      let userAction = `User: ${actionData.userAction}`;
      if (actionData.userAction === 'timeout' && actionData.timeoutDuration) {
        userAction += ` (${actionData.timeoutDuration}h)`;
      }
      actions.push(userAction);
    }

    return actions.join(', ') || 'No action taken';
  }

  // Reports abrufen (für Admin Panel)
  static async getReports(page = 1, limit = 20, status = 'pending') {
    try {
      const offset = (page - 1) * limit;

      const reports = await db
        .select({
          id: moderationReportsTable.id,
          reporterId: moderationReportsTable.reporterId,
          reportedUserId: moderationReportsTable.reportedUserId,
          reportedContentType: moderationReportsTable.reportedContentType,
          reportedContentId: moderationReportsTable.reportedContentId,
          reason: moderationReportsTable.reason,
          description: moderationReportsTable.description,
          status: moderationReportsTable.status,
          reviewedBy: moderationReportsTable.reviewedBy,
          reviewedAt: moderationReportsTable.reviewedAt,
          resolution: moderationReportsTable.resolution,
          actionTaken: moderationReportsTable.actionTaken,
          createdAt: moderationReportsTable.createdAt,
        })
        .from(moderationReportsTable)
        .where(eq(moderationReportsTable.status, status))
        .orderBy(desc(moderationReportsTable.createdAt))
        .limit(limit)
        .offset(offset);

      // User-Details hinzufügen
      if (reports.length > 0) {
        const userIds = [
          ...new Set([
            ...reports.map(r => r.reporterId),
            ...reports.filter(r => r.reportedUserId).map(r => r.reportedUserId!),
            ...reports.filter(r => r.reviewedBy).map(r => r.reviewedBy!)
          ])
        ];

        const users = await db
          .select({
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName,
          })
          .from(usersTable)
          .where(inArray(usersTable.id, userIds));

        const userMap = users.reduce((map, user) => {
          map[user.id] = user;
          return map;
        }, {} as Record<string, typeof users[0]>);

        // Reports mit User-Daten anreichern
        const enrichedReports = reports.map(report => ({
          ...report,
          reporter: userMap[report.reporterId] || null,
          reportedUser: report.reportedUserId ? (userMap[report.reportedUserId] || null) : null,
          reviewer: report.reviewedBy ? (userMap[report.reviewedBy] || null) : null,
        }));

        return {
          success: true,
          reports: enrichedReports,
          pagination: {
            page,
            limit,
            hasMore: reports.length === limit
          }
        };
      }

      return {
        success: true,
        reports: [],
        pagination: { page, limit, hasMore: false }
      };

    } catch (error) {
      console.error('❌ Error getting reports:', error);
      throw new Error('Failed to get reports');
    }
  }
}