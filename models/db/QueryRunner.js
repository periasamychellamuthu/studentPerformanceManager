var db = require('./MySqlConnect')
var config = require('../../config.json');
var queryBuilder = require("querybuilder");
var nodeQueryBuilder = require("node-querybuilder");
const { request } = require('../../app');

function QueryRunner(request,response,options){

    const ALL_COLUMNS = '*';

    this.get=function(request,response,options){
        // var query ={
        //     sql:"select ?? from ??",
        //     values:[]
        // };
        // query.values.push(getSelectColumnForSelectQuery(request));
        // query.values.push(getTablename(request));
        // query.sql = query.sql+getWhereString();
        // query.values.push(getIdentifierColumnForEntity(request),request.entityId);
        // executeQuery(query,response);
        db.runBuilder(qb =>{
            getSelectColumnForSelectQuery(request,qb);
            setCriteriaForQuery(qb,request,options);
            qb.get(getTablename(request),function(err,result){
                qb.release();
                executeResult(err,result,response);
            });
        });
    }

    this.getList=function(request,response,options){
        db.runBuilder(qb =>{
            getSelectColumnForSelectQuery(request,qb);
            setCriteriaForQuery(qb,request,options);
            qb.get(getTablename(request),function(err,result){
                qb.release();
                executeResult(err,result,response);
            });
        });
    }

    this.update=function(request,response,options){
        db.runBuilder(async qb =>{
            setCriteriaForQuery(qb,request,options);
            qb.update(getTablename(request),getEntityFieldsAndValues(qb,request),null, (err, result) => {
                qb.release();
                executeResult(err,result,response);
            });
        });

       
    }

    this.delete=function(request,response,options){
        db.runBuilder(async qb =>{
            setCriteriaForQuery(qb,request,options);
            var results = await qb.delete(getTablename(request));
            qb.release();
            if(results.affectedRows > 0){
                executeResult(undefined ,undefined,response);
            }else{
                executeResult(undefined ,results,response);
            }
        });
    }

    this.add=function(request,response,options){
        db.runBuilder(async qb =>{
            var results = await qb.insert(getTablename(request),getEntityFieldsAndValues(qb,request));
            results =await getEntityFromId(qb,results,request);
            qb.release();
            executeResult(undefined ,results,response);
        });
    }

}

async function getEntityFromId(qb,results,request){
    var values = {};
    values[getIdentifierColumnForEntity(request)]=results.insert_id;
    results = await qb.get_where(getTablename(request),values);
    return results;
}

function getIdentifierColumnForEntity(request){
    var identifierColumn;
    request.entity.fields.forEach((field,index) => {
        if(field.is_identifier)
        {
            identifierColumn = getColumnNameFromRelationalMapping(field.relational_mapping);
        }
    });
    return identifierColumn;
}

function getEntityFieldsAndValues(qb,request){
    var form_data = request.body;
    var key_value = {};
    request.entity.fields.forEach((field,index) => {
       if(field.is_identifier){
        return;
       }
       if(form_data[field.name]){
        key_value[getColumnNameFromRelationalMapping(field.relational_mapping)]=form_data[field.name];
       }
    });
    return key_value;
}

function getColumnNameFromRelationalMapping(mapping){
    return mapping.split('.')[1];
}

function setCriteriaForQuery(qb,request,options){
    var criteria={};
    if(request.entityId!=null){
        criteria[getIdentifierColumnForEntity(request)]=request.entityId;
    }
    if(Object.keys(criteria).length != 0){
        qb.where(criteria);
    }
    
}

function setReturningColumns(qb,columns){
    if(columns == undefined){
        qb.returning(ALL_COLUMNS);
    }
    else{
        qb.returning(columns);
    }
} 
function getSelectColumnForSelectQuery(request,qb){
    var entity = request.entity;
    var columns =[];
    entity.fields.forEach((field,index) => {
        columns.push(field.relational_mapping.split(".")[1]);
        // columns.push('`'+field.relational_mapping+"` AS `"+field.name+'`');
    });
    qb.select(columns);
}

function getTablename(request){
    return request.entity.table_name;
}

function executeResult(err,result,response){
    if (!err) {
        response.send({
            "status":2000,
            "user":result
        });
    } else {
        console.log(err.stack);
        response.send(err);
    }
}

function executeQuery(query,response,params){
    db.acquire(function(error,connection){
        connection.query(query,(params)?params.criteriaValues:params,function(err, rows){
            // connection.end(); // return the connection to pool
            connection.release();
            if (!err) {
                response.send({
                    "status":2000,
                    "user":rows});
            } else {
                console.log(err.stack);
                response.send(err);
            }
        });
    });
}

module.exports = new QueryRunner();