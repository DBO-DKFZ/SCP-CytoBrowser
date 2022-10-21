/**
 * @module surveyStatus
 * @desc Used to look up the survey status which contains information
 * about the survey in general and the progress of the individual user.
 */

// Declare required modules
const fs = require("fs");

// Directory where survey answers can be found
let collabDir;

// Variable to store status of survey
const surveyStatus = {
    completedQuestions: {},
    nOfQuestions: 0,
    nOfCompletedQuestions: 0,
    nOfRemainingQuestions: 0,
    pctComplete: 0,
}

/**
 * Function which gets and returns information about
 * the current survey status. Information includes:
 * completedQuestions: dict where key=questionId and value=true/false
 * Information about the total number of questions, number of unanswered
 * and answered questions. 
 */
function getSurveyStatus() {
    
    const allQuestions = availableImages().images;
    const completedQuestions = new Set(fs.readdirSync(collabDir));
    let nOfQuestions = 0;
    let nOfCompletedQuestions = 0;
    let nOfRemainingQuestions = 0;
    let pctComplete = 0;
    
    Object.values(allQuestions).forEach(question => {
        
        nOfQuestions++;
        if (completedQuestions.has(question.name)) {
            nOfCompletedQuestions++;
            surveyStatus.completedQuestions[question.name] = true;
        } 
        else {
            nOfRemainingQuestions++;
            surveyStatus.completedQuestions[question.name] = false;
        }        
    });
    
    if (nOfQuestions !== 0) {
        pctComplete = (nOfCompletedQuestions / nOfQuestions) * 100;
    }

    surveyStatus.nOfQuestions = nOfQuestions;
    surveyStatus.nOfCompletedQuestions = nOfCompletedQuestions;
    surveyStatus.nOfRemainingQuestions = nOfRemainingQuestions;
    surveyStatus.pctComplete = Math.floor(pctComplete);

    console.log(surveyStatus);
    console.assert(nOfQuestions === nOfCompletedQuestions + nOfRemainingQuestions, 
                   `Total questions (${nOfQuestions}) does not equal the sum of ` +
                   `answered (${nOfCompletedQuestions}) and unanswered (${nOfRemainingQuestions}) questions.`);
    
    console.log(surveyStatus);
    return surveyStatus;
}

module.exports = function(dir, dataDir) {
    if (!dir || typeof dir !== "string") {
        throw new Error("A collab directory has to be specified.");
    }
    collabDir = dir;
    availableImages = require("./availableImages")(dataDir);

    return getSurveyStatus;
}