const AWS = require('aws-sdk')

const sqs = new AWS.SQS(options = {})
const sns = new AWS.SNS(options = {})

let invocations = 0

const sqsParams = {
  QueueUrl: process.env.SQS_URL,
  AttributeNames: ['ApproximateNumberOfMessages']
}
const countPendingMessages = () => new Promise((resolve, reject) => {
  sqs.getQueueAttributes(sqsParams, (err, data) => {
    if (err) {
      reject(err)
    } else {
      let count = data.Attributes.ApproximateNumberOfMessages
      console.log(`There are ${count} message(s) on the queue.`)
      resolve(count)
    }
  })
}).catch(err => {
  console.error('Unable to count messages at this time... ', err)
})

const snsParams = {
  TopicArn: process.env.PROCESS_UPDATE_SNS_ARN,
  Message: 'Trigger processUpdate Lambda'
};
const processPendingMessages = () => new Promise((resolve, reject) => {
  sns.publish(snsParams, (err, data) => {
    if (err) {
      reject(err)
    } else {
      console.log("Done! The next update is being processed...")
      resolve()
    }
  })
}).catch(err => {
  console.error('Unable to process updates at this time... ', err)
})

exports.handler = async () => {

  invocations += 1
  console.log('Number of invocations of this instance: ', invocations)
  
  console.log('Counting messages now...')
  const count = await countPendingMessages()
  if (count > 0){
    console.log('Triggering processUpdate Lambda via SNS...')
    await processPendingMessages()
  }
  return
};
