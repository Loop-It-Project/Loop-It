import bcrypt from 'bcryptjs';
import { db } from '../db';
import { usersTable, profilesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export class UserService {
  
  // USER PROFILE abrufen
  static async getUserProfile(userId: string) {
    try {
      const user = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          username: usersTable.username,
          displayName: usersTable.displayName,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          accountStatus: usersTable.accountStatus,
          emailVerifiedAt: usersTable.emailVerifiedAt,
          createdAt: usersTable.createdAt,
          lastLoginAt: usersTable.lastLoginAt
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new Error('User not found');
      }

      // Optional: Profile-Daten laden
      const profile = await db
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.userId, userId))
        .limit(1);

      return {
        ...user[0],
        profile: profile.length > 0 ? profile[0] : null
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // USER PROFILE aktualisieren
  static async updateUserProfile(userId: string, updateData: any) {
    try {
      const { displayName, firstName, lastName, bio } = updateData;

      // User-Tabelle aktualisieren
      const updatedUser = await db
        .update(usersTable)
        .set({
          displayName,
          firstName,
          lastName,
          updatedAt: new Date()
        })
        .where(eq(usersTable.id, userId))
        .returning();

      // Profile-Tabelle aktualisieren (falls bio vorhanden)
      if (bio !== undefined) {
        await db
          .update(profilesTable)
          .set({
            bio,
            updatedAt: new Date()
          })
          .where(eq(profilesTable.userId, userId));
      }

      return updatedUser[0];
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // PASSWORD ändern
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      // Aktuelles Password prüfen
      const user = await db
        .select({
          passwordHash: usersTable.passwordHash
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user[0].passwordHash);
      
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }

      // Neues Password hashen
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Password aktualisieren
      await db
        .update(usersTable)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        })
        .where(eq(usersTable.id, userId));

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // PUBLIC USER PROFILE abrufen
  static async getPublicUserProfile(username: string) {
    try {
      const user = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          displayName: usersTable.displayName,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          createdAt: usersTable.createdAt,
          // Keine sensiblen Daten wie email, passwordHash etc.
        })
        .from(usersTable)
        .where(eq(usersTable.username, username))
        .limit(1);

      if (user.length === 0) {
        throw new Error('User not found');
      }

      // Profile-Daten laden (nur öffentliche)
      const profile = await db
        .select({
          bio: profilesTable.bio,
          website: profilesTable.website,
          interests: profilesTable.interests,
          hobbies: profilesTable.hobbies,
          profileViews: profilesTable.profileViews,
          postsCount: profilesTable.postsCount,
        })
        .from(profilesTable)
        .where(eq(profilesTable.userId, user[0].id))
        .limit(1);

      return {
        ...user[0],
        profile: profile.length > 0 ? profile[0] : null
      };
    } catch (error) {
      console.error('Error getting public user profile:', error);
      throw error;
    }
  }

  // USER SETTINGS abrufen
  static async getUserSettings(userId: string) {
    try {
      const settings = await db
        .select({
          emailNotifications: usersTable.emailNotifications,
          pushNotifications: usersTable.pushNotifications,
          locationVisibility: usersTable.locationVisibility,
          searchRadius: usersTable.searchRadius,
          premiumTier: usersTable.premiumTier,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (settings.length === 0) {
        throw new Error('User not found');
      }

      // Profile-Settings laden
      const profileSettings = await db
        .select({
          profileVisibility: profilesTable.profileVisibility,
          showAge: profilesTable.showAge,
          showLocation: profilesTable.showLocation,
          allowMessagesFrom: profilesTable.allowMessagesFrom,
        })
        .from(profilesTable)
        .where(eq(profilesTable.userId, userId))
        .limit(1);

      return {
        ...settings[0],
        ...(profileSettings.length > 0 ? profileSettings[0] : {})
      };
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw error;
    }
  }

  // USER SETTINGS aktualisieren
  static async updateUserSettings(userId: string, updateData: any) {
    try {
      const { 
        emailNotifications, 
        pushNotifications, 
        locationVisibility, 
        searchRadius,
        profileVisibility,
        showAge,
        showLocation,
        allowMessagesFrom
      } = updateData;

      // User-Tabelle aktualisieren
      const userUpdateData: any = {};
      if (emailNotifications !== undefined) userUpdateData.emailNotifications = emailNotifications;
      if (pushNotifications !== undefined) userUpdateData.pushNotifications = pushNotifications;
      if (locationVisibility !== undefined) userUpdateData.locationVisibility = locationVisibility;
      if (searchRadius !== undefined) userUpdateData.searchRadius = searchRadius;

      if (Object.keys(userUpdateData).length > 0) {
        userUpdateData.updatedAt = new Date();
        await db
          .update(usersTable)
          .set(userUpdateData)
          .where(eq(usersTable.id, userId));
      }

      // Profile-Tabelle aktualisieren
      const profileUpdateData: any = {};
      if (profileVisibility !== undefined) profileUpdateData.profileVisibility = profileVisibility;
      if (showAge !== undefined) profileUpdateData.showAge = showAge;
      if (showLocation !== undefined) profileUpdateData.showLocation = showLocation;
      if (allowMessagesFrom !== undefined) profileUpdateData.allowMessagesFrom = allowMessagesFrom;

      if (Object.keys(profileUpdateData).length > 0) {
        profileUpdateData.updatedAt = new Date();
        
        // Prüfe ob Profile existiert, wenn nicht, erstelle es
        const existingProfile = await db
          .select()
          .from(profilesTable)
          .where(eq(profilesTable.userId, userId))
          .limit(1);

        if (existingProfile.length > 0) {
          await db
            .update(profilesTable)
            .set(profileUpdateData)
            .where(eq(profilesTable.userId, userId));
        } else {
          await db
            .insert(profilesTable)
            .values({
              userId,
              ...profileUpdateData,
              createdAt: new Date()
            });
        }
      }

      return { success: true, message: 'Settings updated successfully' };
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  // Profile-Erstellung falls nicht vorhanden
  static async ensureUserProfile(userId: string) {
    try {
      const existingProfile = await db
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.userId, userId))
        .limit(1);

      if (existingProfile.length === 0) {
        await db
          .insert(profilesTable)
          .values({
            userId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }

      return true;
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      throw error;
    }
  }
}