/*
* Direct access to Raygun server REST API.
*/
const baseUrl = "https://api.raygun.com"

/*
* Check whether the API key allows access to Raygun service.
*/
async function validateApiKey(apiKey) {   // (string) => Promise of boolean

  // Request:
  // curl -vX POST -H "X-ApiKey: E8iZWdHqxi6rqlkfYQ" -d '{}' https://api.raygun.com/entries
  //
  //  ..provides 400 if the API key is valid
  //    403 is API key is rejected

  const resp = await fetch(`${baseUrl}/entries`, {
    method: 'POST',
    headers: {
      'X-ApiKey': apiKey,
      'Content-Type': 'application/json'
    },
    // Note: Must have some body. Without one, gave "413 Payload Too Large"
    body: '{}'
  });

  if (resp.status === 403) {    // Forbidden
    return false;
  } else if (resp.status === 400) {
    return true;
  } else {
    throw new Error(`Unexpected response from '/entries' (${resp.status}): ${resp.body}`)
  }
}

export {
  validateApiKey
}
