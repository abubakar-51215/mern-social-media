import express from 'express';
import { protect } from '../middleware/auth.js';
import { upload, handleUploadError } from '../middleware/upload.js';
import {
  createStory,
  getStories,
  getMyStories,
  viewStory,
  addReaction,
  replyToStory,
  deleteStory,
  getStoryViews,
  answerQuestion,
  votePoll,
  getQuestionAnswers
} from '../controllers/storyController.js';

const router = express.Router();

// @route   POST /api/stories
// @desc    Create a new story
// @access  Private
router.post('/', protect, upload.single('media'), handleUploadError, createStory);

// @route   GET /api/stories
// @desc    Get all active stories from friends
// @access  Private
router.get('/', protect, getStories);

// @route   GET /api/stories/my
// @desc    Get user's own stories
// @access  Private
router.get('/my', protect, getMyStories);

// @route   PUT /api/stories/:storyId/view
// @desc    Mark story as viewed
// @access  Private
router.put('/:storyId/view', protect, viewStory);

// @route   POST /api/stories/:storyId/reaction
// @desc    Add reaction to story
// @access  Private
router.post('/:storyId/reaction', protect, addReaction);

// @route   POST /api/stories/:storyId/reply
// @desc    Reply to story
// @access  Private
router.post('/:storyId/reply', protect, replyToStory);

// @route   DELETE /api/stories/:storyId
// @desc    Delete story
// @access  Private
router.delete('/:storyId', protect, deleteStory);

// @route   GET /api/stories/:storyId/views
// @desc    Get story views (for story owner)
// @access  Private
router.get('/:storyId/views', protect, getStoryViews);

// @route   POST /api/stories/:storyId/answer
// @desc    Answer a Q&A story question
// @access  Private
router.post('/:storyId/answer', protect, answerQuestion);

// @route   POST /api/stories/:storyId/vote
// @desc    Vote on a poll story
// @access  Private
router.post('/:storyId/vote', protect, votePoll);

// @route   GET /api/stories/:storyId/answers
// @desc    Get all answers to a Q&A story (for story owner)
// @access  Private
router.get('/:storyId/answers', protect, getQuestionAnswers);

export default router;
