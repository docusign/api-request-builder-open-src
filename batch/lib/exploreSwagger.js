// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
/**
 * @file exploreSwagger.js
 * @author DocuSign
 * @see <a href="https://developers.docusign.com">DocuSign Developer Center</a>
 * 
 * Creates the DS_SWAGGER_FILE_OUTPUT used by the createToolbox.js module.
 */

'use strict';
const pluralize = require('pluralize')
    , path = require('path')
    , fse = require('fs-extra')
    , decamelize = require('decamelize')
    , settings = require('./settings.js')
    ;

const exploreSwagger = exports;

const swagger = require(`../${settings.swaggerFile}`)
    , methodNames = [
      {path: "/v2.1/accounts/{accountId}/envelopes/{envelopeId}/views/recipient", op: "post", 
       name: "RecipientView", label: "Embedded signing ceremony", ancestor: "recipientViewRequest"},
      {path: "/v2.1/accounts/{accountId}/envelopes"                             , op: "post", 
       name: "CreateEnvelope", label: "Create envelope", ancestor: "createEnvelope"}
      ]
    
    ;

let objects = {}; 
/**
 * objects is an object containing definition objects found in the Swagger file.
 * Each entry is an object for the API:
 * {
 *    name: the name of the object. 
 *    label: the human-friendly name. Usually the same as name
 *    parent: the name of the parent object
 *    parentAttribute: the name of the attribute in the parent or name of the method
 *    parentAttributeType: string -- "object" | "array" | "query_parameters"
 *    arrayOfScalar: boolean -- is this object an arrayOfScalar?
 *    hasArrayOfObj: boolean -- does this object directly or indirectly hav an arrayOfObj attribute?
 *    ancestor: string: "createEnvelope" | "recipientViewRequest"
 *    level: <integer> how deep is this object definition? The root object is level 0
 *    description: string -- the description from the Swagger file
 *    items: <array> The children of the object: strings, booleans, etc. 
 *           Any object children that are objects or arraysOfObjects have their own entry in the 
 *           objects array. 
 *           Exception: if an object is used for multiple attributes of a parent, then the
 *                      object does not have necessarily have an entry in the objects list.
 *                      Instead, it will have multiple entries in the items list.
 *           Direct objects, as noted above, are in the items list if the object is used for 
 *           multiple attributes.
 *           arrayOfScalar are only in the items array
 *      Each item in the items array is an object:
 *      {
 *        itemName:
 *        itemLabel:
 *        itemType: 'string', 'boolean', 'list', 'number', object, arrayOfScalar
 *        itemObj: The object description for this item.
 *                 itemObj is only used if the item is complex (an array or object)
 *                 and is handled inline with the parent. 
 *                 Complex items are only handled inline if
 *                 1) it is an array of scalar
 *                 2) it is an object that does not have any arrayOfObj attributes 
 *        itemExtraInclude: -- an extra block to be included with this one. See settings.extraIncludes
 *        itemHasArrayOfObj: boolean -- does this item (which is an obj) include an arrayOfObj attribute?
 *        itemDescription: string -- the description from the Swagger file
 *        listItems: []
 *          listItems is only used for 'list' itemType.
 *          listItems is an array of listItem:
 *          {
 *            default: boolean -- Is this a default value?
 *            text: string -- what is shown in the drop down
 *            value: * -- the value that will be used in the API
 *          }
 *      }
 * }
 */
  

