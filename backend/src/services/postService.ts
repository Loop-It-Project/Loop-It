import { db } from '../db';
import { postsTable, universesTable, universeMembersTable, usersTable, profilesTable } from '../db/schema'; // ← usersTable hinzufügen
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class PostService {

  static async createPost(postData: any) {
      try {
        const { 
          title, 
          content, 
          universeId, 
          hashtags, 
          isPublic = true,
          authorId 
        } = postData;

        // Validiere universeId
        if (!universeId) {
          throw new Error('Universe ID is required');
        }

        // Universe, User UND Profile-Daten laden
        const [universe, author, profile] = await Promise.all([
          db
            .select({
              id: universesTable.id,
              name: universesTable.name,
              slug: universesTable.slug,
              creatorId: universesTable.creatorId,
              postCount: universesTable.postCount,
              isActive: universesTable.isActive
            })
            .from(universesTable)
            .where(eq(universesTable.id, universeId))
            .limit(1),
        
          db
            .select({
              id: usersTable.id,
              username: usersTable.username,
              displayName: usersTable.displayName
            })
            .from(usersTable)
            .where(eq(usersTable.id, authorId))
            .limit(1),
        
          db
            .select({
              userId: profilesTable.userId,
              avatarId: profilesTable.avatarId
            })
            .from(profilesTable)
            .where(eq(profilesTable.userId, authorId))
            .limit(1)
        ]);

        if (universe.length === 0) {
          throw new Error('Universe not found');
        }

        if (author.length === 0) {
          throw new Error('Author not found');
        }

        if (!universe[0].isActive) {
          throw new Error('Universe is not active');
        }

        // Prüfen ob User Mitglied des Universe ist oder Creator
        const isCreator = universe[0].creatorId === authorId;
        let isMember = false;

        if (!isCreator) {
          const membership = await db
            .select()
            .from(universeMembersTable)
            .where(
              and(
                eq(universeMembersTable.universeId, universeId),
                eq(universeMembersTable.userId, authorId)
              )
            )
            .limit(1);
        
          isMember = membership.length > 0;
        }

        if (!isCreator && !isMember) {
          throw new Error('You must be a member of this universe to post');
        }

        // Post erstellen
        const postId = uuidv4();
        const now = new Date();

        await db
          .insert(postsTable)
          .values({
            id: postId,
            title: title || null,
            content,
            contentType: 'text',
            universeId,
            authorId,
            hashtags: hashtags || [],
            isPublic,
            isDeleted: false,
            likeCount: 0,
            commentCount: 0,
            shareCount: 0,
            createdAt: now,
            updatedAt: now
          });

        // Post-Count im Universe erhöhen
        await db
          .update(universesTable)
          .set({
            postCount: universe[0].postCount + 1,
            updatedAt: now
          })
          .where(eq(universesTable.id, universeId));

        // Vollständige Post-Daten für Frontend zurückgeben
        const newPost = {
          id: postId,
          title: title || null,
          content,
          contentType: 'text',
          universeId,
          authorId,
          hashtags: hashtags || [],
          isPublic,
          isDeleted: false,
          likeCount: 0,
          commentCount: 0,
          shareCount: 0,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          author: {
            id: author[0].id,
            username: author[0].username,
            displayName: author[0].displayName,
            profileImage: profile.length > 0 ? profile[0].avatarId : null
          },
          // Universe-Daten hinzufügen
          universe: {
            id: universe[0].id,
            name: universe[0].name,
            slug: universe[0].slug
          },
          // Legacy-Felder für Rückwärtskompatibilität
          authorName: author[0].displayName || author[0].username,
          authorUsername: author[0].username,
          authorDisplayName: author[0].displayName,
          authorAvatar: profile.length > 0 ? profile[0].avatarId : null,
          universeName: universe[0].name,
          universeSlug: universe[0].slug,
          // Frontend-spezifische Felder
          isLikedByUser: false,
          timeAgo: 'Gerade eben'
        };

        return newPost;
      } catch (error) {
        console.error('Error creating post:', error);
        throw error;
      }
    }

  static async deletePost(postId: string, userId: string) {
      try {
        // Prüfen ob User der Autor ist
        const post = await db
          .select()
          .from(postsTable)
          .where(eq(postsTable.id, postId))
          .limit(1);

        if (post.length === 0) {
          throw new Error('Post not found');
        }

        if (post[0].authorId !== userId) {
          throw new Error('Not authorized to delete this post');
        }

        const postData = post[0];

        // Prüfe ob universeId existiert
        if (!postData.universeId) {
          throw new Error('Post has no universe associated');
        }

        // Soft delete
        await db
          .update(postsTable)
          .set({
            isDeleted: true,
            updatedAt: new Date()
          })
          .where(eq(postsTable.id, postId));

        // Universe-Daten laden für Post-Count Update
        const currentUniverse = await db
          .select({
            postCount: universesTable.postCount
          })
          .from(universesTable)
          .where(eq(universesTable.id, postData.universeId))
          .limit(1);

        if (currentUniverse.length > 0) {
          // Post-Count im Universe verringern
          await db
            .update(universesTable)
            .set({
              postCount: Math.max(0, currentUniverse[0].postCount - 1),
              updatedAt: new Date()
            })
            .where(eq(universesTable.id, postData.universeId));
        }

        return { success: true };
      } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
      }
    }

  static async toggleLike(postId: string, userId: string) {
    // TODO: Implementiere Like-System später
    throw new Error('Like functionality not implemented yet');
  }
}