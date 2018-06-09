const AWS = require('aws-sdk')

let sqs = new AWS.SQS(options = {})
let sns = new AWS.SNS(options = {})

const sqsParams = {
  MessageBody: '',
  QueueUrl: process.env.SQS_URL,
  MessageAttributes: {
    'WebhookData': {
      DataType: 'String',
      StringValue: 'My Data'
    },
  },
};

const putWebhookUpdateOnSqs = (event) => new Promise((resolve, reject) => {
  let params = {...sqsParams}
  params.MessageBody = event.body
  sqs.sendMessage(params, (err, data) => {
    if (err) {
      console.log('Error: ', err, err.stack); // an error occurred
      reject(err)
    } else {
      console.log('Response: ', data); // successful response
      resolve(data)
    }
  })
})

const snsParams = {
  Message: 'I am a trigger',
  TopicArn: process.env.SNS_ARN
};

const snsTrigger = () => new Promise((resolve, reject) => {
  sns.publish(snsParams, (err, data) => {
    if (err) {
      console.log('Error: ', err, err.stack); // an error occurred
      reject(err)
    } else {
      console.log('Response: ', data); // successful response
      resolve(data)
    }
  })
})

exports.handler = async (event, context) => {
  
  if (event.headers.giraffe !== 'hippo'){
    return { statusCode: 403 }
  }
  
  console.log('Putting webhook data on queue...')
  await putWebhookUpdateOnSqs(event)
  console.log('Triggering lambda via SNS...')
  await snsTrigger()
  console.log('Done!')
  return { statusCode: 204 }
};
