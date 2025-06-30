import { Request, Response } from 'express';
import { PostService } from '../services/postService';
import { validationResult } from 'express-validator';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
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

// Post liken
export const likePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user!.id;

    const result = await PostService.toggleLike(postId, userId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Post like toggled successfully'
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to toggle like' 
    });
  }
};