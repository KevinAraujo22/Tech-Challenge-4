import { Router } from 'express';
import {
  listPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  searchPosts,
  listComments,
  createComment,
  deleteComment,
} from '../controllers/postController';
import { requireAuth, requireTeacher } from '../middleware/auth';

const router = Router();

router.get('/search', searchPosts);
router.get('/', listPosts);
router.get('/:id', getPostById);
router.post('/', requireTeacher, createPost);
router.put('/:id', requireTeacher, updatePost);
router.delete('/:id', requireTeacher, deletePost);

router.get('/:id/comments', listComments);
router.post('/:id/comments', requireAuth, createComment);
router.delete('/:id/comments/:commentId', requireAuth, deleteComment);

export default router;
