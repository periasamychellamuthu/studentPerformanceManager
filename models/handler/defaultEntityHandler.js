const { response } = require('express');
const { request } = require('../../app');
const queryRunner = require('../db/QueryRunner');
var queryBuilder = require("querybuilder");
const SQLConnect = require('../db/MySqlConnect');
const sqlQueryBuilder = require('../db/QueryGeneratorandExecutor');
const Entity = require('../api/Entity');

function DefaultEntityHandler(){
    this.APIRequest = null;
    this.entity = null;
    this.queryBuilder = sqlQueryBuilder;

    this.convertTOJSON = function(APIRequest){
        if(APIRequest.dataObject instanceof Array){
            APIRequest.result =[];
            for(var i=0;i<APIRequest.dataObject.length;i++){
                APIRequest.result.push(iterateFieldsAndGetResult(APIRequest.entity,{},APIRequest,APIRequest.dataObject[i]));
            }
        }else{  
            APIRequest.result = iterateFieldsAndGetResult(APIRequest.entity,{},APIRequest);
        }
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
            key_value[getColumnNameFromRelationalMapping(fields[field].relationMapping)]=form_data[fields[field].name];
        }
        });
        return key_value;
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

    this.getSelectQueryWithoutSelectColumns = function(){
        var IdentifierField = this.entity.getIdentifierField();
        this.queryBuilder.addFromTableInQuery({query:this.APIRequest.queryObject,table:this.entity.getTableName()});
        this.joinAllTablesOfEntity();
    }

    this.addTableAndCriteriaBasedOnNavigationInfo = function(){
        this.NavigationInfo = this.APIRequest.navigationInfo;
        if(this.NavigationInfo){
            var parentEntity=this.NavigationInfo.getParentEntity();
            this.queryBuilder.join(Object.assign(applyParentCriteria(this.entity,parentEntity,null,parentEntity.getId()),{query:this.APIRequest.queryObject}));
        }
    }

    this.addEntityIntoQuery = function(options){
        var entity = (options && options.entity)?options.entity:this.entity;
        if(!(options && options.isFromNavigationInfo)){
            this.queryBuilder.addFromTableInQuery({query:this.APIRequest.queryObject,table:entity.getTableName()});
        }
        var IdentifierField = entity.getIdentifierField();
        var tableName = IdentifierField.getTableName();
        var columnName = IdentifierField.getColumnName();
        var criteria ={};
        if(entity.getId()){
            criteria[tableName+'.'+columnName]=entity.getId();
        }
        this.joinAllTablesOfEntity({entity:entity});
        if(Object.keys(criteria).length){
            // this.APIRequest.queryObject.where(criteria);
            this.queryBuilder.setCriteria({query:this.APIRequest.queryObject,criteria:criteria});
        }
    }

    this.addEntityIdCriteriaIntoQuery = function(options){
        var criteria = getEntityIdCriteria(this.entity,this.entity.getId());
        if(criteria != null){
            this.queryBuilder.setCriteria({query:this.APIRequest.queryObject,criteria:criteria});
        }
    }

    this.joinAllTablesOfEntity = function(options){
        var joinCriteria = null;
        var entity=(options && options.entity)?options.entity:this.entity;
        Object.keys(entity.tablesForGetOperation).forEach((element,index) => {
            joinCriteria = entity.tablesForGetOperation[element];
            if(joinCriteria){
                this.APIRequest.queryObject.join(element, joinCriteria);
                joinCriteria=null;
            }
        });
    }

    this.getCallback = function(results){
        this.APIRequest.dataObject = results;
        this.convertTOJSON(this.APIRequest);
        this.executeResult(this.APIRequest);
        this.APIRequest.response.send(this.APIRequest.result);
    }

    this.getListCallback = function(){
        this.APIRequest.dataObject = result[0];
        this.convertTOJSON(this.APIRequest);
        this.executeResult(this.APIRequest);
        this.APIRequest.response.send(this.APIRequest.result);
    }

    this.getSelectQueryForEntityGet = function(options){
        this.addEntityIntoQuery();
    }
}

