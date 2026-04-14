import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { 
  createForm, 
  getForms, 
  getForm, 
  updateForm, 
  deleteForm, 
  getPublicForm, 
  submitResponse, 
  getFormResponses,
  getAllForms
} from "../controllers/formsController.js";

const router = express.Router();

router.post('/', protect, createForm);
router.get('/', protect, getForms);
router.get('/all', getAllForms);
router.get('/public/:slug', getPublicForm);
router.get('/:id', protect, getForm);
router.put('/:id', protect, updateForm);
router.delete('/:id', protect, deleteForm);
router.post('/:id/responses', submitResponse);
router.get('/:id/responses', protect, getFormResponses);

export default router;