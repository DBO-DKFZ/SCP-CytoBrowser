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
        if (saved === true) {
            document.getElementById("surveySaveState").innerHTML = "Saved";
        } else {
            document.getElementById("surveySaveState").innerHTML = "Unsaved";
        }
    }
    
    /**
     * Resets the survey form and 'save' variable
     */
    function resetSurveyForm() {
        document.getElementById("surveyForm").reset();
        setSaved(false);
    };
    
    /**
     * the Image Browser modal window using information
     * provided through the surveyStatus parameter. 
     */
    function _addSurveyStatusOverlay(surveyStatus) {
        
        const cards = $("#available_images").find(".card");
        
        Object.values(cards).forEach(card => {
            const cardLink = $(card).find(".card-link")[0];
            
            // null or undefined check
            if (cardLink) {
                const cardLinkText = cardLink.text.trim();
                if (surveyStatus.completedQuestions[cardLinkText]) {
                    card.classList?.add("questionComplete");
                    cardLink.classList?.add("questionCompleteText");
                } 
                else {
                    card.classList?.remove("questionComplete");
                    cardLink.classList?.remove("questionCompleteText");
                }
            }
        })
        
        document.getElementById("image_browser_title").textContent =  `Select an image | ` +
            `Completed: ${surveyStatus.pctComplete}%` 
    }
    
    /**
     * Calls to the backend to get the current survey status
     * which then gets used to update the Image Browser modal 
     * window to reflect the user's current progress
     */
    function updateSurveyStatus() {
        
        // Initiate a HTTP request and send it to the survey status info endpoint
        const surveyStatusReq = new XMLHttpRequest();
        surveyStatusReq.open("GET", window.location.api + "/survey/status", true);
        // Turn off caching of response
        surveyStatusReq.setRequestHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0"); // HTTP 1.1
        surveyStatusReq.setRequestHeader("Pragma", "no-cache"); // HTTP 1.0
        surveyStatusReq.setRequestHeader("Expires", "0"); // Proxies

        surveyStatusReq.send(null);

        surveyStatusReq.onreadystatechange = function() {
            if (surveyStatusReq.readyState !== 4) {
                return;
            }
            switch (surveyStatusReq.status) {
                case 200:
                    const surveyStatus = JSON.parse(surveyStatusReq.responseText);
                    _addSurveyStatusOverlay(surveyStatus);
                    break;
                case 500:
                    console.log("Error in updateSurveyStatus()")
                    break;
                default:
                    console.log("Error in updateSurveyStatus()")
            }
        }
    }

    /**
     * Function which gets called when the survey is submitted by the user
     */
    function saveSurveyAnswer() {

        console.log(document.getElementById("surveySaveState").innerHTML);

        // get form content
        var imgId = document.getElementById("img_name").innerHTML;
        var diagnosis = document.querySelector('input[name="diagnosisRadioGroup"]:checked').value;
        var confidence = document.querySelector('input[name="confidenceRadioGroup"]:checked').value;
        var quality = document.querySelector('input[name="qualityRadioGroup"]:checked').value;
        var comments = document.getElementById("commentsInput").value

        // construct survey answer object
        const answer = {
            "imgId": imgId, 
            "diagnosis": diagnosis,
            "confidence": confidence,
            "quality": quality,
            "comments": comments
        };

        // notify collab client for backend messaging and processing
        collabClient.addSurveyAnswer(answer);

        // mark survey state as saved
        setSaved(true);
    };

    
    return {
        resetSurveyForm,
        isEmpty,
        isSaved,
        setSaved,
        updateSurveyStatus,
        saveSurveyAnswer,
    };
})();



 




