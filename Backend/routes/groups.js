import express from "express";
import { protect } from "../middleware/auth.js";
import { upload, handleUploadError } from "../middleware/upload.js";
import {
  createGroup,
  getGroups,
  getGroup,
  getGroupMessages,
  sendGroupMessage,
  updateGroup,
  updateGroupAvatar,
  updateGroupSettings,
  addMembers,
  removeMember,
  leaveGroup,
  makeAdmin,
  removeAdmin,
  deleteGroup
} from "../controllers/groupController.js";

const router = express.Router();

// Group CRUD operations
router.post("/", protect, createGroup);
router.get("/", protect, getGroups);
router.get("/:groupId", protect, getGroup);
router.put("/:groupId", protect, updateGroup);
router.delete("/:groupId", protect, deleteGroup);

// Group avatar
router.post("/:groupId/avatar", protect, upload.single('avatar'), handleUploadError, updateGroupAvatar);

// Group settings
router.put("/:groupId/settings", protect, updateGroupSettings);

// Group messages
router.get("/:groupId/messages", protect, getGroupMessages);
router.post("/:groupId/messages", protect, sendGroupMessage);

// Member management
router.post("/:groupId/members", protect, addMembers);
router.delete("/:groupId/members/:memberId", protect, removeMember);
router.post("/:groupId/leave", protect, leaveGroup);

// Admin management
router.post("/:groupId/admins/:memberId", protect, makeAdmin);
router.delete("/:groupId/admins/:memberId", protect, removeAdmin);

export default router;
