var entityJsons = require('../entityJSON/EntityJSON.json');
var Entity = require('../api/Entity');
const { init } = require('../../app');
function metaDataHolder(){

    var entityMeta ={};

    addMetaDetails = function(){
        var keys = Object.keys(entityJsons);
        keys.forEach(entity => {
            entityMeta[entityJsons[entity].path] = new Entity(entityJsons[entity]);
        });
    }
    addMetaDetails();

    this.get=function(path){
        if(path.indexOf('/') == -1){
            path = '/'+path;
        }
       return entityMeta[path];
    }
}

module.exports = new metaDataHolder();