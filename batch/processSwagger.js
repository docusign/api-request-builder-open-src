#!/usr/bin/env node
// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT

/**
 * @file processSwagger.js is the root file for processing the Swagger file.
 * @author DocuSign
 * @see <a href="https://developers.docusign.com">DocuSign Developer Center</a>
 * 
 * This application configures the Envelope Builder from the current swagger file.
 */

'use strict';
const exploreSwagger = require('./lib/exploreSwagger')
    , createToolbox = require('./lib/createToolbox')
    ;    

async function main() {
  /**
   * Step 1: Explore the Swagger file
   */
  const objectsPath = await exploreSwagger.explore()

  /**
   * Step 2: (Future) Munge the file to recogonize booleans as booleans, 
   *                  mark popular vs extended attributes, etc 
   */
  
  /**
   * Step 3: Create Blockly toolbox
   */
  await createToolbox.create(objectsPath);

}


/**
 * The top level function. It's a wrapper around <tt>main</tt>.
 * This async function catches and displays exceptions.
 */
async function executeMain() {
  try {
    await main();
  } catch (e) {
    let body = e.response && e.response.body;
    if (body) {
      // DocuSign API problem
      console.log (`\nAPI problem: Status code ${e.response.status}, message body:
${JSON.stringify(body, null, 4)}\n\n`);  
    } else {
      // Not an API problem
      throw e;
    }
  }
}

// the main line
executeMain();
