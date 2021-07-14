const { response } = require('express');
const DefaultEntityHandler = require('./defaultEntityHandler');

function UserEntityHandler() {
    DefaultEntityHandler.call(this);
};
UserEntityHandler.prototype = Object.create(DefaultEntityHandler.prototype);
UserEntityHandler.prototype.constructor = UserEntityHandler;
UserEntityHandler.prototype.getEntityName = function(){
    return this.entityName;
}

module.exports = UserEntityHandler;