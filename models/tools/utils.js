var config = require('../../config.json');
var passport = require('passport');
var jwt = require('jsonwebtoken');

exports.isUsersModuleActive = function() {
    // if users module or any of its dependent modules are active, it has to be loaded
    return (config.MODULES.USERS || config.MODULES.AUTH);
};


// Implements a simple algorithm in order to offer a default authentication
// for some api methods
exports.defaultAuthentication = function () {
    var defaultAuthentication = null;
    if (config.JWT_STRATEGY) {
        defaultAuthentication = 'jwt';
    } else if (config.BASIC_AUTH_STRATEGY) {
        defaultAuthentication = 'local';
    } 

    var callback = passport.authenticate(defaultAuthentication);
    return callback;
};

exports.createFolder = function(foldername) {
    mkdirp(foldername, function (err) {
        if (err) {
            logger.error(err);
        }
        else {
            logger.info("The folder: " + foldername + " was created");
        }
    });
};

// Generate a new JWT with user info and expire time
exports.createJWT = function(user) {
    var token = jwt.sign(user, config.secret, { expiresIn: config.TOKEN_TIME });
    return token;
};

//Make sure password is strong enough
exports.checkPwdStrength = function(str) {
    if (str.length < 6) {
        return "PASSWORD_AT_LEAST_6_CHARACTERS_LONG";
    } else if (str.search(/\d/) === -1) {
        return "PASSWORD_AT_LEAST_ONE_NUMBER";
    } else if (str.search(/[a-zA-Z]/) === -1) {
        return "PASSWORD_AT_LEAST_ONE_LETTER";
    } else if (str.search(/[^a-zA-Z0-9]/) !== -1) {
        return "PASSWORD_ONLY_CONTAIN_NUMBERS_AND_LETTERS";
    }
    return null;
};

exports.validatePermission = function (permission) {
    return function (req, res, next) {
        // check if the user has the permission
        if (req.user) {
            var role = req.user.role;
            var permissions = permsRoles.getPermissionsOfRole(role);
            if (permissions && permissions.indexOf(permission) >= 0) {
                // permissions are ok, then allow
                return next();
            }
        }

        // missing needed permissions, then 401
        // Add foo realm just so android can read 401 data
        res.setHeader('WWW-Authenticate', 'Basic realm="FOOREALM"');
        res.status(401).send({'message': 'Unauthorized'});
    };
};

exports.getHandlerInstance = function(request,response,entity){
    var entityJsons = require('../entityJSON/EntityJSON.json')
   if(entity && entity.name){
        request.entity = entityJsons[entity.name];
        const handler =  require('../handler/'+request.entity.handlers);
        var entityHandler = new handler();
        entityHandler.handleAPICall(request,response);
   }else{
        request.entity = null;
   }
}