const AWS = require('aws-sdk')

const sqs = new AWS.SQS(options = {})
const sns = new AWS.SNS(options = {})

let invocations = 0

const sqsParams = {
  MessageBody: '',
  QueueUrl: process.env.SQS_URL,
  MessageAttributes: {
    'WebhookData': {
      DataType: 'String',
      StringValue: 'My Data'
    },
  }
}
const putUpdateOnSqs = (event) => new Promise((resolve, reject) => {
  let params = {...sqsParams}
  params.MessageBody = event.body
  sqs.sendMessage(params, (err, data) => {
    if (err) {
      reject(err)
    } else {
      let response = "Done! The update is now on the queue."
      console.log(response)
      resolve(response)
    }
  })
}).catch(err => {
    console.error('Unable to put update on queue... ', err)
})

const snsParams = {
  TopicArn: process.env.PROCESS_UPDATE_SNS_ARN,
  Message: 'Trigger processUpdate Lambda'
}
const snsTrigger = () => new Promise((resolve, reject) => {
  sns.publish(snsParams, (err, data) => {
    if (err){
      reject(err)
    }
    else {
      let response = "Done! The update is now being processed..."
      console.log(response)
      resolve(response)
    }
  })
}).catch(err => {
  console.error('Unable to trigger SNS at this time... ', err)
})

let success = { statusCode : 204 }
let noAuthFailure = { statusCode : 403 }
let sqsFailure = { statusCode : 503 }

exports.handler = async (event, context) => {

  invocations +=1
  console.log('Number of invocations of this instance: ', invocations)

  if (event.headers.giraffe !== 'hippo'){
    console.log("Giraffe DOESN'T equal hippo!!!! ALERT ALERT ALERT")
    return noAuthFailure
  }
  
  console.log('Putting update data on SQS queue...')
  const queue = await putUpdateOnSqs(event)
  if (!queue){
    return sqsFailure
  }

  console.log('Triggering processUpdate Lambda via SNS...')
  await snsTrigger()

  return success
};