// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
/**
 * @file index.js is the root file.
 * @author DocuSign
 * @see <a href="https://developers.docusign.com">DocuSign Developer Center</a>
 * 
 * This file reads the object json file to produce the Blockly toolbox XML files:
 *    blocks.js -- the definitions of the individual blocks
 *    blocks-code.js -- outputs fluent JavaScript code
 *    toolbox.xml -- creates the toolbox
 */

'use strict';
const path = require('path')
    , fse = require('fs-extra')
    , handlebars = require('handlebars')
    , settings = require('./settings.js')
    ;
const templatesPath = "batch/templates";

function determineOutputPath(raw){
  const dir = raw.indexOf('/') > -1 ? false : '.'
      , p = dir ?  path.join(dir, raw) : raw;
  return p
}

const createToolbox = exports;

let objects // the complete set of input objects
  , currentColour = 6
  , colourIncrement = 3
  ;

/**
 * objects is an object containing definition objects found in the Swagger file.
 * 
 * See exploreSwagger.js file for details
 */
  

createToolbox.create = async function _createToolbox(jsonFilePath) {
  objects = JSON.parse(await fse.readFile(jsonFilePath));
  // ref: project-builder-1 index.html, assets/blocks.js, assets/blocks-code.js

  /**
   * Change control characters to their escape sequence
   * Escape " characters too.
   */
  handlebars.registerHelper('escape', function(s) {
    if (s) {
      let o = s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\"/g, '\\"');
      return new handlebars.SafeString(o);
    } else {
      return ''
    }
  });
  // See https://stackoverflow.com/a/47686619/64904
  handlebars.registerHelper('eq', function () {
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.every(function (expression) {
        return args[0] === expression;
    });
  });


  await createBlocks();
  await createToolboxXml(); 
  await createBlockCode();  
}

/**
 * Create the block JavaScript definitions
 * 
 * Ref https://developers.google.com/blockly/guides/create-custom-blocks/define-blocks
 */
async function createBlocks(){
  log('Starting to create blocks.js');
  let fd = await fse.open(settings.blocksjsPath, 'w');
  await fse.write(fd, (await hbsCompile('blocks_header'))());
  await fse.write(fd, (await hbsCompile('blocks_createEnvelope'))());
  objects.CreateEnvelope.colour = 0; // Same as in blocks_createEnvelope
  await fse.write(fd, (await hbsCompile('blocks_recipientViewRequest'))());
  objects.recipientViewRequest.colour = 3; // Same as in blocks_recipientViewRequest
  await fse.write(fd, (await hbsCompile('blocks_propertyMetadata_options'))());

  // Compile the container and attribute blocks
  const containerBlock = await hbsCompile('blocks_container')
      , scalarBlock    = await hbsCompile('blocks_scalar')
      , objArray = Object.keys(objects).filter(k => objects[k].items.length > 0)
      , objArrayAlpha = objArray.sort((a, b) => objects[a].label.toLowerCase() < objects[b].label.toLowerCase() ? -1 : 1)
      ;
  
  for (const i in objArrayAlpha) {
    await createObjBlocks({block: objects[objArrayAlpha[i]], fd, containerBlock, scalarBlock})
  }
  await fse.write(fd, (await hbsCompile('blocks_footer'))());
  await fse.close(fd);
  log('Finished creating blocks.js');
}

async function createObjBlocks({block, fd, containerBlock, scalarBlock}) {
  // Special case the top two blocks for createEnvelope and recipientView
  const name = block.name 
      , specials = {
        recipientViewRequest: {doContainer: false, specialParent: 'createEnvelope', colour: 3},
        CreateEnvelope:       {doContainer: false, specialParent: 'createEnvelope', colour: 0, specialName: 'createEnvelope'},
        envelopeDefinition:   {doContainer: false, specialParent: 'createEnvelope', colour: 0, specialName: 'createEnvelope'},
      }

  // Add container
  if (!specials[name]) {
    await fse.write(fd, containerBlock({block: block, colour: currentColour}));
  }

  // Add scalars
  if (specials[name]) {
    const special = specials[name];
    block.specialParent = special.specialParent;
    block.colour = special.colour;
    if (special.specialName) {block.specialName = special.specialName};
  } else {
    block.colour = currentColour;
    currentColour += colourIncrement;
  }
  await fse.write(fd, scalarBlock({block: block, colour: block.colour}));  
}

