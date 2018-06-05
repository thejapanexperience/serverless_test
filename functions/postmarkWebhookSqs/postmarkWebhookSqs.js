const AWS = require('aws-sdk')

exports.handler = async (event) => {

  let sqs = new AWS.SQS(options = {})
  let sns = new AWS.SNS(options = {})

  let statusCode = 204

  let dummyEvent = {
    body: JSON.stringify({
      name: "Richard",
      status: "Awesome"
    })
  }

  event ? event : event = dummyEvent

  let sqsParams = {
    MessageBody: event.body,
    QueueUrl: process.env.SQS_URL,
    MessageAttributes: {
      'WebhookData': {
        DataType: 'String',
        StringValue: 'My Data'
      },
    },
  };
 
  let snsParams = {
    Message: 'I am a trigger',
    TopicArn: process.env.SNS_ARN
  };
  
  const putWebhookUpdateOnSqs = () => new Promise((resolve, reject) => {
    sqs.sendMessage( sqsParams,(err, data) => {
      if (err) {
        console.log('Error: ', err, err.stack); // an error occurred
        reject(err)
      }
      else {
        // console.log('Response: ', data); // successful response
        resolve(data)
      } 
    })
  })
  
  const snsTrigger = () => new Promise((resolve, reject) => {
    sns.publish( snsParams,(err, data) => {
      if (err) {
        console.log('Error: ', err, err.stack); // an error occurred
        reject(err)
      }
      else {
        console.log('Response: ', data); // successful response
        resolve(data)
      } 
    })
  })

  console.log('Putting webhook data on queue...')
  await putWebhookUpdateOnSqs()
  console.log('Triggering lambda via SNS...')
  await snsTrigger()
  console.log('Done!')
  
  let response = {
    statusCode: statusCode
  }

  return response
};
