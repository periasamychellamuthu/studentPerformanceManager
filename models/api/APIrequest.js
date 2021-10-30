var Entity = require('../api/Entity');
var Field = require('../api/EntityField');
const NavigationInfo = require('../api/NavigationInfo');
function APIRequest(){
    this.operation;
    this.result = {};
    this.response;
    this.entity;
    this.entityId;
    this.firstTokenInPath;
    this.isSubRequest;
    this.convenienceOperationName;
    this.convenienceOperationParam;
    this.navigationInfo;
    this.inputData;
    this.dataObject;
    this.entityBeanObject;
    this.addNecessaryDetailsForRequest =  function(request,response,entity){
        this.operation = request.method;
        this.response = response;
        this.inputData = request.body;
        var URLIPareseResult = new EntityLocator(request.url);
        this.entity = URLIPareseResult.currentEntity;
        this.entityId = URLIPareseResult.currentEntityId;
        this.firstTokenInPath = URLIPareseResult.firstTokenInPath;
        this.navigationInfo = URLIPareseResult.navigationInfo;
    }
}

function EntityLocator(path){

    var tokenList = getURLTokens(path);
    this.currentEntity=null,this.currentEntityId=null,this.navigationInfo=null,this.currentField=null,this.firstTokenInPath=null;
    var token=null;
    this.firstTokenInPath = tokenList[0]; 
    this.currentEntity = Entity.getEntityByPath(this.firstTokenInPath);
    for(var i=1;i<tokenList.length;i++){
        token = tokenList[i];
        this.entityId=Number(token);
        if(isNaN(this.entityId)){
          this.currentField = this.currentEntity.getFieldByName(token);
          this.navigationInfo = new NavigationInfo(this.currentEntity,this.currentEntityId,this.currentField,this.navigationInfo);
          this.currentEntity = this.currentField.getRefEntity();
          this.currentEntityId = null;
        }else{
          this.currentEntityId=this.entityId;
          this.currentEntity.setId(this.currentEntityId);
        }
    }
}

function getURLTokens(url){
    url = url.replace("/api","");
    url = url.replace("/v1","");
    var tokens = url.split('/'),result =[];
    tokens.forEach(element => {
      if(element != ""){
        result.push(element);
      }
    });
    return result;
  }

// module.exports = new APIRequest();
module.exports = APIRequest;