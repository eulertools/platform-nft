const AWS = require('aws-sdk');

const ddbClient = new AWS.DynamoDB();

const marshallOptions:any = {
  convertEmptyValues: true,
  removeUndefinedValues: true,
  convertClassInstanceToMap: true,
};

export const deleteItem = async (table: any, key: any) => {

  const params = {
    TableName: table,
    Key: AWS.DynamoDB.Converter.marshall(key),
  };

  await ddbClient.deleteItem(params).promise();
}

export const getItems = async (search:any) => {

  if(search.ExclusiveStartKey) {
    search.ExclusiveStartKey = AWS.DynamoDB.Converter.marshall(search.ExclusiveStartKey);
  }

  const response:any = await ddbClient.query(search).promise();

  if(response.Count > 0) {

      return response.Items.map((item:any) => AWS.DynamoDB.Converter.unmarshall(item, marshallOptions));
  }

  return [];
}

export const getItem = async (search:any) => {

    const response:any = await getItems(search);

    if(response.length > 0) return response[0];

    return undefined;
}

export const updateItem = async (table: any, key: any, value: any) => {

    let updateExpression = "SET ";
    const expressionAttributeNames:any = {}
    const expressionAttributeValues:any = {}
  
    const valueMarshal = AWS.DynamoDB.Converter.marshall(value, marshallOptions);
  
    const keys = Object.keys(key);
  
    Object.keys(value).forEach((entry: any) => {
      if (!keys.includes(entry)) {
        updateExpression = `${updateExpression} #${entry} = :${entry}, `;
        expressionAttributeNames[`#${entry}`] = entry;
        expressionAttributeValues[`:${entry}`] = valueMarshal[entry];
      }
    })
  
    updateExpression = updateExpression.substring(0, updateExpression.lastIndexOf(','));
  
    const params = {
      TableName: table,
      Key: AWS.DynamoDB.Converter.marshall(key),
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    };
  
    await ddbClient.updateItem(params).promise();
}

export const scan = async (search:any) => {

  if(search.ExclusiveStartKey) {
    search.ExclusiveStartKey = AWS.DynamoDB.Converter.marshall(search.ExclusiveStartKey);
  }

  const response:any = await ddbClient.scan(search).promise();

  const countElement = await count(search.TableName);
  
  if(response.Count > 0) {

    return {
      count: countElement,
      results: response.Items.map((item:any) => AWS.DynamoDB.Converter.unmarshall(item, marshallOptions)),
      lastIdentifier: response.LastEvaluatedKey
    };
  }

  return  {
    count: countElement
  };
}

export const count = async (table:any) => {
  const params = {
    TableName: table,
    Select: "COUNT",
  };
  return (await ddbClient.scan(params).promise()).Count;
}