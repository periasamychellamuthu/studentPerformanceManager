const { init } = require("../../app");
var Field = require('../api/EntityField');

function Entity(entityJSON){
    this.id = null;
    this.tableName = entityJSON.table_name;
    this.name = entityJSON.name;
    this.handlers = entityJSON.handlers;
    this.fields = {};
    this.tablesForGetOperation =[];

    this.getName = function(){
        return this.name;
    }

    this.getTableName = function(){
        return this.tableName;
    }

    this.setId = function(id){
        this.id=id;
    }

    this.getId = function(){
        return this.id;
    }

    this.getIdentifierField = function(){
        var identifierField = null;
        Object.keys(this.fields).forEach((field,index) => {
            if(this.fields[field].isIdentifier)
            {
                identifierField = this.fields[field];
            }
        });
        return identifierField;
    }

    this.getAllTablesForGetOperation = function(){
        return this.tablesForGetOperation;
    }

    this.getHandlerInstance = function(){
        const handler =  require('../handler/'+this.handlers);
        return new handler();
    }

    this.getFields = function(){
        return this.fields;
    }

    this.getRefEntityFields = function(){
        var refFields =[];
        this.fields.forEach(field => {
            if(field.refFields){
                refFields.push(field);
            }
        });
        return refFields;
    }

    this.getFieldByName = function(name){
        return this.fields[name];
    }
    setFieldsForEntity(this,entityJSON);
}

function setFieldsForEntity(entity,entityJSON){
    for(var i=0;i<entityJSON.fields.length;i++){
       var entityField = new Field(entityJSON.fields[i]);
        // var field = entity.fields[entityJSON.fields[i].name];
        if(!(entityField.getRefEntityName()!=null && entityField.isCollection) &&  !(entityField.getTableName() in entity.tablesForGetOperation) && (entityField.getTableName()!=entity.getTableName())){
            entity.tablesForGetOperation[entityField.getTableName()] =entityField.foreignKeyMapping;
        }
        entity.fields[entityField.name] = entityField;
    }
}

module.exports = Entity;

module.exports.getEntityByPath = function(path){
    const entityMetaData = require('../api/EntityMetaDataHolder');
    if(path.indexOf('/') == -1){
        path = '/'+path;
    }
    return entityMetaData.get(path);
}

module.exports.getEntityByName = function(name){
    const entityMetaData = require('../api/EntityMetaDataHolder');
    return entityMetaData.get('/'+name+'s');
}