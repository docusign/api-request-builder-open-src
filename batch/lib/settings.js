// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
/**
 * @file settings.js
 * @author DocuSign
 * @see <a href="https://developers.docusign.com">DocuSign Developer Center</a>
 */

'use strict';
const settings = exports;

settings.swaggerFile = "esignature.rest.swagger-v2.1.json";
// The following are all relative to the app's root
settings.swaggerFileOutput = "batch/output/swagger_file_output.json"; 
settings.parentsOutput =  "src/lib/parents.json";
settings.childrenOutput = "src/lib/children.json";
settings.childObjAttrOutput = "src/lib/childObjAttr.json";
settings.autoContainersOutput = "src/lib/autoContainers.json";

settings.blocksCodejsPath = "src/components/Blockly/blocks-code.js";
settings.toolboxXmlPath = "src/components/Blockly/toolbox.xml";
settings.blocksjsPath = "src/components/Blockly/blocks.js";

// properties to be deleted from the original Swagger file
settings.swaggerDelete = [
  (swagger) => delete swagger.definitions.envelopeDefinition.properties.eventNotifications
];

// inline objects that are handled specially as an item entry and in blocks_code_scalar.hbs and blocks_scalar.hbs
// These are the inline objects that appear more than once in a given object
// If the exploreSwagger.js file finds an inline object that should be added as an item and is not in this
// list then we have a problen
settings.inlineObjects = {propertyMetadata: true, smartSectionAnchorPosition: true};

// extra includes -- blocks that need to be explicity added as an item for an object.
// These are secondary objects that are inline. Eg, the items for an array of scalar
settings.extraIncludes = {propertyMetadata: 'propertyMetadata_options'};

// readonly attributes never need to be set in the request, so we don't include them
// format: parentObject: {attributeName: true}
settings.readonly = {
  agent: {recipientAuthenticationStatus: true},
  carbonCopy: {recipientAuthenticationStatus: true},
  certifiedDelivery: {recipientAuthenticationStatus: true},
  editor: {recipientAuthenticationStatus: true},
  inPersonSigner: {recipientAuthenticationStatus: true},
  notaryHost: {recipientAuthenticationStatus: true},
  intermediary: {recipientAuthenticationStatus: true},
  sealSign: {recipientAuthenticationStatus: true},
  signer: {recipientAuthenticationStatus: true},
  witness: {recipientAuthenticationStatus: true},
  nameValue: {errorDetails: true}
}


