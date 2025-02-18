/**
 * @module autosave
 * @desc Module used to help with the autosave functionality of the
 * collaborations. Automatically sets and gets filenames for saves
 * based on the collaboration id and image, and stores it in the proper
 * location. Could potentially also be used for general storage of
 * objects with some other associated id and image.
 */

const fs = require("fs");
const fsPromises = fs.promises;
const sanitize = require("sanitize-filename");
const historyTracker = require("./historyTracker");

const idPattern = /(?<=_)[^_]*(?=\.json$)/;
let autosaveDir;

function getSubDirName(image) {
    const sanitizedImage = sanitize(String(image));
    return sanitizedImage;
}

function getFilename(id, image) {
    const sanitizedId = sanitize(String(id));
    const sanitizedImage = sanitize(String(image));
    return `${sanitizedImage}_${sanitizedId}`;
}

/**
 * @Roman - added function
 * Modification of 'getFilename'
 * Returns a filename specifically for the survey response.
 */
function getSurveyAnswerFilename(image) {
    const sanitizedImage = sanitize(String(image));
    return `${sanitizedImage}_survey_answer`;
}

/**
 * Load data from the autosave file structure.
 * @param {string} id The id of the collaboration.
 * @param {string} image The name of the image being saved.
 * @returns {Promise<Object>} Promise that resolves with the parsed data.
 */
function loadAnnotations(id, image) {
    const subDir = getSubDirName(image);
    const filename = getFilename(id, image);
    const path = `${autosaveDir}/${subDir}/${filename}.json`;
    return historyTracker.readLatestVersion(path);
}

/**
 * Save data in the autosave file structure.
 * @param {string} id The id of the collaboration.
 * @param {string} image The name of the image being saved.
 * @param {Object} data The data to be stored.
 * @returns {Promise} Promise that resolves once the data is stored.
 */
function saveAnnotations(id, image, data) {
    const subDir = getSubDirName(image);
    const filename = getFilename(id, image);
    const dir = `${autosaveDir}/${subDir}`;
    const path = `${autosaveDir}/${subDir}/${filename}.json`;
    return fsPromises.mkdir(dir, {recursive: true}).then(() => {
        return historyTracker.writeWithHistory(path, data);
    });
}

/**
 * @Roman - added function
 * Load survey answer
 * @param {string} image The name of the image being saved.
 * @returns {Promise<Object>} Promise that resolves with the parsed data.
 */
function loadSurveyAnswer(image) {
    const subDir = getSubDirName(image);
    const filename = getSurveyAnswerFilename(image);
    const path = `${autosaveDir}/${subDir}/${filename}.json`;
    return JSON.parse(fs.readFileSync(path));    
}

/**
 * @Roman - added function
 * Save survey answer data in a seperate file (i.e. not the same file as for annotations).
 * Use the historyTracker module as I don't want to make any mistakes while saving.
 * Also keep this function in the autosave file, even though it is not used for autosaving
 * but rather explicitly when the user clicks 'save' in the HTML form. 
 * @param {string} image The name of the image being saved.
 * @param {Object} surveyAnswer The survey answer to be stored.
 * @returns {Promise} Promise that resolves once the data is stored.
 */
function saveSurveyAnswer(image, surveyAnswer) {
    const subDir = getSubDirName(image);
    const filename = getSurveyAnswerFilename(image);
    const dir = `${autosaveDir}/${subDir}`;
    const path = `${autosaveDir}/${subDir}/${filename}.json`;
    return fsPromises.mkdir(dir, {recursive: true}).then(() => {
        return historyTracker.writeWithHistory(path, surveyAnswer);
    });
}

/**
 * Get a list of ids for the collaborations that have been saved in the
 * autosave directory for a given image.
 * @param {string} image The name of the image.
 * @returns {Promise<Array<Object>>} A promise that resolves with the
 * list of ids and their names.
 */
function getSavedCollabInfo(image) {
    const subDir = getSubDirName(image);
    const dir = `${autosaveDir}/${subDir}`;
    return fsPromises.readdir(dir).then(files => {
        files = files.filter(file =>
            idPattern.test(file) && !historyTracker.isHistoryFilename(file)
        );
        // Check the files and get their names
        const entries = files.map(file => {
            const path = `${dir}/${file}`;
            return fsPromises.readFile(path)
                .then(JSON.parse)
                .then(data => {
                    const id = file.match(idPattern)[0];
                    return {
                        id: id,
                        name: data.name ? data.name : id,
                        author: data.author,
                        createdOn: data.createdOn,
                        updatedOn: data.updatedOn,
                        nClasses: data.classConfig ? data.classConfig.length : 0, //0 = default (client side)
                        nAnnotations: data.nAnnotations,
                        nComments: data.nComments
                    };
                });
            });
        return Promise.all(entries);
    }).catch(err => {
        if (err.code === "ENOENT") {
            return [];
        }
        else {
            throw err;
        }
    });
}

/**
 * Get the available versions that can be reverted to for a given collaboration.
 * @param {string} id The id of the collaboration.
 * @param {string} image The name of the image.
 * @returns {Promise<Array<historyTracker.HistoryEntryInfo>>} Info for
 * each previous version for the given collaboration.
 */
function getAvailableVersions(id, image) {
    const subDir = getSubDirName(image);
    const filename = getFilename(id, image);
    const path = `${autosaveDir}/${subDir}/${filename}.json`;
    return historyTracker.getAvailableVersions(path);
}

/**
 * Revert the collaboration to a previous autosave.
 * @param {string} id The id of the collaboration.
 * @param {string} image The name of the image.
 * @param {number} versionId The id of the version to revert to.
 * @returns {Promise<>} A promise that resolves once the file has
 * been reverted to the specified version.
 */
function revertAnnotations(id, image, versionId) {
    const subDir = getSubDirName(image);
    const filename = getFilename(id, image);
    const path = `${autosaveDir}/${subDir}/${filename}.json`;
    return historyTracker.revertVersion(path, versionId);
}

/**
 * @Roman - added export to include 'saveSurveyAnswer' and 'loadSurveyAnswer'
 */
module.exports = function(dir) {
    if (!dir) {
        throw new Error("No autosave directory specified!");
    }
    autosaveDir = dir;
    fs.mkdirSync(autosaveDir, {recursive: true});
    return {
        loadAnnotations: loadAnnotations,
        saveAnnotations: saveAnnotations,
        getSavedCollabInfo: getSavedCollabInfo,
        getAvailableVersions: getAvailableVersions,
        revertAnnotations: revertAnnotations,
        saveSurveyAnswer: saveSurveyAnswer,
        loadSurveyAnswer: loadSurveyAnswer, 
    };
}
