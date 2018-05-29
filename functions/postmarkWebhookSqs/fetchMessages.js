 module.exports = () => {
     
     let sqsFetchParams = {
         QueueUrl: process.env.SQS_ENDPOINT,
         MaxNumberOfMessages: 1,
         VisibilityTimeout: 60 // time in seconds
     };
    
     const fetchMessages = () => new Promise((resolve, reject) => {
         sqs.receiveMessage(sqsFetchParams, (err, data) => {
             if (err) {
                 console.log('SQS', err, err.stack); // an error occurred
                 reject(err)
             } else {
                 console.log('SQS', data); // successful response
                 if (data.Messages) {
                     let message = data.Messages[0]
                     sqsDeleteParams.ReceiptHandle = message.ReceiptHandle
                     resolve(message)
                 } else {
                     resolve()
                 }
             }
         })
     })
 }
 