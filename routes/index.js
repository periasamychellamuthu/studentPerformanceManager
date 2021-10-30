
'use strict'

const { request } = require('../app');
var utils = require('../models/tools/utils');
//listen for API requests
exports.assignRoutes = function (app) {


  //hook for global functionalities
  app.all("*",function(request,response,next){
    next();
  });
  
  //include users module
  if (utils.isUsersModuleActive()) {
    var userRoutes = require('../models/api/user_routes');
    userRoutes.loadRoutes(app);
    var studentRoutes = require('../models/api/student_routes');
    studentRoutes .loadRoutes(app);
  }

}