import { db } from '../db/connection';
import { 
  postsTable,
  postReactionsTable,
  commentsTable, 
  commentReactionsTable,
  postSharesTable,
  universesTable, 
  universeMembersTable, 
  usersTable, 
  profilesTable 
} from '../db/Schemas';
import { eq, and, asc, sql, desc, isNull } from 'drizzle-orm';
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

  // Like/Unlike Post
  static async toggleLike(postId: string, userId: string) {
  try {
    // console.log('🔍 ToggleLike called with:', { postId, userId });
    // console.log('🔍 userId type:', typeof userId);
    // console.log('🔍 userId length:', userId?.length);

    // ERST den Post laden für Debug-Zwecke
    const [post] = await db
      .select({
        id: postsTable.id,
        authorId: postsTable.authorId,
        likeCount: postsTable.likeCount
      })
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .limit(1);

    // Debug
    // console.log('🔍 LIKE DEBUG:', {
    //   postId,
    //   userId, // ← Das sollte Max Mustermann sein
    //   postAuthorId: post.authorId // ← Das ist Zerrelius
    // });

    if (!post) {
      throw new Error('Post not found');
    }

    // Prüfe ob Like bereits existiert
    const existingLike = await db
      .select()
      .from(postReactionsTable)
      .where(
        and(
          eq(postReactionsTable.postId, postId),
          eq(postReactionsTable.userId, userId),
          eq(postReactionsTable.reactionType, 'like')
        )
      )
      .limit(1);

    // console.log('🔍 Existing like check:', { 
    //   found: existingLike.length > 0, 
    //   userId,
    //   postId 
    // });

    let isLiked = false;
    let newLikeCount = 0;

    if (existingLike.length > 0) {
      // Unlike
      // console.log('🔍 Removing existing like with ID:', existingLike[0].id);
      await db
        .delete(postReactionsTable)
        .where(eq(postReactionsTable.id, existingLike[0].id));
      isLiked = false;
      // console.log('🔍 Removed like for userId:', userId);
    } else {
      // Like hinzufügen - ERWEITERTE DEBUG-INFO
      const newLikeData = {
        postId,
        userId,
        reactionType: 'like',
        createdAt: new Date()
      };
      
      // console.log('🔍 About to insert like with data:', {
      //   postId: newLikeData.postId,
      //   userId: newLikeData.userId,
      //   reactionType: newLikeData.reactionType,
      //   userIdType: typeof newLikeData.userId,
      //   userIdLength: newLikeData.userId?.length
      // });

      const insertResult = await db
        .insert(postReactionsTable)
        .values(newLikeData)
        .returning({
          id: postReactionsTable.id,
          userId: postReactionsTable.userId,
          postId: postReactionsTable.postId
        });

      // console.log('🔍 Insert result:', insertResult);
      // console.log('🔍 Inserted like for userId:', userId);
      isLiked = true;
    }

    // Post-Count aktualisieren
    await db
    .update(postsTable)
    .set({
      likeCount: isLiked 
        ? sql`${postsTable.likeCount} + 1`
        : sql`${postsTable.likeCount} - 1`,
      updatedAt: new Date()
    })
    .where(eq(postsTable.id, postId));

    // Aktuellen Like-Count abrufen
    const actualLikeCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(postReactionsTable)
      .where(
        and(
          eq(postReactionsTable.postId, postId),
          eq(postReactionsTable.reactionType, 'like')
        )
      );
    
    newLikeCount = actualLikeCount[0]?.count || 0;

    // ZUSÄTZLICHE VERIFICATION
    // console.log('🔍 Verifying what was actually inserted...');
    const verifyLike = await db
      .select({
        id: postReactionsTable.id,
        postId: postReactionsTable.postId,
        userId: postReactionsTable.userId,
        reactionType: postReactionsTable.reactionType
      })
      .from(postReactionsTable)
      .where(
        and(
          eq(postReactionsTable.postId, postId),
          eq(postReactionsTable.reactionType, 'like')
        )
      )
      .orderBy(desc(postReactionsTable.createdAt))
      .limit(3);

    // console.log('🔍 Recent likes for this post:', verifyLike);

    return {
      success: true,
      data: {
        isLiked,
        likeCount: newLikeCount
      }
    };

  } catch (error) {
    console.error('Toggle like error:', error);
    throw new Error('Failed to toggle like');
  }
}

  // Comment zu Post hinzufügen
  static async addComment(postId: string, authorId: string, content: string, parentId?: string) {
    try {
      // Prüfe ob Post existiert
      const post = await db
        .select()
        .from(postsTable)
        .where(eq(postsTable.id, postId))
        .limit(1);

      if (post.length === 0) {
        throw new Error('Post not found');
      }

      // Comment erstellen
      const commentId = uuidv4();
      const now = new Date();

      await db
        .insert(commentsTable)
        .values({
          id: commentId,
          postId,
          authorId,
          parentId: parentId || null,
          content,
          likeCount: 0,
          replyCount: 0,
          isDeleted: false,
          isEdited: false,
          createdAt: now,
          updatedAt: now
        });

      // Comment-Count im Post erhöhen
      await db
        .update(postsTable)
        .set({
          commentCount: sql`${postsTable.commentCount} + 1`,
          updatedAt: now
        })
        .where(eq(postsTable.id, postId));

      // Wenn es eine Antwort ist, Reply-Count im Parent-Comment erhöhen
      if (parentId) {
        await db
          .update(commentsTable)
          .set({
            replyCount: sql`${commentsTable.replyCount} + 1`,
            updatedAt: now
          })
          .where(eq(commentsTable.id, parentId));
      }

      // Vollständigen Comment mit Author-Daten zurückgeben
      const newComment = await db
        .select({
          id: commentsTable.id,
          postId: commentsTable.postId,
          parentId: commentsTable.parentId,
          content: commentsTable.content,
          likeCount: commentsTable.likeCount,
          replyCount: commentsTable.replyCount,
          isEdited: commentsTable.isEdited,
          editedAt: commentsTable.editedAt,
          createdAt: commentsTable.createdAt,
          author: {
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName,
            avatarId: profilesTable.avatarId
          }
        })
        .from(commentsTable)
        .leftJoin(usersTable, eq(commentsTable.authorId, usersTable.id))
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(eq(commentsTable.id, commentId))
        .limit(1);

      return {
        success: true,
        comment: newComment[0]
      };

    } catch (error) {
      console.error('Add comment error:', error);
      throw new Error('Failed to add comment');
    }
  }

  // Comments für Post abrufen
  static async getPostComments(postId: string, userId: string, page: number = 1, limit: number = 20) {
    try {
      const offset = (page - 1) * limit;

      const comments = await db
        .select({
          id: commentsTable.id,
          postId: commentsTable.postId,
          parentId: commentsTable.parentId,
          content: commentsTable.content,
          likeCount: commentsTable.likeCount,
          replyCount: commentsTable.replyCount,
          isEdited: commentsTable.isEdited,
          editedAt: commentsTable.editedAt,
          createdAt: commentsTable.createdAt,
          author: {
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName,
            avatarId: profilesTable.avatarId
          },
          // Like-Status für aktuellen User
          isLikedByUser: sql<boolean>`CASE WHEN ${commentReactionsTable.id} IS NOT NULL THEN true ELSE false END`
        })
        .from(commentsTable)
        .leftJoin(usersTable, eq(commentsTable.authorId, usersTable.id))
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .leftJoin(
          commentReactionsTable,
          and(
            eq(commentReactionsTable.commentId, commentsTable.id),
            eq(commentReactionsTable.userId, userId),
            eq(commentReactionsTable.reactionType, 'like')
          )
        )
        .where(
          and(
            eq(commentsTable.postId, postId),
            eq(commentsTable.isDeleted, false),
            isNull(commentsTable.parentId) // Nur Top-Level Comments
          )
        )
        .orderBy(desc(commentsTable.createdAt))
        .offset(offset)
        .limit(limit);

      return {
        success: true,
        comments,
        pagination: {
          page,
          limit,
          hasMore: comments.length === limit
        }
      };

    } catch (error) {
      console.error('Get comments error:', error);
      throw new Error('Failed to get comments');
    }
  }

  // Like-Status für User prüfen
  static async getPostLikeStatus(postId: string, userId: string) {
    try {
      const like = await db
        .select()
        .from(postReactionsTable)
        .where(
          and(
            eq(postReactionsTable.postId, postId),
            eq(postReactionsTable.userId, userId),
            eq(postReactionsTable.reactionType, 'like')
          )
        )
        .limit(1);

      return {
        success: true,
        isLiked: like.length > 0
      };

    } catch (error) {
      console.error('Get like status error:', error);
      return {
        success: false,
        isLiked: false
      };
    }
  }

  // Erweitere bestehende getFeed-Methoden um Like-Status
  static async getPersonalFeedWithLikes(userId: string, page: number = 1, limit: number = 20, sortBy: string = 'newest') {
    try {
      const offset = (page - 1) * limit;

      const posts = await db
        .select({
          id: postsTable.id,
          title: postsTable.title,
          content: postsTable.content,
          contentType: postsTable.contentType,
          mediaIds: postsTable.mediaIds,
          hashtags: postsTable.hashtags,
          isPublic: postsTable.isPublic,
          likeCount: postsTable.likeCount,
          commentCount: postsTable.commentCount,
          shareCount: postsTable.shareCount,
          createdAt: postsTable.createdAt,
          updatedAt: postsTable.updatedAt,
          author: {
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName,
            profileImage: profilesTable.avatarId
          },
          universe: {
            id: universesTable.id,
            name: universesTable.name,
            slug: universesTable.slug
          },
          isLikedByUser: sql<boolean>`CASE WHEN ${postReactionsTable.id} IS NOT NULL THEN true ELSE false END`
        })
        .from(postsTable)
        .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .leftJoin(universesTable, eq(postsTable.universeId, universesTable.id))
        .leftJoin(universeMembersTable, eq(universesTable.id, universeMembersTable.universeId))
        .leftJoin(
          postReactionsTable,
          and(
            eq(postReactionsTable.postId, postsTable.id),
            eq(postReactionsTable.userId, userId),
            eq(postReactionsTable.reactionType, 'like')
          )
        )
        .where(
          and(
            eq(postsTable.isDeleted, false),
            eq(universeMembersTable.userId, userId)
          )
        )
        .orderBy(sortBy === 'newest' ? desc(postsTable.createdAt) : postsTable.createdAt)
        .offset(offset)
        .limit(limit);

      return {
        success: true,
        posts,
        pagination: {
          page,
          limit,
          hasMore: posts.length === limit
        }
      };

    } catch (error) {
      console.error('Get personal feed with likes error:', error);
      throw new Error('Failed to get personal feed');
    }
  }

  // Comment liken/unliken
  static async toggleCommentLike(commentId: string, userId: string) {
    try {
      // Prüfe ob Like bereits existiert
      const existingLike = await db
        .select()
        .from(commentReactionsTable)
        .where(
          and(
            eq(commentReactionsTable.commentId, commentId),
            eq(commentReactionsTable.userId, userId),
            eq(commentReactionsTable.reactionType, 'like')
          )
        )
        .limit(1);

      let isLiked = false;
      let newLikeCount = 0;

      if (existingLike.length > 0) {
        // Unlike: Like entfernen
        await db
          .delete(commentReactionsTable)
          .where(eq(commentReactionsTable.id, existingLike[0].id));

        // Like-Count verringern
        await db
          .update(commentsTable)
          .set({
            likeCount: sql`${commentsTable.likeCount} - 1`,
            updatedAt: new Date()
          })
          .where(eq(commentsTable.id, commentId));

        isLiked = false;
      } else {
        // Like: Neuen Like hinzufügen
        await db
          .insert(commentReactionsTable)
          .values({
            id: uuidv4(),
            commentId,
            userId,
            reactionType: 'like',
            createdAt: new Date()
          });

        // Like-Count erhöhen
        await db
          .update(commentsTable)
          .set({
            likeCount: sql`${commentsTable.likeCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(commentsTable.id, commentId));

        isLiked = true;
      }

      // Aktuellen Like-Count abrufen
      const updatedComment = await db
        .select({ likeCount: commentsTable.likeCount })
        .from(commentsTable)
        .where(eq(commentsTable.id, commentId))
        .limit(1);

      newLikeCount = updatedComment[0]?.likeCount || 0;

      return {
        success: true,
        isLiked,
        likeCount: newLikeCount
      };

    } catch (error) {
      console.error('Toggle comment like error:', error);
      throw new Error('Failed to toggle comment like');
    }
  }

  // Reply zu Comment hinzufügen
  static async addCommentReply(postId: string, parentCommentId: string, authorId: string, content: string) {
    try {
      // Prüfe ob Parent-Comment existiert
      const parentComment = await db
        .select()
        .from(commentsTable)
        .where(eq(commentsTable.id, parentCommentId))
        .limit(1);

      if (parentComment.length === 0) {
        throw new Error('Parent comment not found');
      }

      // Reply erstellen
      const replyId = uuidv4();
      const now = new Date();

      await db
        .insert(commentsTable)
        .values({
          id: replyId,
          postId,
          authorId,
          parentId: parentCommentId,
          content,
          likeCount: 0,
          replyCount: 0,
          isDeleted: false,
          isEdited: false,
          createdAt: now,
          updatedAt: now
        });

      // Reply-Count im Parent-Comment erhöhen
      await db
        .update(commentsTable)
        .set({
          replyCount: sql`${commentsTable.replyCount} + 1`,
          updatedAt: now
        })
        .where(eq(commentsTable.id, parentCommentId));

      // Comment-Count im Post erhöhen
      await db
        .update(postsTable)
        .set({
          commentCount: sql`${postsTable.commentCount} + 1`,
          updatedAt: now
        })
        .where(eq(postsTable.id, postId));

      // Vollständigen Reply mit Author-Daten zurückgeben
      const newReply = await db
        .select({
          id: commentsTable.id,
          postId: commentsTable.postId,
          parentId: commentsTable.parentId,
          content: commentsTable.content,
          likeCount: commentsTable.likeCount,
          replyCount: commentsTable.replyCount,
          isEdited: commentsTable.isEdited,
          editedAt: commentsTable.editedAt,
          createdAt: commentsTable.createdAt,
          author: {
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName,
            avatarId: profilesTable.avatarId
          }
        })
        .from(commentsTable)
        .leftJoin(usersTable, eq(commentsTable.authorId, usersTable.id))
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(eq(commentsTable.id, replyId))
        .limit(1);

      return {
        success: true,
        reply: newReply[0]
      };

    } catch (error) {
      console.error('Add comment reply error:', error);
      throw new Error('Failed to add comment reply');
    }
  }

  // Replies für Comment abrufen
  static async getCommentReplies(commentId: string, page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;

      const replies = await db
        .select({
          id: commentsTable.id,
          postId: commentsTable.postId,
          parentId: commentsTable.parentId,
          content: commentsTable.content,
          likeCount: commentsTable.likeCount,
          replyCount: commentsTable.replyCount,
          isEdited: commentsTable.isEdited,
          editedAt: commentsTable.editedAt,
          createdAt: commentsTable.createdAt,
          author: {
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName,
            avatarId: profilesTable.avatarId
          }
        })
        .from(commentsTable)
        .leftJoin(usersTable, eq(commentsTable.authorId, usersTable.id))
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(
          and(
            eq(commentsTable.parentId, commentId),
            eq(commentsTable.isDeleted, false)
          )
        )
        .orderBy(asc(commentsTable.createdAt))
        .offset(offset)
        .limit(limit);

      return {
        success: true,
        replies,
        pagination: {
          page,
          limit,
          hasMore: replies.length === limit
        }
      };

    } catch (error) {
      console.error('Get comment replies error:', error);
      throw new Error('Failed to get comment replies');
    }
  }
  
  // Post Share tracken
  static async trackShare(postId: string, userId: string | null, shareType: string, metadata?: any) {
    try {
      // Share-Entry erstellen
      await db
        .insert(postSharesTable)
        .values({
          id: uuidv4(),
          postId,
          userId,
          shareType,
          metadata: metadata || null,
          createdAt: new Date()
        });

      // Share-Count im Post erhöhen
      await db
        .update(postsTable)
        .set({
          shareCount: sql`${postsTable.shareCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(postsTable.id, postId));

      // Aktuellen Share-Count abrufen
      const updatedPost = await db
        .select({ shareCount: postsTable.shareCount })
        .from(postsTable)
        .where(eq(postsTable.id, postId))
        .limit(1);

      return {
        success: true,
        shareCount: updatedPost[0]?.shareCount || 0,
        shareType
      };

    } catch (error) {
      console.error('Track share error:', error);
      throw new Error('Failed to track share');
    }
  }

  // Share Statistics abrufen
  static async getShareStatistics(postId: string) {
    try {
      const shares = await db
        .select({
          shareType: postSharesTable.shareType,
          count: sql<number>`count(*)`.as('count')
        })
        .from(postSharesTable)
        .where(eq(postSharesTable.postId, postId))
        .groupBy(postSharesTable.shareType);

      const totalShares = await db
        .select({ 
          total: sql<number>`count(*)`.as('total') 
        })
        .from(postSharesTable)
        .where(eq(postSharesTable.postId, postId));

      return {
        success: true,
        totalShares: totalShares[0]?.total || 0,
        sharesByType: shares.reduce((acc, share) => {
          acc[share.shareType] = share.count;
          return acc;
        }, {} as Record<string, number>)
      };

    } catch (error) {
      console.error('Get share statistics error:', error);
      throw new Error('Failed to get share statistics');
    }
  }

  // Trending Shares abrufen
  static async getTrendingShares(timeframe = '24h', limit = 20) {
    try {
      const timeCondition = timeframe === '24h' 
        ? sql`${postSharesTable.createdAt} >= NOW() - INTERVAL '24 hours'`
        : sql`${postSharesTable.createdAt} >= NOW() - INTERVAL '7 days'`;

      const trendingPosts = await db
        .select({
          postId: postSharesTable.postId,
          shareCount: sql<number>`count(*)`.as('shareCount'),
          post: {
            id: postsTable.id,
            title: postsTable.title,
            content: postsTable.content,
            likeCount: postsTable.likeCount,
            commentCount: postsTable.commentCount,
            shareCount: postsTable.shareCount
          },
          author: {
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName
          },
          universe: {
            id: universesTable.id,
            name: universesTable.name,
            slug: universesTable.slug
          }
        })
        .from(postSharesTable)
        .leftJoin(postsTable, eq(postSharesTable.postId, postsTable.id))
        .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
        .leftJoin(universesTable, eq(postsTable.universeId, universesTable.id))
        .where(
          and(
            timeCondition,
            eq(postsTable.isDeleted, false),
            eq(postsTable.isPublic, true)
          )
        )
        .groupBy(
          postSharesTable.postId,
          postsTable.id,
          usersTable.id,
          universesTable.id
        )
        .orderBy(sql`count(*) DESC`)
        .limit(limit);

      return {
        success: true,
        posts: trendingPosts
      };

    } catch (error) {
      console.error('Get trending shares error:', error);
      throw new Error('Failed to get trending shares');
    }
  }
}