var getValueFromRelationMapping = function(dataObject,mapping){
    var mappings = mapping.split('.');
    return dataObject[mappings[0]][mappings[1]];
}

var getColumnNameFromRelationalMapping = function(mapping){
    return mapping.split('.')[1];
}

var getTablename = function(request){
    return request.entity.getTableName();
}

var applyParentCriteria = function(currentEntity,referrringEntity,currentEntityId,referrringEntityId){
    var parentTable = referrringEntity.getIdentifierField().getTableName();
    var parentField = referrringEntity.getFieldByName(currentEntity.getName()+"s");
    return {table:parentTable,joinCriteria:parentField.foreignKeyMapping};
}

var getEntityIdCriteria = function(entity,entityId){
    var criteria=null;
    if(entityId){
        criteria = {};
        criteria[getColumnNameFromRelationalMapping(entity.getIdentifierField().relationMapping)]=entityId;
    }
    return criteria;
} 

// used for post and put operation.
var iterateFieldsAndGetResult = function(entity,entityResult,APIRequest,dataObject){
    var fields = entity.getFields();
    Object.keys(fields).forEach((field)=>{
        if(fields[field].refEntity){
            entityResult[fields[field].refEntity] = iterateFieldsAndGetResult(Entity.getEntityByName(fields[field].refEntity),{},APIRequest,dataObject);
        }else{
            entityResult[fields[field].name]= getValueFromRelationMapping((dataObject)?dataObject:APIRequest.dataObject,fields[field].relationMapping);
        }
    });
    return entityResult;
}

DefaultEntityHandler.prototype.get = function(){
    // return queryRunner.get(APIRequest,{});
    SQLConnect.runBuilder((qb) => {
        this.APIRequest.queryObject = qb;
        this.getSelectQueryForEntityGet();
        this.queryBuilder.queryGet(this.APIRequest.queryObject,(result)=>{
            this.getCallback(result);
        });
    });
}

DefaultEntityHandler.prototype.getList = function(){
    SQLConnect.runBuilder((qb) => {
        this.APIRequest.queryObject = qb;
        this.getSelectQueryWithoutSelectColumns();
        this.addTableAndCriteriaBasedOnNavigationInfo();
        this.queryBuilder.queryGet(this.APIRequest.queryObject,(result)=>{
            this.getCallback(result);
        });
    });
}
DefaultEntityHandler.prototype.post = function(){
    SQLConnect.runBuilder(async qb =>{
        var results = await this.queryBuilder.queryInsert(qb,{table:getTablename(this.APIRequest),data:this.getInputValuesFromInputData(qb)});
        this.APIRequest.entityId=results.insert_id;
        this.get(this.APIRequest);
        qb.release();
    });
}
DefaultEntityHandler.prototype.delete = function(){
    SQLConnect.runBuilder(async qb =>{
        this.APIRequest.queryObject = qb;
        var results={};
        if(this.APIRequest.entityId){
            this.addEntityIdCriteriaIntoQuery();
            results = await this.queryBuilder.queryDelete(qb,{table:this.APIRequest.entity.getTableName()});
        }
        qb.release();
        this.APIRequest.result=results;
        this.executeResult(this.APIRequest);
        this.APIRequest.response.send(this.APIRequest.result);
    });
}
DefaultEntityHandler.prototype.update = function(){
    SQLConnect.runBuilder((qb) => {
        this.APIRequest.queryObject = qb;
        this.queryBuilder.queryUpdate(qb,{table:getTablename(this.APIRequest),data:this.getInputValuesFromInputData(),criteria:{id:this.APIRequest.entityId}},(err,res)=>{
            if(res.affectedRows){
                this.get(this.APIRequest);
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
    this.entity = APIRequest.entity;

    var method = APIRequest.operation;
    if(method == 'GET'){
        if(APIRequest.entityId == null){
            this.getList();
        }else{
            this.get();
        }
    }
    else if(method == 'PUT'){
        this.update();
    }
    else if(method == 'POST'){
        this.post();
    }
    else if(method == 'DELETE'){
        this.delete();
    }
}

module.exports = DefaultEntityHandler;