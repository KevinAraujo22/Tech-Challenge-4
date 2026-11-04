import { Router } from 'express';
import { makePeopleController, teachersController, studentsController } from '../controllers/peopleController';
import { requireTeacher } from '../middleware/auth';

// Todas as rotas administrativas de pessoas exigem um professor autenticado.
function peopleRouter(controller: ReturnType<typeof makePeopleController>) {
  const router = Router();
  router.use(requireTeacher);
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}

export const teacherRoutes = peopleRouter(teachersController);
export const studentRoutes = peopleRouter(studentsController);
