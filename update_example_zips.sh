#!/usr/bin/env bash

# This script updates the framework zip files.
#
# Run from within the root directory of this repo
SUB_DIR=${PWD##*/}
if [ ${SUB_DIR} != "api-request-builder" ] && [ ${SUB_DIR} != "api-request-builder-open-src" ];
then
    printf 'Problem! Current subdirectory is not "api-request-builder"!\n'
    printf 'Current subdirectory is: %s\n' "${SUB_DIR}"
    printf 'Exiting...\n\n'
    exit 1
fi

# Copy the document files
cp -f src/assets/documents/anchorfields.pdf src/assets/sdkExamples/NodeJS_example
cp -f src/assets/documents/blank.pdf        src/assets/sdkExamples/NodeJS_example
cp -f src/assets/documents/anchorfields.pdf src/assets/sdkExamples/PHP_example
cp -f src/assets/documents/blank.pdf        src/assets/sdkExamples/PHP_example
cp -f src/assets/documents/anchorfields.pdf src/assets/sdkExamples/PHP_example
cp -f src/assets/documents/blank.pdf        src/assets/sdkExamples/VB_example/VB_Example/assets
cp -f src/assets/documents/anchorfields.pdf src/assets/sdkExamples/VB_example/VB_Example/assets
cp -f src/assets/documents/blank.pdf        src/assets/sdkExamples/CSharp_example/CSharp_example/Resources
cp -f src/assets/documents/anchorfields.pdf src/assets/sdkExamples/CSharp_example/CSharp_example/Resources
cp -f src/assets/documents/blank.pdf        src/assets/sdkExamples/Java_example/src/main/resources
cp -f src/assets/documents/anchorfields.pdf src/assets/sdkExamples/Java_example/src/main/resources
cp -f src/assets/documents/blank.pdf        src/assets/sdkExamples/Python_example
cp -f src/assets/documents/anchorfields.pdf src/assets/sdkExamples/Python_example
cp -f src/assets/documents/blank.pdf        src/assets/sdkExamples/Ruby_example
cp -f src/assets/documents/anchorfields.pdf src/assets/sdkExamples/Ruby_example

# Delete library and other random files
rm -rf src/assets/sdkExamples/NodeJS_example/node_modules
rm -rf src/assets/sdkExamples/PHP_example/vendor
rm -rf src/assets/sdkExamples/VB_example/._.DS_Store
rm -rf src/assets/sdkExamples/VB_example/.DS_Store
rm -rf src/assets/sdkExamples/VB_example/VB_Example/.DS_Store
rm -rf src/assets/sdkExamples/VB_example/.vs
rm -rf src/assets/sdkExamples/VB_example/VB_Example/obj
rm -rf src/assets/sdkExamples/VB_example/VB_Example/bin
rm -rf src/assets/sdkExamples/CSharp_example/CSharp_example/obj
rm -rf src/assets/sdkExamples/CSharp_example/CSharp_example/bin
rm -rf src/assets/sdkExamples/CSharp_example/.vs
rm -rf src/assets/sdkExamples/CSharp_example/CSharp_example/._Program.cs
rm -rf src/assets/sdkExamples/CSharp_example/CSharp_example/Debug
rm -rf src/assets/sdkExamples/Java_example/target
rm -rf src/assets/sdkExamples/Ruby_example/Gemfile.lock
find src/assets/sdkExamples -type f -name .DS_Store -delete

# make the zip files
(cd src/assets/sdkExamples; zip -r -X NodeJS_example.zip NodeJS_example; mv NodeJS_example.zip .. )
(cd src/assets/sdkExamples; zip -r -X PHP_example.zip PHP_example; mv PHP_example.zip .. )
(cd src/assets/sdkExamples; zip -r -X VB_example.zip VB_example; mv VB_example.zip .. )
(cd src/assets/sdkExamples; zip -r -X CSharp_example.zip CSharp_example; mv CSharp_example.zip .. )
(cd src/assets/sdkExamples; zip -r -X Java_example.zip Java_example; mv Java_example.zip .. )
(cd src/assets/sdkExamples; zip -r -X Python_example.zip Python_example; mv Python_example.zip .. )
(cd src/assets/sdkExamples; zip -r -X Ruby_example.zip Ruby_example; mv Ruby_example.zip .. )

printf "Done. Have a nice day.\n\n"