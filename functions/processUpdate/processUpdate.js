const AWS = require('aws-sdk')
const axios = require('axios')
const uuid = require('uuid/v4')

const sqs = new AWS.SQS(options = {})
const sns = new AWS.SNS(options = {})

let invocations = 0

const sqsFetchParams = {
  QueueUrl: process.env.SQS_URL, /* required */
  MaxNumberOfMessages: 1,
  VisibilityTimeout: 20 // time in seconds
}

const fetchUpdate = () => new Promise((resolve, reject) => {
  sqs.receiveMessage( sqsFetchParams,(err, data) => {
    if (err) {
      reject(err)
    }
    else {
      if (data.Messages && data.Messages[0].Body){
        console.log('I got an update!')
        let message = data.Messages[0]
        resolve(message)
      } else {
        resolve('No messages')
      }
    } 
  })
}).catch(err => {
  console.error(err)
})

const transformForEventGateway = ( json ) => {
  let body = JSON.parse(json)
  let transformedData = {
    id: uuid(),
    issuer: 'internal',
    event_type: 'UpdateEmailStatus',
    original_data: {},
    data: {
      type: body.RecordType,
      tag: body.Tag,
      message_id: body.MessageID,
      processed_at: ''
    }
  }

  const keysToDelete = ['RecordType', 'Tag', 'MessageID']
  keysToDelete.forEach(key => delete body[key])
  
  const ats = ['DeliveredAt', 'BouncedAt', 'ReceivedAt']
  ats.forEach(at => {
    if (Object.keys(body).includes(at)) {
      let key = body[`${at}`]
      transformedData.data.processed_at = key
      delete body[`${key}`]
    }
  })

  transformedData.data.details = body
  transformedData.original_data = {...transformedData.data}
  console.log(`Update type = ${transformedData.data.type}`)
  return transformedData
}

const sendToEventGateway = (transformedUpdate) => 
axios.post(process.env.EVENT_ENDPOINT, transformedUpdate)
.then( response => {
  console.log("Done! The Event Gateway has received this update!")
  return 'sent'
})
.catch( err => {
  console.error('Unable to put update on Event Gateway at this time... ', err)
})

const sqsDeleteParams = {
  QueueUrl: process.env.SQS_URL,
  ReceiptHandle: ''
}
const updateQueue = (receiptHandle) => new Promise((resolve, reject) => {
  let params = {...sqsDeleteParams}
  params.ReceiptHandle = receiptHandle
  sqs.deleteMessage(params, (err, data) => {
    if (err) {
      reject(err)
    } else {
      let response = "Done! The update has been deleted from the queue."
      console.log(response)
      resolve(response)
    }
  })
}).catch(err => {
  console.error('Unable to delete update from queue at this time... ', err)
})

const snsParams = {
  TopicArn: process.env.COUNT_UPDATES_SNS_ARN,
  Message: 'Trigger countUpdates Lambda'
};
const countPendingUpdates = () => new Promise((resolve, reject) => {
  sns.publish(snsParams, (err, data) => {
    if (err) {
      reject(err)
    } else {
      let response = "The number of updates is being counted..."
      console.log(response)
      resolve(response)
    }
  })
}).catch(err => {
  console.error('Unable to check if there are more updates at this time... ', err)
})

exports.handler = async () => {

  invocations += 1
  console.log('Number of invocations of this instance: ', invocations)

  console.log('Getting an update from the queue...')
  const update = await fetchUpdate()

  if (!update){
    const response = 'Unable to fetch an update at this time... '
    console.log(response)
    return response
  }

  if (update === 'No messages'){
    const response = "There are no updates to process at this time."
    console.log(response)
    return response
  }
  
  console.log('Sending transformed update to Event Gateway...')
  const transformedUpdate = transformForEventGateway(update.Body)
  const event = await sendToEventGateway(transformedUpdate)
  if (!event || event !== 'sent'){
    const response = "Cancelled. The update will remain on the sqs queue and be processed later."
    console.log(response)
    return response
  }

  console.log('Deleting update on SQS...')
  await updateQueue(update.ReceiptHandle)
  
  console.log('Triggering countUpdates Lambda via SNS...')
  await countPendingUpdates()

  return "Update processed and successfully dispatched to Event Gateway!"
};
