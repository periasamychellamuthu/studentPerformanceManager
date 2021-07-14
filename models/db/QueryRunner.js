var db=require('./MySqlConnect')
var mysql = require('mysql');
var config = require('../../config.json');


function QueryRunner(request,response,options){
    this.handlerQuery=function(request,response,options){
        var query ={
            sql:"select ?? from ??",
            values:[]
        };
        query.values.push(getSelectColumnForSelectQuery(request));
        query.values.push(getTablename(request));
        executeQuery(query,response);
    }

    this.get=function(){

    }

    this.update=function(){

    }

    this.delete=function(){

    }

    this.add=function(){

    }

}

function getSelectColumnForSelectQuery(request){
    var entity = request.entity,tableList=[];
    var columns =[];
    entity.fields.forEach((field,index) => {
        columns.push(field.relational_mapping.split(".")[1]);
        // columns.push('`'+field.relational_mapping+"` AS `"+field.name+'`');
    });
    console.log(columns);
    return columns;
}

function getTablename(request){
    return request.entity.table_name;
}

function executeQuery(query,response){
    db.acquire(function(error,connection){
        connection.query(query, function(err, rows){
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