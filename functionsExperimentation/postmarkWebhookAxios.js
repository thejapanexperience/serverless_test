let axios = require('axios')

exports.handler = async (event) => {

  let statusCode = 204

  let dummyEvent = {
    body: JSON.stringify({
      name: "Richard",
      status: "Awesome"
    })
  }

  event ? event : event = dummyEvent

  await axios.post(process.env.EVENT_ENDPOINT, event.body)
    .then(function (response) {
      console.log('POSTMARK WEBHOOK', response.data)
    })
    .catch(function (error) {
      console.log('POSTMARK WEBHOOK', error)
    })

  let response = {
    statusCode: statusCode
  }
  return response
};
