var Entity = require('../api/Entity');
var Field = require('../api/EntityField');
var NavigationInfo = require('../api/NavigationInfo');

function queryGeneratorandExecutor(APIRequest){
    this.APIRequest = APIRequest;
    this.entity = APIRequest.entity;
    this.get = function(){
        this.getEntityQuery();
    }

    this.getList = function(){
        this.getSelectQueryWithoutSelectColumns();
        this.addTableAndCriteriaBasedOnNavigationInfo();
    }

    this.addTableAndCriteriaBasedOnNavigationInfo = function(){
        this.NavigationInfo = this.APIRequest.navigationInfo;
        if(this.NavigationInfo){
            var parentEntity=this.NavigationInfo.getParentEntity();
            this.applyParentCriteria(this.entity,parentEntity,null,parentEntity.getId());
        }
    }

    this.applyParentCriteria = function(currentEntity,referrringEntity,currentEntityId,referrringEntityId){
        var parentTable = referrringEntity.getIdentifierField().getTableName();
        var parentField = referrringEntity.getFieldByName(currentEntity.getName()+"s");
        this.APIRequest.queryObject.join(parentTable, parentField.foreignKeyMapping);
    }

    this.update = function(){
        
    }

    this.getSelectQueryWithoutSelectColumns = function(){
        var IdentifierField = this.entity.getIdentifierField();
        this.APIRequest.queryObject.from(this.entity.getTableName());
        this.joinAllTablesOfEntity({field:IdentifierField});
    }

    this.getSelectQueryForEntityGet = function(options){
        var entity = (options && options.entity)?options.entity:this.entity;
        if(!(options && options.isFromNavigationInfo)){
            this.APIRequest.queryObject.from(entity.getTableName());
        }
        var IdentifierField = entity.getIdentifierField();
        var tableName = IdentifierField.getTableName();
        var columnName = IdentifierField.getColumnName();
        var criteria ={};
        // if(this.APIRequest.entityId){
        //     criteria[tableName+'.'+columnName]=this.APIRequest.entityId;
        // }
        if(entity.getId()){
            criteria[tableName+'.'+columnName]=entity.getId();
        }
        this.joinAllTablesOfEntity({entity:entity});
        if(Object.keys(criteria).length){
            this.APIRequest.queryObject.where(criteria);
        }
    }

    this.executeResult = function (err,result){
        var APIResult = this.APIRequest.result;
        if (!err) {
            APIResult[this.entity.getName()] = result;
            APIResult["status"]=2000;
        } else {
            APIResult["error"]=err;
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

    this.getEntityQuery = function(){
        this.getSelectQueryForEntityGet();
    }

    this.setCriteriaForQuery = function(qb,request){
        var criteria={};
        if(request.entityId!=null){
            criteria[this.getColumnNameFromRelationalMapping(request.entity.getIdentifierField().relationMapping)]=request.entityId;
        }
        if(Object.keys(criteria).length != 0){
            qb.where(criteria);
        } 
    }

    this.getColumnNameFromRelationalMapping = function(mapping){
        return mapping.split('.')[1];
    }
}

module.exports = queryGeneratorandExecutor;