exploreSwagger.explore = async function main() {
  // initialization
  if (! settings.swaggerFile) {
    console.log (`\nProblem: you need to configure this example with a Swagger file
    via environment variables.\n
    See the README file for more information\n\n`);
    process.exit();
  }

  /**
   * Step 0: Some swagger fixes
   */
  settings.swaggerDelete.forEach(fn => {fn(swagger)});

  /**
   * Step 1: Explore the Swagger file
   */
  log('Starting method exploration');
  methodNames.forEach(methodName => exploreMethod(methodName)); 
  log(`Finished method exploration: ${Object.keys(objects).length} objects.\n`);
  // Write the output. Don't set output dir if already specified:
  await fse.writeFile(settings.swaggerFileOutput, JSON.stringify(objects, null, "   "));
  log (`Wrote Swagger file output to ${settings.swaggerFileOutput}`);
  console.log (`\n\nReport: arrayOfScalar attributes included with parents\n`)
  const keys = Object.keys(objects);
  let report1 = [];
  keys.forEach(key => {
    objects[key].items.forEach(item => 
      {if (item.itemObj && item.itemObj.arrayOfScalar) {
        report1.push({name: `${item.itemObj.name}`, attr: `${item.itemObj.parent}#${item.itemObj.parentAttribute}`})
      }
    })
  })
  report1.sort((a,b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1)
  report1.forEach(r => console.log(`name: ${r.name}, parent#attribute: ${r.attr}`));
  console.log (`\n`);
  invertTheTree();
  return settings.swaggerFileOutput
}

/**
 * exploreMethod handles the query parameters and then calls exploreObject for the
 * request object
 * @param {*} args 
 */
function exploreMethod({path, op, name, label, ancestor}) {
  log(`Exploring method ${name}`);

  const parameters = swagger.paths[path][op].parameters
      , qps = parameters.filter(p => p.in === "query")
      , requestObject = parameters.filter(p => p.in === "body")[0]
      , objectName = name; // + " query parameters";

  let object = {
    name: objectName,
    hasArrayOfObj: false,
    label: label,
    parent: null,
    arrayOfScalar: false,
    parentAttribute: name,
    parentAttributeType: "query_parameters",
    ancestor: ancestor,
    level: 0,
    description: swagger.paths[path][op].summary,
    items: []
  };
  
  // The method's query parameters
  qps.forEach(qp => {
    object.items.push({
      itemName: qp.name,
      itemLabel: makeLabel(qp.name),
      itemType: qp.type,
      itemHasArrayOfObj: null,
      itemDescription: qp.description || undefined
    })
  })
  
  //log(`    ${name}: ${object.items.length} query parameters`)
  if (object.items.length) {
    objects[name] = object   
  }

  // Next, explore the request object
  const objName = lastPart(requestObject.schema["$ref"]); // "#/definitions/envelopeDefinition"
  exploreObject({
    objName: objName, level: 1, 
    parent: name,  parentAttribute: requestObject.name,
    parentAttributeType: "object", ancestor: ancestor
   });
   log(`Completed exploration of method ${name}`);
  }

/**
 * exploreObject recursivly examines the objects and their descendents
 * @param {*} args 
 */
function exploreObject(args){
  const {objName, level, parent, parentAttribute, parentAttributeType, ancestor} = args;
  const indent = '   '.repeat(level);

  if (objects.hasOwnProperty(objName)) {
    // Not logging the skipped objects.
    // log(`${indent} Exploring object ${objName}`);
    // log(`${indent} Skipping object, already processed.`);
    return
  } // stop circular recursion
  else {log(`${indent} Exploring object ${objName}`)}

  const obj = swagger.definitions[objName]
      , type = obj.type
      , expectedObjectType = type === "object"
      , properties = obj.properties // an object
      ;
  let propertyKeys = Object.keys(properties);
  // Remove any readOnly attributes
  propertyKeys = propertyKeys.filter (key => {
    const del = settings.readonly[objName] && settings.readonly[objName][key];
    if (del) {log(`${indent} REMOVED read only attribute ${key}`)}
    return !del
  })

  const scalarPropertyKeys = propertyKeys.filter(k => (
          properties[k].type != "array" && properties[k]['$ref'] == undefined))
      , complexPropertyKeys = propertyKeys.filter(k => (
          properties[k].type == "array" || properties[k]['$ref']))
      , arrayOfObjPropertyKeys =  propertyKeys.filter(k => (
          properties[k].type == "array" && properties[k]['items']['$ref']))
      , object = {
          name: objName,
          label: makeLabel (objName),
          arrayOfScalar: false,
          hasArrayOfObj: arrayOfObjPropertyKeys.length > 0,
          parent: parent,
          ancestor: ancestor,
          parentAttribute: parentAttribute,
          parentAttributeType: parentAttributeType,
          level: level,
          description: obj.description || undefined,
          items: []
        }
      ;

  if (!expectedObjectType) {
    log(`${indent} #### Unexpected object type: ${type}\n\n`)
  }

  // Compute initial set of items (from the scalar attributes)
  object.items = scalarPropertyKeys.map(k => {
    const property = properties[k]
        , propType = property.type
    if (propType === "string" || propType === "integer" || propType === "number") {
      return {
        itemName: k,
        itemLabel: makeLabel (k),
        itemHasArrayOfObj: null,
        itemType: propType,
        itemDescription: property.description || undefined
      }
    } else if (propType === "boolean") {
      return {
        itemName: k,
        itemLabel: makeLabel (k),
        itemType: propType,
        itemHasArrayOfObj: null,
        itemDescription: property.description || undefined,
        listItems: [
          {default: true, text: 'False', value: false},
          {default: false, text: 'True', value: true}
        ]
      }
    } else {
      log(`${indent} #### Unexpected scalar type found. Name: ${k}, type: ${propType}`);
      return
    }
  });

  // Store the object (which will also stop circular recursion)
  objects[objName] = object;

  // Recursion for the complex properties!
  complexPropertyKeys.forEach( k => {
    const isObj = properties[k]['$ref']
        , isArray = properties[k].type === "array"
        , isUknown = (isObj && isArray) || (!isObj && !isArray)
        , property = properties[k]
        ;
    let attributeObject; // The object definition of the attribute
    if (isUknown) {
      log(`${indent} #### Unknown type for complex property: '${k}'`)
    }
    const isArrayOfObj = isArray && properties[k]['items']['$ref'];
    
    if (isObj || isArrayOfObj) {
      const childName = isObj ? lastPart(properties[k]['$ref']) :
                                lastPart(properties[k]['items']['$ref']); // array
      const childIsDefined = swagger.definitions[childName];
      if (childIsDefined) {
        exploreObject({
          objName: childName, level: level + 1, 
          parent: objName,  parentAttribute: k,
          parentAttributeType: isObj ? "object" : "array",
          ancestor: ancestor
        })
        // clone the object
        attributeObject = objects[childName] && JSON.parse(JSON.stringify(objects[childName]))
        if (isObj && attributeObject && !attributeObject.hasArrayOfObj) {
          // Save the attributeObject definition with the current object
          // if it does not include an arrayOfObj
          object.items.push({
            itemObj: attributeObject,
            itemExtraInclude: settings.extraIncludes[attributeObject.name], 
            itemName: k,
            itemLabel: makeLabel (k),
            itemType: 'object',
            itemDescription: property.description || undefined    
          })
        }
      } else {
        log(`${indent} #### Child '${childName}' is not defined!`)
      }
    } else if (!isArrayOfObj) {
      // Handle the corner case of an Array of Scalar. It is only added as an Item
      const arrayScalarName = `${objName}_${k}`
          , o = {
              name: arrayScalarName,
              label: makeLabel (`${objName}_${k}`),
              parent: objName,
              arrayOfScalar: true,
              hasArrayOfObj: false,
              parentAttribute: k,
              parentAttributeType: "array",
              ancestor: ancestor,
              level: level + 1,
              description: properties[k].description || undefined,
              items: [{itemName: pluralize.singular(k),
                      itemHasArrayOfObj: false,
                      itemLabel: makeLabel (pluralize.singular(k)),
                      itemType: properties[k].items.type,
                      itemDescription: properties[k].description || undefined
                    }]
            }
      // Save the object definition with the current object
      object.items.push({
        itemObj: o,
        itemExtraInclude: `${o.name}__${o.items[0].itemName}`,
        itemName: k,
        itemLabel: makeLabel (k),
        itemType: 'arrayOfScalar',
        itemDescription: property.description || undefined    
      })
    }
  })
  
  // Next: remove object items if the object type only occurs once
  let objectCount = {};
  object.items.filter(o => o.itemType==='object').forEach(o => {
    objectCount[o.itemObj.name] = (objectCount[o.itemObj.name] || 0)+1});
  object.items = object.items.filter(o => {
    if (o.itemType == 'object' && objectCount[o.itemObj.name] > 1) {
      if(o.itemObj.name != 'propertyMetadata') {
        log (`${indent} Keeping item object name ${o.itemObj.name}, parent ${object.name} attribute ${o.itemName}`)
      }
      if (!settings.inlineObjects[o.itemObj.name]) {
        throw new Error(`Need to handle object  ${o.itemObj.name}. parent#attribute: ${o.itemObj.parent}.${o.itemObj.parentAttribute}!`)
      }
    }
    return o.itemType != 'object' || (o.itemType == 'object' && objectCount[o.itemObj.name] > 1)
  })
  // Remove the object from objects if it is used for multiple attributes in the parent
  Object.keys(objectCount).forEach (objKey => {
    if (objectCount[objKey] > 1) {delete objects[objKey]}
  })

  // Next: sort the items
  object.items.sort((a, b) => a.itemLabel.toLowerCase() < b.itemLabel.toLowerCase() ? -1 : 1)

  // Next: if more than one item has a particular itemExtraInclude, remove all but first
  let foundExtraIncludes = {};
  object.items.forEach( (item, i) => {
    if (!item.itemExtraInclude) {return}
    if (foundExtraIncludes[item.itemExtraInclude]) {
      // remove it
      object.items[i].itemExtraInclude = false;
      return;
    }
    foundExtraIncludes[item.itemExtraInclude] = true;
  })

}

function makeLabel(input) {
  let out;
  out = decamelize(input, );
  out = out.replace(/\_/g, ' '); // snake case
  return out
}


/** 
 * Creates additional Swagger summary files:
 *   * DS_PARENTS -- For each child object C, its potential parent objects, and the parent's attribute for the C object
 *   * DS_CHILDREN -- For each parent object P, its child objects C, the P attribute and C style (arrayOfObject, arrayOfScalar, object)   
 *   * DS_CHILD_OBJ_ATTR -- For each parent object P, its attributes A that contain an object or arrayOfObject, 
 *                          the object name and style for the attribute. Also the sdkObjectName (if different from the object name)
 *   * DS_AUTOCONTAINERS -- List of objects that can be auto-created.
 */
    
let parents = {} // the tree of objects with info on their parents
  , children = {} // info on the object's complex children
  , childrenObjAttributes = {}
  , autoContainers = [] // the objects that can be automatically created
  , objectNames // the names of the objects used directly or indirectly by the envelopeDefinition
  ; 

/**
 * We create an inverted tree version of the envelopeDefinition schema
 * 
 * The tree node format is an object with a property for each of the 
 * objects in the envelope definition.
 * 
 * The property for each object is an object of potential parents.
 * Each potential parent object that can contain the object is included with
 * value of the parent's attribute for the object
 */  

async function invertTheTree() {
  objectNames = Object.keys(objects);

  // initialization

  /**
   * Step 1: For each object, find its potential parents
   */
  log('Starting to create parents structure');
  findAllParents()
  log(`Finished.`);
  // Write the output. 
  await fse.writeFile(settings.parentsOutput, JSON.stringify(parents, null, "   "));
  log (`Wrote parents output to ${settings.parentsOutput}\n\n\n`);


  /**
   * Step 2: For each object, find its complex children (objects, arrays)
   */
  log('Starting to create children structure');
  findAllChildren()
  log(`Finished.`);
  // Write the output. 
  await fse.writeFile(settings.childrenOutput, JSON.stringify(children, null, "   "));
  log (`Wrote children output to ${settings.childrenOutput}\n\n\n`);

  /**
   * Step 3: For each parent object P, its attributes A that contain an object or arrayOfObject, 
   *         the object name and style for the attribute
   */
  log('Starting to create children object attributes structure');
  findAllChildrenObjAttributes()
  log(`Finished.`);
  // Write the output. 
  await fse.writeFile(settings.childObjAttrOutput, JSON.stringify(childrenObjAttributes, null, "   "));
  log (`Wrote children object attribute output to ${settings.childObjAttrOutput}\n\n\n`);

  /**
   * Step 4: autoContainers: the objects that can be automatically created
   */
  log('Starting to create autoContainers structure');
  findAllAutoContainers()
  log(`Finished.`);
  // Write the output. 
  await fse.writeFile(settings.autoContainersOutput, JSON.stringify(autoContainers, null, "   "));
  log (`Wrote autoContainer output to ${settings.autoContainersOutput}\n\n\n`);
}

/**
 * For each object in objects, search the definitions in the swagger file. 
 */
function findAllParents() {
  objectNames.forEach(name => findParents(objects[name]))
}
/**
 * 
 * @param {*} obj -- an object from the swagger_file_output.json 
 */
function findParents(obj){
  const name = obj.name
      , skip = {CreateEnvelope: true, envelopeDefinition: true, recipientViewRequest: true}
      , definitions = swagger.definitions
      ;
  logNoNL(`${name} `);
  if (skip[name]) {
    logNoNL(`skipping!\n`);
    return
  }
  
  let parentsTemp = {};
  if (obj.arrayOfScalar) {
    // The object only has one parent
    parentsTemp[obj.parent] = obj.parentAttribute
  } else {
    // Search through the Swagger definitions looking for all objects who have name as a child or an array of name.
    objectNames.forEach(searchName => {
      const skip2 = {CreateEnvelope: true, recipientViewRequest: true}
      if (skip2[searchName]) {return}
      if (objects[searchName].arrayOfScalar) {return} 
      const def = definitions[searchName]
          , properties = def.properties // an object
          , propertyKeys = Object.keys(properties)
          , complexPropertyKeys = propertyKeys.filter(k => (
              properties[k].type == "array" || properties[k]['$ref']))
          ;
    
      complexPropertyKeys.forEach(k => {
        const isObj = properties[k]['$ref']
            , isArray = properties[k].type === "array"
            , isArrayOfObj = isArray && properties[k]['items']['$ref']
            ;
        
        if (isObj || isArrayOfObj) {
          const childName = isObj ? lastPart(properties[k]['$ref']) :
                                    lastPart(properties[k]['items']['$ref']) // array
              , parent = childName == name
              ;
          if (parent) {
            parentsTemp[searchName] = k
            logNoNL(`.`);
          }
        }
      })  
    })
  }
  parents[name] = parentsTemp;
  logNoNL(`\n`);
}

/**
 * For each object in objects, search the definitions in the swagger file and object file. 
 */
function findAllChildren() {
  objectNames.forEach(name => findChildren(objects[name]))
}
/**
 * 
 * @param {*} obj -- an object from the swagger_file_output.json 
 */
function findChildren(obj){
  const name = obj.name
      , skip = {CreateEnvelope: true, recipientViewRequest: true}
      , definitions = swagger.definitions
      ;
  logNoNL(`${name} `);
  if (skip[name]) {
    logNoNL(`skipping!\n`);
    return
  }
  if (obj.arrayOfScalar) {
    logNoNL(`skipping array of scalar!\n`);
    return
  }
  
  let childrenTemp = {};
  const def = definitions[name]
      , properties = def.properties // an object
      , propertyKeys = Object.keys(properties)
      , complexPropertyKeys = propertyKeys.filter(k => (
            properties[k].type == "array" || properties[k]['$ref']))
      ;
  
  complexPropertyKeys.forEach(k => {
    const isObj = properties[k]['$ref']
        , isArray = properties[k].type === "array"
        , isArrayOfObj = isArray && properties[k]['items']['$ref']
        ;
    
    if (isObj || isArrayOfObj) {
      const childName = isObj ? lastPart(properties[k]['$ref']) :
                                lastPart(properties[k]['items']['$ref']) // array
          ;
      childrenTemp[childName] = {attribute: k, style: isObj ? "object" : "arrayOfObject"}
    } else if (!isObj && !isArrayOfObj) {
      childrenTemp[`${name}_${k}`] = {attribute: k, style: "arrayOfScalar"}
    }
    logNoNL('.');
  })
  // Only keep if there are children
  if (Object.keys(childrenTemp).length) {
    children[name] = childrenTemp
  } else {
    logNoNL('IGNORING (no children)')
  }
  logNoNL(`\n`);
}

/**
 * For each parent object P, all of its attributes A that contain an 
 * object or array (of Object or String or ?): 
 * the object name and style for that attribute
 */
function findAllChildrenObjAttributes() {
  // The keys are all objects that have one or more complex attributes.
  // This includes objects that are inline 
  const parentKeysHash = findAllParentObjects()
      , definitions = swagger.definitions
      , skip = {CreateEnvelope: true} //, envelopeDefinition: true, recipientViewRequest: true}

  // next, for each parent object, find all complex attributes
  // and add them to the output
  Object.keys(parentKeysHash).forEach(p => {
    if (skip[p]) {return}; // EARLY RETURN

    const def = definitions[p]
    , properties = def.properties // an object
    , propertyKeys = Object.keys(properties)
    , complexPropertyKeys = propertyKeys.filter(k => (
          properties[k].type == "array" || properties[k]['$ref']))
    ;

    complexPropertyKeys.forEach(k => {
      const isObj = properties[k]['$ref']
          , isArray = properties[k].type === "array"
          , isArrayOfObj = isArray && properties[k]['items']['$ref']
          ;
      
      if (isObj || isArrayOfObj) {
        const childName = isObj ? lastPart(properties[k]['$ref']) :
                                  lastPart(properties[k]['items']['$ref']) // array
            , def = definitions[childName]
            ;
        if (!childrenObjAttributes[p]) {childrenObjAttributes[p] = {}}
        childrenObjAttributes[p][k] = {itemType: isObj ? "object" : "arrayOfObject",
                                       objectName: childName};
        if (def) {
            let sdkObjectName = def['x-ds-definition-name'];
            if (childName === sdkObjectName) {sdkObjectName = null}
            if (sdkObjectName) {childrenObjAttributes[p][k].sdkObjectName = sdkObjectName}
        } else {log(`No swagger definition for ${childName}`)}
      } else if (!isObj && !isArrayOfObj) {
        if (!childrenObjAttributes[p]) {childrenObjAttributes[p] = {}}
        childrenObjAttributes[p][k] = {itemType: "arrayOfScalar",
                                       scalarType: properties[k].items.type}; 
      }
    })
  })
}

/**
 * Return keys that are all objects that have one or more complex attributes.
 * This includes objects that are inline
 * Do not include the "objects" that refer to arraysOfScalars.
 * @returns {object} parentKeysHash -- object with attributes of
 *                        {object: the object itself}
 */
function findAllParentObjects() {
  const parentKeysHash = {};

  /**
   * Add any inline arrays or objects to the parentKeysHash
   * @param {array} items array of a top level object 
   */
  function exploreItems(items) {
    items.forEach(item => {
      if (item.itemObj && !item.itemObj.arrayOfScalar ) {
        parentKeysHash[item.itemObj.name] = {object: item.itemObj};
        exploreItems(item.itemObj.items);
      }
    })
  }
  
  // Start
  objectNames.forEach(oName => {
    parentKeysHash[oName] = {object: objects[oName]};
    exploreItems(objects[oName].items);
  })

  return parentKeysHash
}

/**
 * Object with entries
 * 
 * object_name_that_can_be_auto_created: true
 */
function findAllAutoContainers() {
  // Find all objects with no scalar items
  // Plus a special container
  const special = "EnvelopeRecipients";
  autoContainers.push(special);
  objectNames.forEach(name => {
    if (objects[name].items.length == 0) {
      autoContainers.push(name);
    }
  })
}



function log(m) {
  console.log(`${new Date().toUTCString()} ${m}`);
}

function logNoNL(m){process.stdout.write(m)}

function lastPart(s) {
    // Get the last string demarcated by /.
    // See https://stackoverflow.com/a/12099341/64904
    return s.split('/').slice(-1)[0] 
}
