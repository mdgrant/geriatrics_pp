(function ( $ ) {

    // Popover for answer suggestion
    const answerSuggestPrefix = 'answerSuggest_q';
    const defaultQuestionLimit = 300;
    let showCopyAllSuggestions = false;

    function getStore() {
        // Store the local db seed in sessionstorage for different calls
        const seedName = 'asSeed';
        if (!sessionStorage.getItem(seedName)) {
            let seed = String(Math.random());

            sessionStorage.setItem(seedName, seed);
            let store = localforage.createInstance({
                name: 'answerSuggest',
                storeName: seed
            });
            $(window).on('beforeunload', () => {
                sessionStorage.removeItem(seedName);
                store.dropInstance();
            })

            return store;
        };

        let seed = sessionStorage.getItem(seedName);
        
        // this doesn't create a new instance but instead returns the existing one
        return localforage.createInstance({
            name: 'answerSuggest',
            storeName: seed
        });
    }
    
    function combineSimilarAnswers(answers) {
        // populate object with question/answer data as keys
        // return combined values
        let answerObj = answers.reduce((obj, ans) => {
            let key = [ans.question_text, ans.question_header];
            if (ans.answers && Array.isArray(ans.answers)) {
                let filteredAnswers = ans.answers.map(({ value, has_text }) => [value, has_text]);
                key = [...key, ...filteredAnswers];
            } else {
                key = [...key, ans.value, ans.has_text];
            }
            key = JSON.stringify(key).toLowerCase();
            
            let newVal = ans;
            if (obj[key]) {
                newVal = [].concat(obj[key], ans);
            };
            return {
                ...obj,
                [key]: newVal
            };
        }, {});
        return Object.values(answerObj);
    }
    
    // Sort matches by Question Score (desc), Answer Score (desc), Number of Occurrences (desc), Submission Time (desc)
    // Return: > 0 => sort a after b | < 0 => sort a before b | == 0 => keep original order of a and b
    function sortQAOD(a, b) {
        let aLen = 0, bLen = 0;
        //Get first of similar occurrences
        if (Array.isArray(a)){
            aLen = a.length;
            a = a[0];
        }
        if (Array.isArray(b)){
            bLen = b.length;
            b = b[0];
        }
        let aAnsScore, bAnsScore;
        //check answer score for checkboxes vs non-checkboxes
        if (a.answers){
            let aAns = Array.isArray(a.answers) ? a.answers[0] : a.answers;
            aAnsScore = aAns && aAns.answer_score ? aAns.answer_score : 0;
        } else {
            aAnsScore = a.answer_score ? a.answer_score : 0;
        }
        if (b.answers){
            let bAns = Array.isArray(b.answers) ? b.answers[0] : b.answers;
            bAnsScore = bAns && bAns.answer_score ? bAns.answer_score : 0;
        } else {
            bAnsScore = b.answer_score ? b.answer_score : 0;
        }

        return b.question_score - a.question_score ||  bAnsScore - aAnsScore || bLen - aLen || new Date(b.submission_time) - new Date(a.submission_time);
    }

    function initPopover(qid, $target) {
        let store = getStore();
        let refid = $target.data("refid");
        store.getItem(answerSuggestPrefix + qid).then((answerSuggest) => {
            const ellipsis = function (text) {
                if (text && text.length > 70) return `<span title="${text}"> ${text.substring(0, 70)}... </span>`;
                return text;
            }

            // setup suggested answers
            let content = `<div>`;
            let matches = combineSimilarAnswers(answerSuggest.matches);
            // sort matches 
            matches.sort(sortQAOD);
            matches.forEach((match, ind) => {
                let ans = Array.isArray(match) ? match[0] : match;
                let answerValue = ans.value;

                // format answer values including checkboxes/has_texts
                if (ans.answers && Array.isArray(ans.answers)) {
                    answerValue = ans.answers.map(({ has_text, value }) => {
                        if (has_text) {
                            return value + ': ' + has_text
                        }
                        return value;
                    }).join(', ');
                } else if (ans.has_text) {
                    answerValue += (': ' + ans.has_text);
                }
                
                let projectHTML;
                if (Array.isArray(match)) {
                    // sort SimilarAnswers 
                    match.sort(sortQAOD);
                    projectHTML = `
                        <a class="btn project-collapse" 
                            data-toggle="collapse"
                            data-target="#collapseq${qid}a${ind}"
                            role="button" 
                            aria-expanded="false"
                            aria-controls="collapseq${qid}a${ind}"
                        >
                            <span class="glyphicon glyphicon-chevron-right"></span>
                            ${match.length} Occurrences
                        </a>
                        <div class="collapse project-row" id="collapseq${qid}a${ind}">
                            ${match.map((val) => (`
                                <div>${ellipsis(val.project_name)} : ${ellipsis(val.level_name)} : ${ellipsis(val.form_name)}</div>
                                <div class="project-user">${ellipsis(val.user_name)} ${val.submission_time == '' ? '' : ": " + ellipsis(val.submission_time)}</div>
                            `)).join(' ')}
                        </div>
                    `;
                } else {
                    projectHTML = `
                        <div>${ellipsis(ans.project_name)} : ${ellipsis(ans.level_name)} : ${ellipsis(ans.form_name)}</div>
                        <div class="project-user">${ellipsis(ans.user_name)} ${ans.submission_time == '' ? '' : ": " + ellipsis(ans.submission_time)}</div>
                    `;
                }
                
                content += `<div class="card" rel="popover-answers-q${qid}">
                                <div class="card-body"> 
                                    <div><b class="question_text">${ellipsis(ans.question_text)}</b></div> 
                                    <div><b>${ellipsis(answerValue)}</b></div>
                                    ${projectHTML}
                                </div> 
                                <div class="copy-icon" title="Copy Answer" data-qid="q${qid}" data-ind="${ind}"><i class="fas fa-copy"></i></div>
                            </div>`;
            })
            content += "</div>";

            $target.bstooltip({
                placement: "right",
                trigger: "manual",
                title: "Answer suggestions available"
            });

            // set popover
            $target.popover({
                html: true,
                container: 'body',
                toggle: "popover",
                trigger: "manual",
                title: '<span> Copy answer from CuratorCR </span> <span style="cursor: pointer;" class="close-popover"><i class="fas fa-window-close"></i></span>',
                content: content,
                placement: 'top'
            }).on("show.bs.popover", function () {
                $('.popover').not($target).popover('hide');
            }).on("inserted.bs.popover", function () {
                // add click listeners
                $(`.copy-icon[data-qid="q${qid}"]`).on('click', function () {
                    let match = matches[parseInt($(this).data('ind'))];
                    let answer = Array.isArray(match) ? match[0] : match;
                    let exactMatch = answer.exact_match;
                    if (answer.answers && Array.isArray(answer.answers)) {
                        exactMatch = answer.answers.every(({ exact_match }) => exact_match);
                    }
                    let res = setAnswersAlert(
                        "r" + refid + "q" + qid,
                        answerSuggest.type,
                        answer
                    );
                    if (!res.success) {
                        $target.attr("error", true);
                        $target.data("bs.tooltip").options.title = "Some data could not be copied: " + res.error + ".";
                        $target.bstooltip("fixTitle");
                        $("#q" + qid + "_icon").find("img").attr("src", "/images/lightbulb_icon_red.png"); // change icon to red (error)
                    } else if (!exactMatch) {
                        $target.data("bs.tooltip").options.title = "Answer suggestion used was not an exact match";
                        $target.bstooltip("fixTitle");
                        $("#q" + qid + "_icon").find("img").attr("src", "/images/lightbulb_icon_orange.png"); // change icon to orange (partial match)
                    } else {
                        $target.data("bs.tooltip").options.title = "Answer suggestion used";
                        $target.bstooltip("fixTitle");
                        $("#q" + qid + "_icon").find("img").attr("src", "/images/lightbulb_icon_dsr_blue.png"); // change icon to dsr blue
                    }
                    $('.popover').popover('hide');
                });
                $('.close-popover').on('click', function () {
                    $('.popover').popover('hide');
                })
            });

            $target.on("mouseover", function () {
                if (!$(`.card[rel="popover-answers-q${qid}"]`).length) {
                    $target.bstooltip("show");
                }
            });
            $target.on("mouseleave", function () {
                $target.bstooltip("hide");
            });

            $target.on("click", function () {
                if ($target.attr("error")) {
                    $target.removeAttr("error");
                    $target.data("bs.tooltip").options.title = "Answer suggestions available";
                    $target.bstooltip("fixTitle");
                    $("#q" + qid + "_icon").find("img").attr("src", "/images/lightbulb_icon_blue.png");
                }
                $target.bstooltip("hide");
                $target.popover('toggle');
            });
        });
    };

    function copyError(code) {
        return ({
            // fallback error message
            0: "an error has occurred",
            // for text answers, could not find html element
            1: "could not find text input",
            // for text (date) answers, the given date does not match format
            2: "date format is invalid",
            // for text answers, input is invalid (type mismatch, bounds, etc)
            3: "text validation error",
            // attempting to input into a calculated answer
            4: "cannot modify calculated value",
            // passing multiple answers into text/radio question (normally for checkboxes)
            5: "multiple answers selected",
            // passing has_text values into a select2 question
            6: "picker does not accept text labels",
            // has_text could not be inserted (invalid, input html does not exist, etc)
            7: "invalid text label",
            // has_text could not be inserted for checkbox
            8: "invalid text labels",
            // radio/checkbox answer html element could not be found
            9: "answer(s) could not be found",
        })[code];
    }
    
    // helper func for text inputs
    function inputTextAfterValidation($el, value) {
        if (!$el || $el.length === 0) return copyError(1);
        if ($el.data('datepicker')) {
            // check for valid date (not caught by input validation)
            if (!dayjs(value).isValid()) return copyError(2);
            $el.datepicker('setDate', dayjs(value).toDate());
            return false;
        }
        const prev = $el.val();
        $el.val(value);
        // input text answer, check validation, undo if invalid
        if (!$el.valid()) {
            $el.val(prev).trigger('change');
            return copyError(3);
        }
        // check for calculated value
        if (runCalculations) {
            runCalculations();
            if ($el.val() !== value) return copyError(4);
        }
    
        return false;
    }
    
    function copyAnswersToForm(rqID, type, match) {
        Distiller.registerTelemetryEvent(
            "Answer Suggestions",
            "Copy to Form",
            "Answer Suggestion Used",
            1
        );

        Distiller.registerTelemetryEvent(
            "Answer Suggestions",
            "Copy to Form",
            "Which Answer Suggestion Used",
            match.question_score*100
        );

        type = parseInt(type);
    
        const { 
            answers,
            html_id: htmlId, 
            has_text: textLabel, 
            value 
        } = match;
    
        if (answers && Array.isArray(answers)) {
            // only checkboxes use multiple answers
            if (type !== 2) return copyError(5);
    
            // select2
            let $selectEl = $(`select#${rqID}`);
            if ($selectEl.length > 0) {
    
                onlyIds = answers.map(({ html_id }) => html_id);
                $selectEl.val(onlyIds);
                if (!$selectEl.val() || $selectEl.val().length !== onlyIds.length) return copyError(9);
                // check for calculated value
                if (runCalculations) {
                    runCalculations();
                    if (onlyIds.sort().toString() !== $selectEl.select2('data').map(({ id }) => id).sort().toString()) {
                        return copyError(4);
                    }
                }
                // trigger display new value
                try { $selectEl.trigger('change'); } catch (e) { };
                // select2 does not support text labels
                if (answers.some(({ has_text }) => has_text && has_text.length > 0)) return copyError(6);
    
                return false;
            }
    
            // for each checkbox, check/uncheck where answers match
            let count = 0, err = null;
            if ($(`input[name='${rqID}[]']`).length === 0) return copyError(9);
            $(`input[name='${rqID}[]']`).each(function () {
                let match = !!answers.some(({ html_id }) => html_id === $(this).attr('id'));
                $(this).prop('checked', match);
                if (runCalculations) {
                    runCalculations();
                    if ($(this).prop('checked') !== match) {
                        err = 4;
                        return false;
                    }
                }
                if (match) count++;
            });
            if (err) return copyError(err);
    
            // fill text labels
            if (answers.some(({ html_id, has_text }) => (
                has_text && inputTextAfterValidation($(`#${html_id}text`), has_text)
            ))) return copyError(8);
    
            // if some answers weren't found, display warning
            if (answers.length > count) return copyError(9);
            return false;
        }
    
        if (type === 3) { // text
            return inputTextAfterValidation($(`#${htmlId}`), value);
        }
    
        if (type === 1) { // radio
            let $selectEl = $(`select#${rqID}`);
            if ($selectEl.length > 0) {
                // select2
                if ($selectEl.data('select2')) {
                    $selectEl.val(htmlId);
                    if (!$selectEl.select2('data')[0] || !$selectEl.select2('data')[0].id) return copyError(9);
                    // check for calculated value
                    if (runCalculations) {
                        runCalculations();
                        if ($selectEl.select2('data')[0].id !== htmlId) return copyError(4);
                    }
                    // trigger display new value
                    try { $selectEl.trigger('change'); } catch (e) { };
                    if (textLabel) {
                        const pickerTextId = $selectEl.select2('data')[0].id + 'text';
                        $(`#${pickerTextId}`).val(textLabel);
                    }
    
                    return false;
                }
                // dropdown
                $selectEl.val(htmlId);
                if (!$selectEl.val()) return copyError(9);
                // check for calculated value
                if (runCalculations) {
                    runCalculations();
                    if ($selectEl.val() !== htmlId) return copyError(4);
                }
                // trigger display text input
                try { $selectEl.trigger('change'); } catch (e) { };
                if (textLabel && inputTextAfterValidation($(`#${htmlId}text`), textLabel)) return copyError(7);
                return false;
            }
    
            let $radioEl = $(`#${htmlId}`);
            if ($radioEl.length === 0) return copyError(9);
            $radioEl.prop('checked', true);
            // check for calculated value
            if (runCalculations) {
                runCalculations();
                if (!$radioEl.prop('checked')) return copyError(4);
            }
    
            // fill text labels
            if (textLabel && inputTextAfterValidation($(`#${htmlId}text`), textLabel)) return copyError(7);
    
            return false;
        }
    
        return copyError(0);
    }
    
    // returns false if the answer couldn't fully copy
    function setAnswers(rqID, type, answer) {
        return copyAnswersToForm(rqID, type, answer) === false;
    }
    
    // same thing as setAnswers, but show alert on error
    function setAnswersAlert(rqID, type, answer) {
        let res = copyAnswersToForm(rqID, type, answer);
        if (res !== false) {

            Distiller.registerTelemetryEvent(
                "Answer Suggestions",
                "Copy to Form",
                "Answer Suggestion Failed",
                1
            );

            alertify.error("Some data could not be copied: " + res + ".");
            return {success: false, error: res};
        }
        alertify.success("Data copied successfully.");
        return {success: true};
    }

    // reset answer suggestions icon to regular blue after editing a question
    $.fn.clearCopiedStatus = function (click = false) {
        // if we only clicked a text input, don't do anything
        if (click && $(this).attr('type') === 'text') return;

        if ($(this).attr('name').toString() != "") {
            // get question number from html_id
            let qNumString = $(this).attr('name').toString().split(/[a-z]/)[2] || "";
            let qNum = qNumString.replace('[]','');

            if (qNum != "" && !$(`#q${qNum}_icon`).attr('error')) {
                if($(`#q${qNum}_icon`).data("bs.tooltip")) {
                    $(`#q${qNum}_icon`).data("bs.tooltip").options.title = "Answer suggestion available";
                }
                $(`#q${qNum}_icon`).bstooltip("fixTitle");
                $(`#q${qNum}_icon`).find("img").attr("src", "/images/lightbulb_icon_blue.png");
            }
        }
    }

    // check if a question is already filled in
    function checkForExistingAnswers(qid) {
        return (
            $(`#answer_box_div_${qid} input`).is(':checked') || (
                $(`#answer_box_div_${qid} input[type='text']`).length > 0 &&
                $(`#answer_box_div_${qid} input[type='text']`).val().length > 0
            ) || (
                $(`#answer_box_div_${qid} select option`).is(':checked') && $(`#answer_box_div_${qid} select option:checked`).val().length > 0
            ) || (
                $(`#answer_box_div_${qid} span.select2-selection__rendered`).text().length > 0 && $(`#answer_box_div_${qid} span.select2-selection__placeholder`).length === 0
            )
        );
    }
    
    // Copy All Suggestions to form
    $.fn.copyAllAnswersToForm = function () {
        let store = getStore();
        store.keys().then((keys) => { 
            keys.forEach((key) => {
                if (key.indexOf(answerSuggestPrefix) === 0) {
                    store.getItem(key).then((answerSuggestForQuestion) => {
                        const qid = key.replace(answerSuggestPrefix,'');
                        if (checkForExistingAnswers(qid)) {
                            return;
                        }
                        const type = answerSuggestForQuestion['type'];
                        let matches = answerSuggestForQuestion['matches'];
                        let rqID = '', exactMatch = false;
                        if (matches.length > 0) {
                            matches = combineSimilarAnswers(matches);
                            matches.sort(sortQAOD);
                            let match = matches[0];
                            if (Array.isArray(matches[0]) && matches[0].length > 0) {
                                match = matches[0][0];
                            }
                            switch (type) {
                                // checkbox
                                case "2":
                                    const answers = match['answers'];
                                    if (answers.length > 0) {
                                        const htmlId = answers[0]['html_id'];
                                        rqID = htmlId.substr(0, htmlId.indexOf('a'));
                                        exactMatch = answers[0]['exact_match'];
                                    }
                                    break;
                                // radio
                                case "1":
                                    const htmlId = match['html_id'];
                                    rqID = htmlId.substr(0, htmlId.indexOf('a'));
                                    exactMatch = match['exact_match'];
                                    break;
                                // text
                                default:
                                    rqID = match['html_id'];
                                    exactMatch = match['exact_match'];
                                    break;
                            }
                            let res = copyAnswersToForm(rqID, type, match), icon = $(`#q${qid}_icon`);
                            if (res !== false) {
                                icon.attr("error", true);
                                icon.data("bs.tooltip").options.title = "Some data could not be copied: " + res.error + ".";
                                icon.bstooltip("fixTitle");
                                icon.find("img").attr("src", "/images/lightbulb_icon_red.png");
                            } else if (!exactMatch) {
                                icon.data("bs.tooltip").options.title = "Answer suggestion used was not an exact match";
                                icon.bstooltip("fixTitle");
                                icon.find("img").attr("src", "/images/lightbulb_icon_orange.png");
                            } else {
                                icon.data("bs.tooltip").options.title = "Answer suggestion used";
                                icon.bstooltip("fixTitle");
                                icon.find("img").attr("src", "/images/lightbulb_icon_dsr_blue.png");
                            }
                        }
                    });
                }
            });
        });
    }

    // Get Answer Suggestions from CuratorCR
    $.fn.getAnswerSuggestions = function (offset = 0, questionsLimit = defaultQuestionLimit) {
        let store = getStore();
        // use cr-answers-loading loader for first Answer Suggestions search
        if(questionsLimit == defaultQuestionLimit) $('.cr-answers-loading').removeClass('hidden');
        const limit = 20;
        let nomatches = 0;

        let url = window.location.search;
        let urlParams = new URLSearchParams(url);
        let refid = urlParams.get("refid");
        let formid = urlParams.get("formid");
        let levelid = urlParams.get("levelid");

        let link = "refid=" + refid + "&levelid=" + levelid + "&formid=" + formid;
        if (levelid === null) {
            let setid = urlParams.get("set_id");
            link = "setid=" + setid;
        }

        let curQuestionsCount = $('#data-cr-qcount').val();
        $.get({
            url: "/Submit/ajax/AnswerSuggest.php?" + link + "&offset=" + offset + "&limit=" + limit,
            cache: false,
            tryCount : 0,
            retryLimit : 3,
            timeout: 10000,
            success: function (data) {
                data = JSON.parse(data);
                for (let key in data) {
                    //No answers in Curator
                    if(data[key]["matches"].length === 0){
                        nomatches++;
                        continue;
                    }
                    showCopyAllSuggestions = true;

                    let qid = key.replace('q','');
                    //Save to storage
                    store.setItem(answerSuggestPrefix + qid, data[key]).then(() => {
                        //Update icons, init popover
                        let iconId = `#q${qid}_icon`;
                        $(iconId).removeClass("hidden");
                        initPopover(qid, $(iconId));
                    });
                }

                let questionsWithAnswers = (Object.keys(data).length - nomatches) / Object.keys(data).length * 100;

                Distiller.registerTelemetryEvent(
                    "Answer Suggestions",
                    "AnswerSuggest",
                    "Questions with Answer Suggestions",
                    questionsWithAnswers
                );

                offset += limit;

                if (offset < curQuestionsCount && offset < questionsLimit) {
                    $.fn.getAnswerSuggestions(offset, questionsLimit);
                } else {
                    // update loader on searching Answer Suggestions end
                    if (questionsLimit <= offset && offset < curQuestionsCount) {
                        //change loader to button
                        $('.fas.fa-spinner.fa-spin').addClass("hidden");
                        $('.cr-answers-loading').removeClass("cr-loading");
                        $('.cr-answers-loading').addClass('cont_search_btn');
                        $('.cr-loading-text').text(`Continue Searching`);

                        // Enable next batch of question search
                        $('.cr-answers-loading').off().on('click', function () {
                            //change to loader
                            $('.fas.fa-spinner.fa-spin').removeClass("hidden");
                            $('.cr-answers-loading').removeClass("cont_search_btn");
                            $('.cr-answers-loading').addClass("cr-loading");
                            $('.cr-loading-text').text(`Checking CuratorCR for Next ${defaultQuestionLimit} Questions ...`);
                            // run Answer Suggestions search with increased limit
                            $.fn.getAnswerSuggestions(offset, questionsLimit + defaultQuestionLimit);
                        });
                        alertify.success(`Completed searching for ${offset} questions. `);
                    } else {
                        $('.cr-answers-loading').addClass('hidden');
                        if (showCopyAllSuggestions) {
                            $('.copy-all-suggestions').removeClass("hidden");
                            $('.copy-all-suggestions-tooltip').removeClass("hidden");
                        }
                    }
                }
            },
            error: function (xhr, errMsg) {
                if (xhr.status !== 500) {
                    this.tryCount++;
                    if (this.tryCount <= this.retryLimit) {
                        //try again
                        $.ajax(this);
                    }
                }
                // hide loader on searching Answer Suggestions error
                $('.cr-answers-loading').addClass('hidden');
                alertify.error("Something went wrong trying to suggest Answers.");
            }
        });
    }

}( jQuery ));
