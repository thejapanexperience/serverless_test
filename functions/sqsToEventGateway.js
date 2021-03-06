const AWS = require('aws-sdk')
const axios = require('axios')

exports.handler = async (event) => {

  let sqs = new AWS.SQS(options = {})
  let sns = new AWS.SNS(options = {})

  const queueUrl = process.env.SQS_ENDPOINT
  const eventUrl = process.env.EVENT_ENDPOINT

  let sqsFetchParams = {
    QueueUrl: queueUrl, /* required */
    MaxNumberOfMessages: 1,
    VisibilityTimeout: 60 // time in seconds
  };
  
  const fetchMessages = () => new Promise((resolve, reject) => {
    sqs.receiveMessage( sqsFetchParams,(err, data) => {
      if (err) {
        console.log('SQS', err, err.stack); // an error occurred
        reject(err)
      }
      else {
        console.log('SQS', data); // successful response
        if (data.Messages){
          let message = data.Messages[0]
          sqsDeleteParams.ReceiptHandle = message.ReceiptHandle
          resolve(message)
        } else {
          resolve()
        }
      } 
    })
  })

  const sendToEventGateway = (webhookData) => new Promise((resolve, reject) => {
    console.log('webhookData', webhookData)
    axios.post(eventUrl, webhookData)
    .then( response => {
      console.log('SQS', response.data)
      resolve(response.data)
    })
    .catch(function (error) {
      console.log('SQS', error)
      reject(error)
    })
  })

  let sqsDeleteParams = {
    QueueUrl: queueUrl,
    ReceiptHandle: ''
  }

  const updateQueue = () => new Promise((resolve, reject) => {
    sqs.deleteMessage(sqsDeleteParams, (err, data) => {
      if (err) {
        console.log('SQS', err, err.stack); // an error occurred
        reject(err)
      } else {
        console.log('SQS', data); // successful response
        resolve(data)
      }
    })
  })

  let sqsCountParams = {
    QueueUrl: queueUrl,
    AttributeNames: ['ApproximateNumberOfMessages']
  }

  let snsParams = {
    Message: 'I am a trigger',
    TopicArn: process.env.SNS_ARN
  };
  
  const countPendingMessages = () => new Promise((resolve, reject) => {
    sqs.getQueueAttributes(sqsCountParams, (err, data) => {
      if (err) {
        console.log('SQS', err, err.stack); // an error occurred
        reject(err)
      } else {
        console.log('SQS', data); // successful response
        if (data.Attributes.ApproximateNumberOfMessages > 0) {
          sns.publish(snsParams, (err, data) => {
            if (err) {
              console.log('Error: ', err, err.stack); // an error occurred
              reject(err)
            } else {
              console.log('Response: ', data); // successful response
              resolve(data)
            }
          })
        } else {
          resolve()
        }
      }
    })
  })
  
  console.log('Getting message from SQS...')
  let message = await fetchMessages()
  
  if (message) {
    console.log('Sending message to Event Gateway...')
    await sendToEventGateway(message.Body)
    console.log('Deleting message on SQS...')
    await updateQueue(message)
  } else { 
    console.log('No Messages on SQS') 
  }

  console.log('Counting pending messages...')
  await countPendingMessages()
  
  console.log('All done...')
    
  return "Thanks for the message, I've sent it to the event gateway!"
};
