const { response } = require('express');
const { request } = require('../../app');
const queryRunner = require('../db/QueryRunner');
var queryBuilder = require("querybuilder");
const SQLConnect = require('../db/MySqlConnect');
var Process = require('../db/QueryGeneratorandExecutor');
const Entity = require('../api/Entity');

function DefaultEntityHandler(){
    this.APIRequest = null;
    this.convertTOJSON = function(APIRequest){
        if(APIRequest.dataObject instanceof Array){
            APIRequest.result =[];
            for(var i=0;i<APIRequest.dataObject.length;i++){
                APIRequest.result.push(this.iterateFieldsAndGetResult(APIRequest.entity,{},APIRequest,APIRequest.dataObject[i]));
            }
        }else{  
            APIRequest.result = this.iterateFieldsAndGetResult(APIRequest.entity,{},APIRequest);
        }
    }
    this.iterateFieldsAndGetResult = function(entity,entityResult,APIRequest,dataObject){
        var fields = entity.getFields();
        Object.keys(fields).forEach((field)=>{
            if(fields[field].refEntity){
                entityResult[fields[field].refEntity] = this.iterateFieldsAndGetResult(Entity.getEntityByName(fields[field].refEntity),{},APIRequest,dataObject);
            }else{
                entityResult[fields[field].name]= this.getValueFromRelationMapping((dataObject)?dataObject:APIRequest.dataObject,fields[field].relationMapping);
            }
        });
        return entityResult;
    }
    this.getValueFromRelationMapping = function(dataObject,mapping){
        var mappings = mapping.split('.');
        return dataObject[mappings[0]][mappings[1]];
    }

    this.getInputValuesFromInputData = function(qb){
        var form_data = this.APIRequest.inputData;
        var key_value = {};
        var fields = this.APIRequest.entity.getFields();
        Object.keys(fields).forEach((field,index) => {
        if(fields[field].is_identifier){
            return;
        }
        if(form_data[fields[field].name]){
            key_value[this.getColumnNameFromRelationalMapping(fields[field].relationMapping)]=form_data[fields[field].name];
        }
        });
        return key_value;
    }

    this.getColumnNameFromRelationalMapping = function(mapping){
        return mapping.split('.')[1];
    }

    this.getTablename = function(request){
        return request.entity.getTableName();
    }
    
    this.executeResult = function (APIRequest,err){
        var APIResult = {};
        var result = APIRequest.result;
        if (!err) {
            APIResult[APIRequest.entity.getName()] = result;
            APIResult["status"]=2000;
        } else {
            APIResult["error"]=err;
        }
        APIRequest.result = APIResult;
    }

}
DefaultEntityHandler.prototype.get = function(APIRequest){
    // return queryRunner.get(APIRequest,{});
    SQLConnect.runBuilder((qb) => {
        APIRequest.queryObject = qb;
        new Process(APIRequest).get();
        this.APIRequest.queryObject.get((err,result) => {
            this.APIRequest.queryObject.release();
            this.APIRequest.dataObject = result[0];
            this.convertTOJSON(this.APIRequest);
            this.executeResult(this.APIRequest);
            this.APIRequest.response.send(this.APIRequest.result);
        });
    });
}
DefaultEntityHandler.prototype.getList = function(APIRequest){
    SQLConnect.runBuilder((qb) => {
        APIRequest.queryObject = qb;
        new Process(APIRequest).getList();
        this.APIRequest.queryObject.get((err,result) => {
            this.APIRequest.queryObject.release();
            this.APIRequest.dataObject = result;
            this.convertTOJSON(this.APIRequest);
            this.executeResult(this.APIRequest);
            this.APIRequest.response.send(this.APIRequest.result);
        });
    });
}
DefaultEntityHandler.prototype.post = function(APIRequest){
    SQLConnect.runBuilder(async qb =>{
        var results = await qb.insert(this.getTablename(APIRequest),this.getInputValuesFromInputData(qb));
        APIRequest.entityId=results.insert_id;
        this.get(APIRequest);
        qb.release();
    });
}
DefaultEntityHandler.prototype.delete = function(APIRequest){
    SQLConnect.runBuilder(async qb =>{
        var results={};
        if(APIRequest.entityId){
            new Process(APIRequest).setCriteriaForQuery(qb,APIRequest);
            results = await qb.delete(APIRequest.entity.getTableName());
        }
        qb.release();
        this.APIRequest.result=results;
        this.executeResult(this.APIRequest);
        this.APIRequest.response.send(this.APIRequest.result);
    });
}
DefaultEntityHandler.prototype.update = function(APIRequest){
    SQLConnect.runBuilder((qb) => {
        APIRequest.queryObject = qb;
        // new Process(APIRequest).getList();
        qb.update(this.getTablename(APIRequest),this.getInputValuesFromInputData(qb),{id:APIRequest.entityId},(err,res)=>{
            if(res.affectedRows){
                this.get(APIRequest);
            }else{
                res.send({status:4000,message:"now rows edited"});
            }
        });
    });
}

async function getEntityFromId(qb,results,request){
    var values = {};
    values[getIdentifierColumnForEntity(request)]=results.insert_id;
    results = await qb.get_where(getTablename(request),values);
    return results;
}





DefaultEntityHandler.prototype.handleAPICall = function(APIRequest){
    this.APIRequest = APIRequest;
    var method = APIRequest.operation;
    if(method == 'GET'){
        if(APIRequest.entityId == null){
            this.getList(APIRequest);
        }else{
            this.get(APIRequest);
        }
    }
    else if(method == 'PUT'){
        this.update(APIRequest);
    }
    else if(method == 'POST'){
        this.post(APIRequest);
    }
    else if(method == 'DELETE'){
        this.delete(APIRequest);
    }
}


module.exports = DefaultEntityHandler;