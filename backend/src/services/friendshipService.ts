import { db } from '../db/connection';
import { friendshipsTable, usersTable, profilesTable } from '../db/Schemas';
import { eq, and, or, desc, asc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class FriendshipService {
  // Freundschaftsanfrage senden
  static async sendFriendRequest(requesterId: string, addresseeUsername: string) {
    try {
      // Finde Addressee by username
      const [addressee] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.username, addresseeUsername))
        .limit(1);

      if (!addressee) {
        return { success: false, error: 'User not found' };
      }

      if (requesterId === addressee.id) {
        return { success: false, error: 'Cannot send friend request to yourself' };
      }

      // Prüfe ob bereits eine Freundschaft existiert
      const existingFriendship = await db
        .select()
        .from(friendshipsTable)
        .where(
          or(
            and(
              eq(friendshipsTable.requesterId, requesterId),
              eq(friendshipsTable.addresseeId, addressee.id)
            ),
            and(
              eq(friendshipsTable.requesterId, addressee.id),
              eq(friendshipsTable.addresseeId, requesterId)
            )
          )
        )
        .limit(1);

      if (existingFriendship.length > 0) {
        const status = existingFriendship[0].status;
        if (status === 'accepted') {
          return { success: false, error: 'Already friends' };
        }
        if (status === 'pending') {
          return { success: false, error: 'Friend request already sent' };
        }
        if (status === 'declined') {
          // Update existing declined request to pending
          await db
            .update(friendshipsTable)
            .set({
              status: 'pending',
              requestedAt: new Date(),
              respondedAt: null
            })
            .where(eq(friendshipsTable.id, existingFriendship[0].id));
          
          return { success: true, message: 'Friend request sent' };
        }
      }

      // Erstelle neue Freundschaftsanfrage
      await db
        .insert(friendshipsTable)
        .values({
          requesterId,
          addresseeId: addressee.id,
          status: 'pending',
          requestedAt: new Date()
        });

      return { success: true, message: 'Friend request sent' };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, error: 'Failed to send friend request' };
    }
  }

  // Freundschaftsanfrage annehmen
  static async acceptFriendRequest(userId: string, requestId: string) {
    try {
      const [friendship] = await db
        .select()
        .from(friendshipsTable)
        .where(
          and(
            eq(friendshipsTable.id, requestId),
            eq(friendshipsTable.addresseeId, userId),
            eq(friendshipsTable.status, 'pending')
          )
        )
        .limit(1);

      if (!friendship) {
        return { success: false, error: 'Friend request not found' };
      }

      await db
        .update(friendshipsTable)
        .set({
          status: 'accepted',
          respondedAt: new Date()
        })
        .where(eq(friendshipsTable.id, requestId));

      return { success: true, message: 'Friend request accepted' };
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return { success: false, error: 'Failed to accept friend request' };
    }
  }

  // Freundschaftsanfrage ablehnen
  static async declineFriendRequest(userId: string, requestId: string) {
    try {
      const [friendship] = await db
        .select()
        .from(friendshipsTable)
        .where(
          and(
            eq(friendshipsTable.id, requestId),
            eq(friendshipsTable.addresseeId, userId),
            eq(friendshipsTable.status, 'pending')
          )
        )
        .limit(1);

      if (!friendship) {
        return { success: false, error: 'Friend request not found' };
      }

      await db
        .update(friendshipsTable)
        .set({
          status: 'declined',
          respondedAt: new Date()
        })
        .where(eq(friendshipsTable.id, requestId));

      return { success: true, message: 'Friend request declined' };
    } catch (error) {
      console.error('Error declining friend request:', error);
      return { success: false, error: 'Failed to decline friend request' };
    }
  }

  // Freundschaft entfernen
  static async removeFriend(userId: string, friendUsername: string) {
    try {
      // Finde Friend by username
      const [friend] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.username, friendUsername))
        .limit(1);

      if (!friend) {
        return { success: false, error: 'User not found' };
      }

      const result = await db
        .delete(friendshipsTable)
        .where(
          or(
            and(
              eq(friendshipsTable.requesterId, userId),
              eq(friendshipsTable.addresseeId, friend.id),
              eq(friendshipsTable.status, 'accepted')
            ),
            and(
              eq(friendshipsTable.requesterId, friend.id),
              eq(friendshipsTable.addresseeId, userId),
              eq(friendshipsTable.status, 'accepted')
            )
          )
        );

      return { success: true, message: 'Friend removed' };
    } catch (error) {
      console.error('Error removing friend:', error);
      return { success: false, error: 'Failed to remove friend' };
    }
  }

  // Freunde eines Users abrufen
  static async getUserFriends(userId: string, page: number = 1, limit: number = 20) {
    try {
      const offset = (page - 1) * limit;

      const friends = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          displayName: usersTable.displayName,
          bio: profilesTable.bio,
          avatarId: profilesTable.avatarId,
          interests: profilesTable.interests,
          hobbies: profilesTable.hobbies,
          lastActivityAt: usersTable.lastActivityAt,
          friendshipId: friendshipsTable.id,
          friendsSince: friendshipsTable.respondedAt
        })
        .from(friendshipsTable)
        .innerJoin(
          usersTable,
          or(
            eq(friendshipsTable.requesterId, usersTable.id),
            eq(friendshipsTable.addresseeId, usersTable.id)
          )
        )
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(
          and(
            or(
              eq(friendshipsTable.requesterId, userId),
              eq(friendshipsTable.addresseeId, userId)
            ),
            eq(friendshipsTable.status, 'accepted')
          )
        )
        .orderBy(desc(friendshipsTable.respondedAt))
        .offset(offset)
        .limit(limit);

      // Filtere den aktuellen User aus den Ergebnissen
      const filteredFriends = friends.filter(friend => friend.id !== userId);

    // console.log('🔍 Filtered friends result:', { 
    //   total: friends.length, 
    //   filtered: filteredFriends.length,
    //   userIdToFilter: userId 
    // });

      return {
        success: true,
        data: {
          friends: filteredFriends,
          pagination: {
            page,
            limit,
            hasMore: friends.length === limit
          }
        }
      };
    } catch (error) {
      console.error('Error getting user friends:', error);
      return { success: false, error: 'Failed to get friends' };
    }
  }

  // Ausstehende Freundschaftsanfragen abrufen
  static async getPendingRequests(userId: string) {
    try {
      // Erhaltene Anfragen
      const receivedRequests = await db
        .select({
          id: friendshipsTable.id,
          type: sql<string>`'received'`,
          user: {
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName,
            avatarId: profilesTable.avatarId
          },
          requestedAt: friendshipsTable.requestedAt
        })
        .from(friendshipsTable)
        .innerJoin(usersTable, eq(friendshipsTable.requesterId, usersTable.id))
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(
          and(
            eq(friendshipsTable.addresseeId, userId),
            eq(friendshipsTable.status, 'pending')
          )
        )
        .orderBy(desc(friendshipsTable.requestedAt));

      // Gesendete Anfragen
      const sentRequests = await db
        .select({
          id: friendshipsTable.id,
          type: sql<string>`'sent'`,
          user: {
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName,
            avatarId: profilesTable.avatarId
          },
          requestedAt: friendshipsTable.requestedAt
        })
        .from(friendshipsTable)
        .innerJoin(usersTable, eq(friendshipsTable.addresseeId, usersTable.id))
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(
          and(
            eq(friendshipsTable.requesterId, userId),
            eq(friendshipsTable.status, 'pending')
          )
        )
        .orderBy(desc(friendshipsTable.requestedAt));

      return {
        success: true,
        data: {
          received: receivedRequests,
          sent: sentRequests
        }
      };
    } catch (error) {
      console.error('Error getting pending requests:', error);
      return { success: false, error: 'Failed to get pending requests' };
    }
  }

  // Freundschaftsstatus zwischen zwei Usern prüfen
  static async getFriendshipStatus(userId: string, otherUsername: string) {
    try {
      // Finde other user by username
      const [otherUser] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.username, otherUsername))
        .limit(1);

      if (!otherUser) {
        return { success: false, error: 'User not found' };
      }

      if (userId === otherUser.id) {
        return { success: true, data: { status: 'self' } };
      }

      const [friendship] = await db
        .select({
          id: friendshipsTable.id,
          status: friendshipsTable.status,
          requesterId: friendshipsTable.requesterId,
          addresseeId: friendshipsTable.addresseeId
        })
        .from(friendshipsTable)
        .where(
          or(
            and(
              eq(friendshipsTable.requesterId, userId),
              eq(friendshipsTable.addresseeId, otherUser.id)
            ),
            and(
              eq(friendshipsTable.requesterId, otherUser.id),
              eq(friendshipsTable.addresseeId, userId)
            )
          )
        )
        .limit(1);

      if (!friendship) {
        return { success: true, data: { status: 'none' } };
      }

      let detailedStatus = friendship.status;
      if (friendship.status === 'pending') {
        detailedStatus = friendship.requesterId === userId ? 'pending_sent' : 'pending_received';
      }

      return {
        success: true,
        data: {
          status: detailedStatus,
          friendshipId: friendship.id
        }
      };
    } catch (error) {
      console.error('Error getting friendship status:', error);
      return { success: false, error: 'Failed to get friendship status' };
    }
  }

  // Freunde mit gemeinsamen Interessen (für UserProfile Sidebar)
  static async getFriendsWithCommonInterests(userId: string, limit: number = 10) {
    try {
      // User's Interessen abrufen
      const [userProfile] = await db
        .select({ 
          interests: profilesTable.interests, 
          hobbies: profilesTable.hobbies 
        })
        .from(profilesTable)
        .where(eq(profilesTable.userId, userId))
        .limit(1);

      if (!userProfile) {
        return { success: true, data: [] };
      }

      const userInterests = Array.isArray(userProfile.interests) ? userProfile.interests : [];
      const userHobbies = Array.isArray(userProfile.hobbies) ? userProfile.hobbies : [];
      
      if (userInterests.length === 0 && userHobbies.length === 0) {
        return { success: true, data: [] };
      }

      // Freunde abrufen
      const friends = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          displayName: usersTable.displayName,
          bio: profilesTable.bio,
          interests: profilesTable.interests,
          hobbies: profilesTable.hobbies,
          avatarId: profilesTable.avatarId
        })
        .from(friendshipsTable)
        .innerJoin(
          usersTable,
          or(
            eq(friendshipsTable.requesterId, usersTable.id),
            eq(friendshipsTable.addresseeId, usersTable.id)
          )
        )
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(
          and(
            or(
              eq(friendshipsTable.requesterId, userId),
              eq(friendshipsTable.addresseeId, userId)
            ),
            eq(friendshipsTable.status, 'accepted')
          )
        )
        .limit(limit * 2); // Mehr laden für Filtering

      // Filter für gemeinsame Interessen und aktuellen User ausschließen
      const friendsWithCommonInterests = friends
        .filter(friend => friend.id !== userId)
        .filter(friend => {
          const friendInterests = Array.isArray(friend.interests) ? friend.interests : [];
          const friendHobbies = Array.isArray(friend.hobbies) ? friend.hobbies : [];
          
          const commonInterests = userInterests.filter(interest => 
            friendInterests.includes(interest)
          );
          const commonHobbies = userHobbies.filter(hobby => 
            friendHobbies.includes(hobby)
          );
          
          return commonInterests.length > 0 || commonHobbies.length > 0;
        })
        .slice(0, limit)
        .map(friend => {
          const friendInterests = Array.isArray(friend.interests) ? friend.interests : [];
          const friendHobbies = Array.isArray(friend.hobbies) ? friend.hobbies : [];
          
          return {
            ...friend,
            commonInterests: userInterests.filter(interest => 
              friendInterests.includes(interest)
            ),
            commonHobbies: userHobbies.filter(hobby => 
              friendHobbies.includes(hobby)
            )
          };
        });

      return { success: true, data: friendsWithCommonInterests };
    } catch (error) {
      console.error('Error getting friends with common interests:', error);
      return { success: false, error: 'Failed to get friends with common interests' };
    }
  }

  // Direkte Freundschaft erstellen (z.B. bei Matches)
  static async createFriendship(user1Id: string, user2Id: string, source: string = 'match') {
    try {
      // console.log(`🤝 Creating direct friendship between users: ${user1Id} and ${user2Id} (source: ${source})`);

      // Check if users are already friends
      const existingFriendship = await db
        .select()
        .from(friendshipsTable)
        .where(
          or(
            and(
              eq(friendshipsTable.requesterId, user1Id),
              eq(friendshipsTable.addresseeId, user2Id)
            ),
            and(
              eq(friendshipsTable.requesterId, user2Id),
              eq(friendshipsTable.addresseeId, user1Id)
            )
          )
        )
        .limit(1);

      if (existingFriendship.length > 0) {
        const status = existingFriendship[0].status;
        if (status === 'accepted') {
          // console.log('⚠️ Users are already friends');
          return { success: true, message: 'Users are already friends', friendshipId: existingFriendship[0].id };
        }

        // Update existing friendship to accepted if pending or declined
        await db
          .update(friendshipsTable)
          .set({
            status: 'accepted',
            respondedAt: new Date(),
            notes: `Match from ${source}`
          })
          .where(eq(friendshipsTable.id, existingFriendship[0].id));

        // console.log('✅ Existing friendship status updated to accepted');
        return { 
          success: true, 
          message: 'Friendship status updated to accepted', 
          friendshipId: existingFriendship[0].id
        };
      }

      // Create new direct friendship (immediately accepted)
      const friendshipId = uuidv4();
      await db
        .insert(friendshipsTable)
        .values({
          id: friendshipId,
          requesterId: user1Id,
          addresseeId: user2Id,
          status: 'accepted',
          requestedAt: new Date(),
          respondedAt: new Date(), // Immediately accepted
          notes: `Match from ${source}`
        });

      // console.log('✅ New friendship created successfully');
      return { success: true, message: 'Friendship created', friendshipId };
    } catch (error) {
      console.error('❌ Error creating friendship:', error);
      // Detaillierteres Logging
      console.error('Friendship creation error details:', {
        user1Id,
        user2Id,
        source,
        errorName: error instanceof Error ? error.name : 'Unknown error',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      return { success: false, error: 'Failed to create friendship' };
    }
  }
}