var aws = require('aws-sdk');
var lambda = new aws.Lambda({
  region: 'eu-west-2' 
});

exports.handler = (event, context, callback) => {
  let request = event.Records[0].cf.request;
  var response = event.Records[0].cf.response;
  const uri = request.uri;
  var srcKey = uri.substring(uri.indexOf('/') + 1);
  var srcRecord = srcKey.substring(srcKey.indexOf('/') + 1);
  var srcFile = srcRecord.replace(/\s/g, '');
  
  if(srcFile != "favicon.ico" && srcFile != ""){
    lambda.invoke({
    FunctionName: 'image-compression-transform-OGvsyEipwCzp',
    Payload: JSON.stringify(event, context, callback),  // pass params
    InvocationType: "RequestResponse", 
    LogType: "Tail"
  }, function(error, data) {
    if (error) {
      callback(null, response);
      context.done("Compress error");
    }else{
      if(data.Payload){
     if(data.Payload != null){
      response = JSON.parse(data.Payload);
      callback(null, response);
     }
     context.succeed("Successfull");
    }
    }
  });
 }else{
  callback(null, response); 
 }
};