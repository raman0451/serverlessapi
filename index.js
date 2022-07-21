const AWS= require('aws-sdk')
AWS.config.update ({
    region: 'ap-south-1'
})

const dynamodb= new AWS.DynamoDB.DocumentClient()
const dynamodbTableName= 'product-inventory'
const healthPath= '/health'
const productPath= '/product'
const productsPath= '/products'

exports.handler= async function(event) {
    console.log('Request event: ', event)

    let response
    switch(true){
        case event.httpMethod === 'GET' && event.path=== healthPath:
            response= buildResponse(200)
            break;

        case event.httpMethod === 'GET' && event.path=== productPath:
            response= await getProduct(event.queryStringParameters.productId)
            break;
            
        case event.httpMethod=== 'POST' && event.path=== productPath:
            response= await addProduct(JSON.parse(event.body))
            break;
            
        case event.httpMethod=== 'PATCH' && event.path=== productPath:
            const requestBody= JSON.parse(event.body)
            response= await updateProduct(requestBody.productId, requestBody.value, requestBody.updatedValue)
            break;
            
        case event.httpMethod=== 'DELETE' && event.path=== productPath:
            response= await deleteProduct(JSON.parse(event.body).productId)
            break;
        
         default:
            response= buildResponse(404, '404 Not Found')


    }

    return response
}

async function getProduct(productId) {
    const params= {
        TableName: dynamodbTableName,
        Key: {
            'productId': productId
        }
    }

return await dynamodb.get(params).promise().then((response)=> {
    return buildResponse(200, response.Item)
}, (error)=> {
    console.error(error)

})
}

async function addProduct(requestBody) {
    const params= {
        TableName: dynamodbTableName,
        Item: requestBody
    }
    return await dynamodb.put(params).promise().then(()=> {
        const body= {
            //Operation: 'SAVE',
            Message: 'Product Added Successfully',
            Product_Details: requestBody
        }
        return buildResponse(200, body)
    }, (error)=> {
        console.log(error)
    })
}

async function updateProduct(productId, value, updatedValue) {
    const params= {
        TableName: dynamodbTableName,
        Key: {
            'productId': productId
        },
        UpdateExpression: `SET ${value}= :value`,
        NewValues: {
            ':value': updatedValue
        },
        ReturnValues: 'UPDATED_NEW'
    }
    return await dynamodb.update(params).promise().then((response)=> {
        const body= {
            Message: `successfully updated `,
            UpdatedAttributes: response
        }
        return buildResponse(200, body)
    }, (error)=> {
        console.error(error)
    })
}

async function deleteProduct(productId) {
    const params= {
        TableName: dynamodbTableName,
        Key: {
            'productId': productId
        },
        ReturnValues: 'ALL_OLD'
    }
    return await dynamodb.delete(params).promise().then((response)=> {
        const body= {
            Message: 'Deleted Successfully',
            Item: response
        }
        return buildResponse(200, body)
    },(error)=> {
        console.error(error)
    })
}


function buildResponse(statusCode, body) {
    return{
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)  //since we are getting a JSON obj, but Gateway is expecting a string
    }
}
