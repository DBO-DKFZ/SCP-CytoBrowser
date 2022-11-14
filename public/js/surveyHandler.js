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
            document.getElementById("surveyFormSaveBtn").disabled = true;
        } else {
            document.getElementById("surveySaveState").innerHTML = "*Unsaved";
            document.getElementById("surveyFormSaveBtn").disabled = false;
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
        var problemsImgQuality = document.querySelector('input[name="qualityRadioGroup"]:checked').value;
        var comments = document.getElementById("commentsInput").value

        // construct survey answer object
        const answer = {
            "imgId": imgId, 
            "diagnosis": diagnosis,
            "confidence": confidence,
            "problemsImgQuality": problemsImgQuality,
            "comments": comments
        };

        // notify collab client for backend messaging and processing
        collabClient.addSurveyAnswer(answer);

        // mark survey state as saved
        setSaved(true);
    };
    
    /**
     * Gets the name of adjacent (previous or next) image
     * If no image is adjacent, undefined is returned.
     * @param {boolean} getNext If true, the next image is returned, otherwise the previous image is returned.
     */
    function getAdjacentImage(getNext=true){

        let imageNames = tmapp.getImageNames()
        let currentImageName = tmapp.getImageName()
        
        let currentIdx = imageNames.indexOf(currentImageName);        
        if (currentIdx === -1) {
            console.log(`Image ${currentImageName} cannot be found`);
            return;
        }

        let adjacentIdx = getNext ? ++currentIdx : --currentIdx;
        let adjacentImageName = imageNames[adjacentIdx];
        if (adjacentImageName === undefined) {
            return;
        } 

        return adjacentImageName;
    }
    
    /**
     * Sets button accessibility (enabled or disabled) for the next and previous buttons.
     */
    function setNextPrevBtnAccess() {
        // next image button
        let nextImage = getAdjacentImage(true);
        if (nextImage === undefined) {
            document.getElementById("surveyNextBtn").disabled = true;
            console.log(`Reached end of list and cannot go forth`);
        } 
        else {
            document.getElementById("surveyNextBtn").disabled = false;
        }
        
        // previous image button
        let prevImage = getAdjacentImage(false);
        if (prevImage === undefined) {
            document.getElementById("surveyPrevBtn").disabled = true;
            console.log(`Reached start of list and cannot go back`);
        } 
        else {
            document.getElementById("surveyPrevBtn").disabled = false;
        }
    }
    
    /**
     * Open adjacent (previous or next) image 
     * @param {boolean} openNext If true, the next image is opened, otherwise the previous image is opened.
     */
    function openAdjacentImage(openNext=true) {
        let adjacentImage = getAdjacentImage(openNext)
        if (adjacentImage !== undefined) {
            collabPicker.open(adjacentImage, false, false);
        }
    }
    
    return {
        resetSurveyForm,
        isEmpty,
        isSaved,
        setSaved,
        updateSurveyStatus,
        saveSurveyAnswer,
        setNextPrevBtnAccess,
        openAdjacentImage,
    };
})();



 




