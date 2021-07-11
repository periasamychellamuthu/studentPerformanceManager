
'use strict'

var utils = require('../models/tools/utils');
//listen for API requests
exports.assignRoutes = function (app) {
  
  //include users module
  if (utils.isUsersModuleActive()) {
    var userRoutes = require('../models/api/user_routes');
    userRoutes.loadRoutes(app);
  }

}
