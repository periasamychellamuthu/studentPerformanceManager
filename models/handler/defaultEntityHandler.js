const queryRunner = require('../db/QueryRunner');
function DefaultEntityHandler(){
}
DefaultEntityHandler.prototype.get = function(request,response){
    return queryRunner.handlerQuery(request,response,{});
}
DefaultEntityHandler.prototype.add = function(){
    return "default entity Handler add called"
}
DefaultEntityHandler.prototype.delete = function(){
    return "default entity Handler delete called"
}
DefaultEntityHandler.prototype.update = function(){
    return "default entity Handler edit called"
}

DefaultEntityHandler.prototype.handleAPICall = function(req,res){
    this.get(req,res);
}


module.exports = DefaultEntityHandler;