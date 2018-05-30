exports.handler = async (event) => {

  let statusCode = 200
  let responseBody = {
    message: 'Hello'
  }

  let response = {
    statusCode: statusCode,
    body: JSON.stringify(responseBody)
  }

  return response
};