/**
 * Reads a handlebars file from the templates directory, compiles it, returns the
 * compiled template.
 * @returns {*} compiled handlebars template
 * @param {string} hbs Name of a handlebars file in the templates directory 
 */
async function hbsCompile(hbs){
  const input = await fse.readFile(path.join(templatesPath, `${hbs}.hbs`), "utf8");
  return handlebars.compile(input);
}


/**
 * Create the Toolbox xml file
 * 
 */
async function createToolboxXml(){
  log('Starting to create toolbox.xml');

  let fd = await fse.open(settings.toolboxXmlPath, 'w');
  await fse.write(fd, (await hbsCompile('toolbox_header'))());
  // Compile the templates
  const categoryXml   = await hbsCompile('toolbox_category')
      , categoryQpXml = await hbsCompile('toolbox_category_qp')
      ;

  // Create Envelope toolbox xml:
  const qpItems = objects.CreateEnvelope.items
      , attrItems = objects.envelopeDefinition.items
      , attrItems2 = attrItems.sort((a, b) => a.itemLabel < b.itemLabel ? -1 : 1)
      //, attrItems3 = attrItems2.filter(i => i.itemName != "status")
      , data = {label: 'Create envelope', 
                colour: objects.CreateEnvelope.colour, 
                qp: qpItems.sort((a, b) => a.itemLabel.toLowerCase() < b.itemLabel.toLowerCase() ? -1 : 1),
                qpPrefix: 'CreateEnvelope',
                attr: attrItems2,
                attrPrefix: 'envelopeDefinition', 
                includeContainer: false // don't include envelope container,
                                        // it's in the workspaceBlocks (toolbox_header)
             }
  await fse.write(fd, categoryQpXml(data));
  objects.recipientViewRequest.label = "Embedded signing ceremony";
  await fse.write(fd, categoryXml(objects.recipientViewRequest));
  
  // Write out the envelope objects
  const processedObj = {CreateEnvelope: 1, envelopeDefinition: 1, recipientViewRequest: 1}
      , envObjects = Object.keys(objects).filter(i => !processedObj[i] && objects[i].items.length > 0).
          sort((a, b) => objects[a].label.toLowerCase() < objects[b].label.toLowerCase() ? -1 : 1)
      ;
  envObjects.forEach(await (async attr => fse.write(fd, categoryXml(objects[attr]))));

  await fse.write(fd, (await hbsCompile('toolbox_footer'))());
  await fse.close(fd);
  log('Finished creating toolbox.xml');
}

/**
 * Create the block JavaScript code functions
 * 
 * Ref https://developers.google.com/blockly/guides/create-custom-blocks/define-blocks
 */
async function createBlockCode(){
  log('Starting to create block-code.js');
  const containerBlock         = await hbsCompile('blocks_code_container')
      , envelopeContainerBlock = await hbsCompile('blocks_code_envelope_container')
      , scalarBlock            = await hbsCompile('blocks_code_scalar')
      ;

  let fd = await fse.open(settings.blocksCodejsPath, 'w');
  await fse.write(fd, (await hbsCompile('blocks_code_header'))());    
  await fse.write(fd, envelopeContainerBlock({
          name: 'createEnvelope',
          output: 'new docusign.EnvelopePlusJSON()'
          }));

  const objArray = Object.keys(objects).filter(k => objects[k].items.length > 0)
      , objArrayAlpha = objArray.sort((a, b) => objects[a].label.toLowerCase() < objects[b].label.toLowerCase() ? -1 : 1)
      ;
  
  for (const i in objArrayAlpha) {
    await createObjCodeBlocks({block: objects[objArrayAlpha[i]], fd, containerBlock, scalarBlock})
  }
  await fse.write(fd, (await hbsCompile('blocks_code_footer'))());    
  await fse.close(fd);
  log('Finished creating block-code.js');
}

async function createObjCodeBlocks({block, fd, containerBlock, scalarBlock}) {
  // Special case the top two blocks for createEnvelope and recipientView
  const name = block.name 
      , specials = {
        recipientViewRequest: {doContainer: true},
        CreateEnvelope:       {doContainer: false},
        envelopeDefinition:   {doContainer: false},
      }

  // Add container
  if (!specials[name] || specials[name].doContainer) {
    await fse.write(fd, containerBlock(block));
  }

  // Add scalar attributes
  // Note: the scalarBlock template special cases the CreateEnvelope and envelopeDefinition scalars.
  await fse.write(fd, scalarBlock(block));  
}


function log(m) {
  console.log(`${new Date().toUTCString()} ${m}`);
}

