/**
 * @Roman - added script
 * Handles the storage of the custom survey for pathologists
 * Saved manually instead of using the autosave functionality
 * which makes form validation easier. 
 */

const surveyHandler = (function (){
    "use strict";

    /**
     * Checks if survey is empty. Ignores the pre-filled quality field. 
     */
    function isEmpty() {
        var diagnosis = document.querySelector('input[name="diagnosisRadioGroup"]:checked')?.value || "";
        var confidence = document.querySelector('input[name="confidenceRadioGroup"]:checked')?.value || "";
        return diagnosis.length === 0 && confidence.length === 0;
    };
    
    /**
     * Checks if the survey was saved
     */
    
    var saved = false;
    function isSaved() {
        return saved
    };
    function setSaved(value) {
        saved = value
    }
    
    /**
     * Resets the survey form and 'save' variable
     */
    function resetSurveyForm() {
        document.getElementById("surveyForm").reset();
        setSaved(false);
    };

    return {
        resetSurveyForm,
        isEmpty,
        isSaved,
        setSaved,
    };
})();

/**
 * Object which holds a single survey response
 */
class SurveyAnswer {
  constructor(imgId, diagnosis, confidence, problemsImgQuality, comments) {
    this.imgId = imgId;
    this.diagnosis = diagnosis;
    this.confidence = confidence;
    this.problemsImgQuality = problemsImgQuality;
    this.comments = comments;
  }
};

/**
 * Function which gets called when the survey is submitted by the user
 */
function saveSurveyAnswer() {
    
    // get form content
    var imgId = document.getElementById("img_name").innerHTML;
    var diagnosis = document.querySelector('input[name="diagnosisRadioGroup"]:checked').value;
    var confidence = document.querySelector('input[name="confidenceRadioGroup"]:checked').value;
    var quality = document.querySelector('input[name="qualityRadioGroup"]:checked').value;
    var comments = document.getElementById("commentsInput").value
    
    // construct survey answer object
    answer = new SurveyAnswer(imgId, diagnosis, confidence, quality, comments);
    
    // notify collab client for backend messaging and processing
    collabClient.addSurveyAnswer(answer);
    
    // mark survey state as saved
    surveyHandler.setSaved(true);

};
 




