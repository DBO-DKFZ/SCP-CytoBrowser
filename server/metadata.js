/**
 * @module metadata
 * @desc Module for handling metadata on the server. This module both
 * contains logic for the server's handling of metadata and for preparation
 * of abridged JSON-formatted metadata from OME-XML files. This second
 * functionality can be used by calling the module itself as the point
 * of entry.
 */

const fs = require("fs");
const {XMLParser} = require('fast-xml-parser');

const metadataCache = {};
const metadataExpirationTime = 60000; // Let the cache expire after 30s
let jsonDir;

function xmlToObject(xmlData) {
    const options = {
        attributeNamePrefix: "@_",
        ignoreAttributes: false,
        allowBooleanAttributes: true,
        parseAttributeValue: true
    };
    const parser = new XMLParser(options);
    return parser.parse(xmlData);
}

/**
 * @Roman - modified function
 * added support for patient metadata 
 */
function extractImportantMetadata(jsonData) {

    const imageData = jsonData["OME"]["Image"].find(im => im["@_ID"] === "Image:0");
    const annoData = jsonData["OME"]["StructuredAnnotations"]["CommentAnnotation"]; // MODIFIED
    const importantMetadata = {
        
        MicroscopeModel: jsonData["OME"]["Instrument"] && jsonData["OME"]["Instrument"]["Microscope"], 
        NominalMagnification: jsonData["OME"]["Instrument"] && jsonData["OME"]["Instrument"]["Objective"]["@_NominalMagnification"],
        AcquisitionDate: imageData["AcquisitionDate"],
        PhysicalSizeX: imageData["Pixels"]["@_PhysicalSizeX"],
        PhysicalSizeY: imageData["Pixels"]["@_PhysicalSizeY"],
        PhysicalSizeXUnit: imageData["Pixels"]["@_PhysicalSizeXUnit"],
        PhysicalSizeYUnit: imageData["Pixels"]["@_PhysicalSizeYUnit"],
        SignificantBits: imageData["Pixels"]["@_SignificantBits"],
        SizeC: imageData["Pixels"]["@_SizeC"],
        SizeX: imageData["Pixels"]["@_SizeX"],
        SizeY: imageData["Pixels"]["@_SizeY"],
        SizeZ: imageData["Pixels"]["@_SizeZ"],
        
        YearOfBirth: annoData.find(item => item["@_ID"] === "Annotation:YearOfBirth")["Value"],
        ApproxAge: annoData.find(item => item["@_ID"] === "Annotation:ApproxAge")["Value"],
        Gender: annoData.find(item => item["@_ID"] === "Annotation:Gender")["Value"],
        SkinType: annoData.find(item => item["@_ID"] === "Annotation:SkinType")["Value"],
        PersonalHistory: annoData.find(item => item["@_ID"] === "Annotation:PersonalHistory")["Value"],
        FamilyHistory: annoData.find(item => item["@_ID"] === "Annotation:FamilyHistory")["Value"],
        Location: annoData.find(item => item["@_ID"] === "Annotation:Location")["Value"],
    };
    return importantMetadata;s
}

/**
 * @Roman - modified function
 * Get important metadata that corresponds to a specified image.
 * @param {string} imageName The name of the image.
 * @returns {Object} Relevant metadata for the image.
 *
 * Also get survey answer if the file exists.
 */
function getMetadataForImage(imageName) {

    const filename = `${jsonDir}/${imageName}.json`;
    let data = {};
    
    // load metadata (technical and patient)
    try {
        data = JSON.parse(fs.readFileSync(filename));
        console.log(`Loading metadata from ${filename}`);
    }
    catch (e) {
        if (e.code === "ENOENT") {
            console.log(`No metadata file: ${filename}`);
        }
        else {
            throw e;
        }
    }
    
    // load survey answer 
    try {
        data["surveyAnswer"] = autosave.loadSurveyAnswer(imageName);
        console.log(`Loading survey answer for ${imageName}`);
    }
    catch (e) {
        if (e.code === "ENOENT") {
            data["surveyAnswer"] = {};
            console.log(`No survey answer file for: ${imageName}`);
        }
        else {
            throw e;
        }
    }

    return data;
}

function main() {
    const argv = require("minimist")(process.argv.slice(2));
    if (argv.h || argv.help || argv._.length !== 2) {
        console.info("Usage: node metadata.js omexml-dir json-dir");
        return;
    }
    else {
        const inputDir = argv._[0];
        const outputDir = argv._[1];
        const inputFilenames = fs.readdirSync(inputDir).filter(fn => fn.endsWith(".ome.xml"));
        inputFilenames.forEach(fn => {
            const path = `${inputDir}/${fn}`;
            const outputFilename = `${fn.slice(0, -8)}.json`;
            const outputPath = `${outputDir}/${outputFilename}`;
            const xmlData = fs.readFileSync(path, "utf8");
            const data = xmlToObject(xmlData);
            const importantData = extractImportantMetadata(data);
            fs.writeFileSync(outputPath, JSON.stringify(importantData, null, 4));
        });
    }
}

/**
 * @Roman - modified
 * include autosaveDir parameter as this files requires functions from the autosave module.
 */
module.exports = function(dir, autosaveDir) {
    jsonDir = dir;
    autosave = require("./autosave")(autosaveDir);
    return {
        getMetadataForImage: getMetadataForImage
    }
};


if (require.main === module) {
    main();
}
