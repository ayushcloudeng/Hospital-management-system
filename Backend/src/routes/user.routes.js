const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.route('/').get(protect, getUsers);

router
    .route('/:id')
    .get(protect, getUserById)
    .put(protect, authorize('admin'), updateUser)
    .delete(protect, authorize('admin'), deleteUser);

module.exports = router;
