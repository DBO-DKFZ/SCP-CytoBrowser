/**
 * Namespace for handling the metadata of a slide.
 * @namespace metadataHandler
 */
const metadataHandler = (function() {
    let _metadataValues = {};
    // Can come up with a more thorough way of doing this if needed
    const _units = {
        "nm": 1e-9,
        "µm": 1e-6,
        "mm": 1e-3,
        "m": 1,
        "km": 1e3,
        "Mm": 1e6,
        "Gm": 1e9
    };

    /**
     * @Roman - modified function
     * Included patient metadata as well as survey answers if a question is already filled out
     * and an answer is available on the server. 
     */
    function _metadataValuesAsReadable() {
        
        const res =
            _metadataValues.SizeX &&
            _metadataValues.SizeY &&
            {
                x: _metadataValues.SizeX,
                y: _metadataValues.SizeY,
                z: _metadataValues.SizeZ || "-"
        };
        const size =
            _metadataValues.PhysicalSizeX &&
            _metadataValues.PhysicalSizeY &&
            _metadataValues.PhysicalSizeXUnit &&
            _metadataValues.PhysicalSizeYUnit &&
            {
                x: Number((res.x * _metadataValues.PhysicalSizeX).toPrecision(4)) + "&thinsp;" + _metadataValues.PhysicalSizeXUnit,
                y: Number((res.y * _metadataValues.PhysicalSizeY).toPrecision(4)) + "&thinsp;" + _metadataValues.PhysicalSizeYUnit
        };
        const date = _metadataValues.AcquisitionDate;
        const microscope = _metadataValues.MicroscopeModel;
        const magnification = _metadataValues.NominalMagnification;
        const sigbits = _metadataValues.SignificantBits;
        const nChannels = _metadataValues.SizeC;
        
        // @Roman - added code block for patient metadata
        const yearOfBirth = _metadataValues.YearOfBirth;
        const approxAge = _metadataValues.ApproxAge;
        const gender = _metadataValues.Gender;
        const skinType = _metadataValues.SkinType;
        const personalHistory = _metadataValues.PersonalHistory;
        const familyHistory = _metadataValues.FamilyHistory;
        const location = _metadataValues.Location;
        
        // @Roman - added code block for survey answer
        const surveyDiagnosis = _metadataValues.surveyAnswer?.diagnosis;
        const surveyConfidence = _metadataValues.surveyAnswer?.confidence;
        const surveyProblemsImgQuality = _metadataValues.surveyAnswer?.problemsImgQuality;
        const surveyComment = _metadataValues.surveyAnswer?.comment;
                
        const readableValues = {
            resolution: res ? `${res.x} &#215; ${res.y} &#215; ${res.z}` : "-",
            size: size ? `${size.x} &#215; ${size.y}` : "-",
            date: date ? date : "-",
            microscope: microscope ? microscope : "-",
            magnification: magnification ? `${magnification}x` : "-",
            sigbits: sigbits ? `${sigbits} bits` : "-",
            nChannels: nChannels ? nChannels : "-", 
            
            // @Roman - added code block for patient metadata
            yearOfBirth: yearOfBirth ? yearOfBirth : "-",
            approxAge: approxAge ? approxAge : "-",
            gender: gender ? gender : "-",
            skinType: skinType ? skinType : "-",
            personalHistory: personalHistory ? personalHistory : "-",
            familyHistory: familyHistory ? familyHistory : "-",
            location: location ? location : "-",
            
            // @Roman - added code block for survey answer
            surveyDiagnosis: surveyDiagnosis ? surveyDiagnosis : null,
            surveyConfidence: surveyConfidence ? surveyConfidence : null,
            surveyProblemsImgQuality: surveyProblemsImgQuality ? surveyProblemsImgQuality : null,
            surveyComment: surveyComment ? surveyComment : null,

        };
        return readableValues;
    }

    /**
     * @Roman - modified function
     * added custom patient metadata fields
     */
    function _updateDisplayedMetadataValues() {
        const readableValues = _metadataValuesAsReadable();
        $("#metadata_resolution").html(readableValues.resolution);
        $("#metadata_size").html(readableValues.size);
        $("#metadata_date").html(readableValues.date);
        $("#metadata_microscope").html(readableValues.microscope);
        $("#metadata_magnification").html(readableValues.magnification);
        $("#metadata_sigbits").html(readableValues.sigbits);
        $("#metadata_nchannels").html(readableValues.nChannels);
        
        // @Roman - added code block for patient metadata
        $("#metadata_year_of_birth").html(readableValues.yearOfBirth);
        $("#metadata_approx_age").html(readableValues.approxAge);
        $("#metadata_gender").html(readableValues.gender);
        $("#metadata_skin_type").html(readableValues.skinType);
        $("#metadata_personal_history").html(readableValues.personalHistory);
        $("#metadata_family_history").html(readableValues.familyHistory);
        $("#metadata_location").html(readableValues.location);
        
        // @Roman - added code block for survey answer
        if (readableValues.surveyDiagnosis !== null && readableValues.surveyConfidence !== null &&
            readableValues.surveyProblemsImgQuality !== null && readableValues.surveyComment !== null) {
            
            setRadioButton("diagnosisRadioGroup", readableValues.surveyDiagnosis);
            setRadioButton("confidenceRadioGroup", readableValues.surveyConfidence);
            setRadioButton("qualityRadioGroup", readableValues.surveyProblemsImgQuality);
            document.getElementById('commentsInput').value = readableValues.surveyComment;

            surveyHandler.setSaved(true);
        }
    }
    
    /**
     * @Roman - added function
     * Sets a radio button in a radio group 'radioGroupName' if that radio button has the 
     * same value as 'radioBtnValue'
     */
    function setRadioButton(radioGroupName, radioBtnValue) {
        var radios = document.getElementsByName(radioGroupName);
        for( i = 0; i < radios.length; i++ ) {
            if( radios[i].value === radioBtnValue) {
                radios[i].checked = true;
            }
        }
    }
    
    function _updateScalebar() {
        if (_metadataValues.PhysicalSizeX && _metadataValues.PhysicalSizeXUnit) {
            const size = _metadataValues.PhysicalSizeX;
            const scale = _units[_metadataValues.PhysicalSizeXUnit];
            const metersPerPixel = size * scale;
            const pixelsPerMeter = 1 / metersPerPixel;
            tmapp.updateScalebar(pixelsPerMeter);
        }
    }

    /**
     * Update the metadata values and display them in the user interface.
     * Values that are not specified will remain as they are.
     * @param {Object} newValues New values for some or all of the
     * metadata values.
     */
    function updateMetadataValues(newValues) {
        Object.assign(_metadataValues, newValues);
        _updateDisplayedMetadataValues();
        _updateScalebar();
    }

    /**
     * Clear the currently set metadata.
     **/
    function clear() {
        _metadataValues = {};
        _updateDisplayedMetadataValues();
        _updateScalebar();
    }

    return {
        updateMetadataValues: updateMetadataValues,
        clear: clear
    };
})();
