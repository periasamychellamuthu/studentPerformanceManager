var Entity = require('../api/Entity');
var Field = require('../api/EntityField');
var NavigationInfo = require('../api/NavigationInfo');

function queryGeneratorandExecutor(){
 
    this.join = function(options){
        options.query.join(options.table, options.joinCriteria);
    }

    this.setCriteria = function(options){
        options.query.where(options.criteria);
    }

    this.addFromTableInQuery = function(options){
        options.query.from(options.table);
    }

    this.queryGet = function(query,cbk){
        query.get((err,result) => {
            query.release();
            cbk(result);
        });
    }

    this.queryInsert = function(query,params,cbk){
        return query.insert(params.table,params.data);
    }

    this.queryDelete = function(query,params,cbk){
        return query.delete(params.table);
    }

    this.queryUpdate = function(query,params,cbk){
        query.update(params.table,params.data,params.criteria,cbk);
    }
}

module.exports = new queryGeneratorandExecutor();