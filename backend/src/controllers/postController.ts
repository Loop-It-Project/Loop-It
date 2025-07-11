import { Request, Response } from 'express';
import { PostService } from '../services/postService';
import { validationResult } from 'express-validator';

interface AuthRequest extends Request {
  user?: { 
    id: string; 
    username: string; 
    email: string 
  };
}

// Post erstellen
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
    return;
  }

  try {
    const userId = req.user!.id;
    const postData = {
      ...req.body,
      authorId: userId
    };

    const result = await PostService.createPost(postData);
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Post created successfully'
    });
  } catch (error) {
    console.error('Create post error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create post';
    res.status(500).json({ 
      success: false, 
      error: message 
    });
  }
};

// Post löschen
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user!.id;

    await PostService.deletePost(postId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete post' 
    });
  }
};

// Post liken/unliken
export const togglePostLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    // console.log('🔍 PostController.togglePostLike:', { 
    //   postId, 
    //   userId,
    //   userFromToken: req.user 
    // });

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    if (!postId) {
      res.status(400).json({ success: false, error: 'Post ID is required' });
      return;
    }

    const result = await PostService.toggleLike(postId, userId);
    
    // console.log('🔍 PostController result:', result);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Toggle post like error:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle like' });
  }
};

// Comment hinzufügen
export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  // console.log('🔄 Add comment request:', {
  //   params: req.params,
  //   body: req.body,
  //   user: req.user?.id
  // }); 

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array()); 
    res.status(400).json({ 
      success: false,
      errors: errors.array(),
      message: 'Validation failed'
    });
    return;
  }

  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user!.id;

    // console.log('✅ Validation passed:', { postId, content, parentId, userId });

    const result = await PostService.addComment(postId, userId, content, parentId);
    
    // console.log('✅ Comment created:', result);
    
    res.status(201).json({
      success: true,
      data: result.comment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    const message = error instanceof Error ? error.message : 'Failed to add comment';
    res.status(500).json({ 
      success: false, 
      error: message 
    });
  }
};

// Comments abrufen
export const getPostComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user!.id; // ✅ User ID für Like-Status
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await PostService.getPostComments(postId, userId, page, limit);
    
    res.status(200).json({
      success: true,
      data: result.comments,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get comments error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get comments';
    res.status(500).json({ 
      success: false, 
      error: message 
    });
  }
};

// Like-Status prüfen
export const getPostLikeStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user!.id;

    const result = await PostService.getPostLikeStatus(postId, userId);
    
    res.status(200).json({
      success: true,
      data: { isLiked: result.isLiked }
    });
  } catch (error) {
    console.error('Get like status error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get like status'
    });
  }
};

// Comment liken/unliken
export const toggleCommentLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = req.user!.id;
  
    // console.log('🔄 Toggle comment like request:', { commentId, userId });
  
    const result = await PostService.toggleCommentLike(commentId, userId);
    
    // console.log('✅ Toggle comment like result:', result);
  
    res.status(200).json({
      success: true,
      data: result,
      message: result.isLiked ? 'Comment liked successfully' : 'Comment unliked successfully'
    });
  } catch (error) {
    console.error('Toggle comment like error:', error);
    const message = error instanceof Error ? error.message : 'Failed to toggle comment like';
    res.status(500).json({ 
      success: false, 
      error: message 
    });
  }
};

// Reply zu Comment hinzufügen
export const addCommentReply = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false,
      errors: errors.array(),
      message: 'Validation failed'
    });
    return;
  }

  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    // console.log('🔄 Add comment reply request:', { postId, commentId, content, userId });

    const result = await PostService.addCommentReply(postId, commentId, userId, content);
    
    // console.log('✅ Comment reply created:', result);
    
    res.status(201).json({
      success: true,
      data: result.reply,
      message: 'Reply added successfully'
    });
  } catch (error) {
    console.error('Add comment reply error:', error);
    const message = error instanceof Error ? error.message : 'Failed to add reply';
    res.status(500).json({ 
      success: false, 
      error: message 
    });
  }
};

// Replies für Comment abrufen
export const getCommentReplies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await PostService.getCommentReplies(commentId, page, limit);
    
    res.status(200).json({
      success: true,
      data: result.replies,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get comment replies error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get replies';
    res.status(500).json({ 
      success: false, 
      error: message 
    });
  }
};

// Post Share tracken
export const sharePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const { shareType, metadata } = req.body;
    const userId = req.user?.id || null; // Optional für anonyme Shares

    // console.log('🔄 Share post request:', { postId, shareType, userId });

    // Validiere shareType
    const validShareTypes = ['internal', 'facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram', 'copy_link', 'email', 'native'];
    if (!validShareTypes.includes(shareType)) {
      res.status(400).json({
        success: false,
        error: 'Invalid share type'
      });
      return;
    }

    const result = await PostService.trackShare(postId, userId, shareType, metadata);
    
    // console.log('✅ Post shared successfully:', result);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Post shared successfully'
    });
  } catch (error) {
    console.error('Share post error:', error);
    const message = error instanceof Error ? error.message : 'Failed to share post';
    res.status(500).json({ 
      success: false, 
      error: message 
    });
  }
};

// Share Statistics abrufen
export const getShareStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;

    const result = await PostService.getShareStatistics(postId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Share statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Get share statistics error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get share statistics';
    res.status(500).json({ 
      success: false, 
      error: message 
    });
  }
};

// Trending Shares abrufen
export const getTrendingShares = async (req: Request, res: Response): Promise<void> => {
  try {
    const timeframe = req.query.timeframe as string || '24h';
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await PostService.getTrendingShares(timeframe, limit);
    
    res.status(200).json({
      success: true,
      data: result.posts,
      message: 'Trending shares retrieved successfully'
    });
  } catch (error) {
    console.error('Get trending shares error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get trending shares';
    res.status(500).json({ 
      success: false, 
      error: message 
    });
  }
};