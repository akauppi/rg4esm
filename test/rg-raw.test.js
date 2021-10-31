/*
* rg-raw.test.js
*
* Test the (patched) Raygun plain client's behaviour. This also tests our approach of hijacking the network requests.
*
* @jest-environment jsdom
*/
import { test, expect, describe, beforeAll, jest } from '@jest/globals'

import { rg4js, takeOver } from '@local/package/lib/raygun.esm.js'

describe ('Raygun plain client', () => {
  //const apiKey = "abc"

  const processException_MockF = jest.fn();
  const makePostCorsRequest_MockF = jest.fn();

  beforeAll(() => {
    takeOver({
      processException: processException_MockF,
      makePostCorsRequest: makePostCorsRequest_MockF
    });
  });

  test('can explicitly send an Error (and we can intercept RG comms)', () => {

    rg4js('send', new Error("just saying.."))

    expect(processException_MockF.mock.calls[0][3].message) .toEqual("just saying..")
  } );
});
