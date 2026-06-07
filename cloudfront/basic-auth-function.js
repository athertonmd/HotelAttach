// CloudFront Function: Basic HTTP Authentication
// Deploy as a CloudFront Function (viewer-request event type)
//
// To generate the base64 credentials string:
//   echo -n "username:password" | base64
//
// Replace BASIC_AUTH_BASE64 below with the output.
// Example: echo -n "hci-demo:ManticPoint2026!" | base64
//          produces: aGNpLWRlbW86TWFudGljUG9pbnQyMDI2IQ==

var CREDENTIALS = 'aGNpLWRlbW86TWFudGljUG9pbnQyMDI2IQ==';

function handler(event) {
  var request = event.request;
  var headers = request.headers;
  var expected = 'Basic ' + CREDENTIALS;

  if (typeof headers.authorization === 'undefined' || headers.authorization.value !== expected) {
    return {
      statusCode: 401,
      statusDescription: 'Unauthorized',
      headers: {
        'www-authenticate': { value: 'Basic realm="HCI Demo Portal"' },
      },
      body: {
        encoding: 'text',
        data: 'Unauthorized — please provide demo credentials.',
      },
    };
  }

  return request;
}
