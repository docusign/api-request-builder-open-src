#!/usr/bin/env node
// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT

/**
 * @file diagramExamples.js is the root file 
 * @author DocuSign
 * @see https://developers.docusign.com  -- DocuSign Developer Center
 */

'use strict';
const fse = require('fs-extra')
    , path = require('path')
    , glob = require('glob-promise')
    , outputFile = 'src/assets/diagramExamples.json'
    ;

async function main() {
    // initialization
    let envelopeIndex = {version: 1, examples: []}

    const files = await glob ('src/assets/diagramExamples/*.dgm');
    for (let i = 0; i < files.length; i++) {
        const dgm = JSON.parse (await fse.readFile(files[i]))
            , item = {title: dgm.title, category: dgm.category,
                      description: dgm.description, 
                      filename: path.basename(files[i])}
            ;
        envelopeIndex.examples.push(item)
    }

    envelopeIndex.examples.sort((item1, item2) => {
        if (item1.category < item2.category) {return -1}
        if (item1.category > item2.category) {return  1}
        if (item1.title < item2.title) {return -1}
        if (item1.title > item2.title) {return  1}
        return 0
    })

    const outputJson = JSON.stringify(envelopeIndex, null, "   ");
    //console.log(outputJson);
    await fse.writeFile(outputFile, outputJson);
    console.log ("\nCreated diagramExamples.json.\n");
}

/**
 * The top level function. It's a wrapper around <tt>main</tt>.
 */
async function executeMain() {
    try {
        await main();
    } catch (e) {
        throw e;
    }
}

// the main line
executeMain();
