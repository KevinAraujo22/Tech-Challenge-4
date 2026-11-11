import { Router } from 'express';
import { makePeopleController, teachersController, studentsController } from '../controllers/peopleController';
import { requireAdmin, requireAdminOrSelf, requireTeacher } from '../middleware/auth';

type Controller = ReturnType<typeof makePeopleController>;

// Alunos: qualquer professor autenticado gerencia.
function studentRouter(controller: Controller) {
  const router = Router();
  router.use(requireTeacher);
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}

// Professores: todos os professores veem a lista, mas só o administrador cria,
// edita e exclui outros professores. Cada professor pode editar a própria conta.
function teacherRouter(controller: Controller) {
  const router = Router();
  router.use(requireTeacher);
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.post('/', requireAdmin, controller.create);
  router.put('/:id', requireAdminOrSelf, controller.update);
  router.delete('/:id', requireAdmin, controller.remove);
  return router;
}

export const teacherRoutes = teacherRouter(teachersController);
export const studentRoutes = studentRouter(studentsController);
