const express = require('express');
const router = express.Router();
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');


router.get('/', viewsController.getOverview);
router.get('/login', viewsController.getLoginForm);

router.use(authController.isLoggedIn);
router.get('/tour/:slug', viewsController.getTour);


module.exports = router;
