var mysql = require("mysql");
var config = require('../../config.json');
var QueryBuilder = require("node-querybuilder");

function MySQLConnect(){
    this.pool = null;
    const builderObject = new QueryBuilder({
        "host": config.db_config.host,
        "user": config.db_config.user,
        "password": config.db_config.password,
        "database": config.db_config.database,
        "pool_size": 50
    },'mysql', 'pool');
    //Init MySql Connection pool
    this.init = function(){
        return new Promise((resolve, reject) => {
            if (this.pool) {
                console.log("connection resolved");
                return resolve(this.pool);
            }
            this.pool = mysql.createPool({
                host: config.db_config.host,
                user: config.db_config.user,
                password: config.db_config.password,
                database: config.db_config.database
            });
            mysql.Promise = global.Promise;
            this.pool.getConnection(function(err,connection){
                console.log(err+'and pool is'+this.pool);
                connection.release();
               if (err) reject(err);
               resolve(this.pool);
           });
        });
    }

    this.acquire = function(callback){
        this.pool.getConnection(function(err,connection){
            callback(err,connection);
        });
    }

    this.runBuilder = function(cbk){
        builderObject.get_connection(db => {
            cbk(db);
        });
    }
}

module.exports = new MySQLConnect();