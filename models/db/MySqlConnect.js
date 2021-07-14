var mysql = require("mysql");
var config = require('../../config.json');

function MySQLConnect(){
    this.pool = null;

    //Init MySql Connection pool
    this.init = function(){
        return new Promise((resolve, reject) => {
            if (this.pool) {
                console.log("connection resolved");
                return resolve(this.pool);
            }
            this.pool = mysql.createPool({
                connectionLimit:10,
                host: config.db_config.host,
                user: config.db_config.user,
                password: config.db_config.password,
                database: config.db_config.database
            });
            mysql.Promise = global.Promise;
            this.pool.getConnection(function(err,connection){
                connection.end();
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
}

module.exports = new MySQLConnect();