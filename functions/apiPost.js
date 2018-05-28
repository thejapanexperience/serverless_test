exports.handler = async (event) => {

  let offlineEvent = {
    body: JSON.stringify({
      name: "Richard",
      status: "Awesome"
    })
  }

  let statusCode = 200
  event ? event : event = offlineEvent

  let responseBody = {
    eventBody: JSON.parse(event.body),
  }

  let response = {
    statusCode: statusCode,
    body: JSON.stringify(responseBody)
  }

  return response
};