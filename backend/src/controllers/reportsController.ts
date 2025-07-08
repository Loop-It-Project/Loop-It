import { Request, Response } from 'express';
import { ReportService } from '../services/reportService';
import { body, param, query, validationResult } from 'express-validator';

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

// Post melden
export const reportPost = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
    return;
  }

  try {
    const { postId } = req.params;
    const { reason, description } = req.body;
    const reporterId = req.user!.id;

    const result = await ReportService.createReport({
      reporterId,
      reportedContentType: 'post',
      reportedContentId: postId,
      reason,
      description
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Post reported successfully'
    });

  } catch (error) {
    console.error('Report post error:', error);
    const message = error instanceof Error ? error.message : 'Failed to report post';
    res.status(400).json({ 
      success: false, 
      error: message 
    });
  }
};

// Report verarbeiten (Admin only)
export const processReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
    return;
  }

  try {
    const { reportId } = req.params;
    const adminId = req.user!.id;
    const actionData = req.body;

    const result = await ReportService.processReport(reportId, adminId, actionData);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Report processed successfully'
    });

  } catch (error) {
    console.error('Process report error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process report';
    res.status(400).json({ 
      success: false, 
      error: message 
    });
  }
};

// Reports abrufen (Admin only)
export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
    return;
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string || 'pending';

    const result = await ReportService.getReports(page, limit, status);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get reports error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get reports';
    res.status(500).json({ 
      success: false, 
      error: message 
    });
  }
};

// Validation rules
export const reportPostValidation = [
  param('postId').isUUID().withMessage('Valid post ID is required'),
  body('reason')
    .isIn(['spam', 'harassment', 'hate_speech', 'inappropriate_content', 'copyright', 'misinformation', 'other'])
    .withMessage('Valid reason is required'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
];

export const processReportValidation = [
  param('reportId').isUUID().withMessage('Valid report ID is required'),
  body('action')
    .isIn(['dismiss', 'resolve', 'escalate'])
    .withMessage('Valid action is required'),
  body('resolution')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Resolution must not exceed 1000 characters'),
  body('contentAction')
    .optional()
    .isIn(['none', 'hide', 'delete'])
    .withMessage('Valid content action is required'),
  body('userAction')
    .optional()
    .isIn(['none', 'warning', 'timeout', 'ban'])
    .withMessage('Valid user action is required'),
  body('timeoutDuration')
    .optional()
    .isInt({ min: 1, max: 8760 })
    .withMessage('Timeout duration must be between 1 and 8760 hours')
];

export const getReportsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'resolved', 'dismissed'])
    .withMessage('Valid status is required')
];