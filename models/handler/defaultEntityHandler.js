const { response } = require('express');
const { request } = require('../../app');
const queryRunner = require('../db/QueryRunner');
function DefaultEntityHandler(){
}
DefaultEntityHandler.prototype.get = function(request,response){
    return queryRunner.get(request,response,{});
}
DefaultEntityHandler.prototype.getList = function(request,response){
    return queryRunner.getList(request,response,{});
}
DefaultEntityHandler.prototype.post = function(request,response){
    return queryRunner.add(request,response,{});
}
DefaultEntityHandler.prototype.delete = function(request,response){
    return queryRunner.delete(request,response,{});
}
DefaultEntityHandler.prototype.update = function(request,response){
    return queryRunner.update(request,response,{});
}

DefaultEntityHandler.prototype.handleAPICall = function(req,res){
    if(req.method == 'GET'){
        if(req.entityId == null){
            this.getList(req,res);
        }else{
            this.get(req,res);
        }
    }
    else if(req.method == 'PUT'){
        this.update(req,res);
    }
    else if(req.method == 'POST'){
        this.post(req,res);
    }
    else if(req.method == 'DELETE'){
        this.delete(req,res);
    }
}


module.exports = DefaultEntityHandler;