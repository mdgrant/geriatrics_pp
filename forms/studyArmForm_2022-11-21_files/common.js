var DSR = {};

function addCommas(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

function lock_article(article_id, form_id, level_id) {

    var array = jQuery("#theform").serializeArray();
    var json = {};

    jQuery.each(array, function () {
        json[this.name] = this.value || '';
    });

    $.get(
        uncache("ajaxUpdateLocking.php?article_id=" + article_id + "&form_id=" + form_id + "&level_id=" + level_id),
        function() {
            setTimeout("lock_article(" + article_id + ", " + form_id + ", " + level_id + ")", 55000);
        }
    );
}

function start_locking(article_id, form_id, level_id) {
    setTimeout("lock_article(" + article_id + ", " + form_id + ", " + level_id + ")", 30000);
}


function uncache(url) {
    var d = new Date();
    var time = d.getTime();

    return url + "&time=" + time;

}

function popitup(link, name) {
    return window.open(link, name);
}

function clear_radio(name) {
    $(".other" + name).val("").trigger('keyup');

    $('.' + name).each(function () {
        this.checked = false;
    });

    $('#'+name).val('').trigger('change');
}

function handleKeyDown(e) {
    var ctrlPressed = 0;
    var altPressed = 0;
    var shiftPressed = 0;

    var evt = (e == null ? event : e);

    shiftPressed = evt.shiftKey;
    altPressed = evt.altKey;
    ctrlPressed = evt.ctrlKey;
    self.status = "" + "shiftKey=" + shiftPressed + ", altKey=" + altPressed + ", ctrlKey=" + ctrlPressed;

    if ((ctrlPressed) && altPressed && (evt.keyCode < 16 || evt.keyCode > 18) && fromKeyCode(evt.keyCode) == "K") {

        $(".keyword_highlight").toggleClass("override_keyword_highlighting");
    }
    return true;
}

document.onkeydown = handleKeyDown;

function isJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function init_submit_form() {

    var currentDate = new Date();
    millisAtStart = currentDate.valueOf();

    $('input[type=submit]').click(function () {
        $("input[type=submit]", $(this).parents("form")).removeAttr("clicked");
        $(this).attr('clicked', 'true');
    });

    //add method
    jQuery.validator.addMethod('atLeastOneChecked', function(value, element) {
        var checked = 0;
        var parent = $(element).closest('.answer');
        $(parent).find("input[type='"+$(element).attr("type")+"']").each(function () {
            if($(this).is(":checked")){
                checked ++;
            }
        });
        if(checked< 1){
            return false;
        } else {
            return true;
        }
    },"This field is required.");

    var validator = $("#theform").validate({

            highlight: function (element) {
                $(element).closest('.question_div').addClass('error');
                $(element).addClass('error');
            },
            unhighlight: function (element, e) {
                if ($(element).hasClass('otherbox')) {
                    if ($(element).closest('.question_div').find('label.error').length === 0) {
                        $(element).closest('.question_div').removeClass('error');
                    }
                } else {
                    $(element).closest('.question_div').removeClass('error');
                }
                $(element).removeClass('error');
            },
            submitHandler: function (form) {

                var btn = $(form).find('input[type=submit][clicked=true]');
                // var btn = $(form  + ' #' + document.activeElement.id);

                if (btn.attr('name') == 'saving') {
                    //define submit type
                    $('input[name="submit_type"]').val('save_only');
                } else {
                    //define submit type
                    $('input[name="submit_type"]').val('submit');
                }

                if ($(form).valid()) {
                    $('input[name="validated"]').val("1");
                } else {
                    $('input[name="validated"]').val("0");
                }

                checkTime();
                goodExit = true;

                $("#submit1").prop("disabled", true);
                $("#submit2").prop("disabled", true);
                $("#submit3").prop("disabled", true);
                $("#submit4").prop("disabled", true);
                setTimeout('$("#submit1").prop("disabled",false)', 10000);
                setTimeout('$("#submit2").prop("disabled",false)', 10000);
                setTimeout('$("#submit3").prop("disabled",false)', 10000);
                setTimeout('$("#submit4").prop("disabled",false)', 10000);

                form.submit();
            },
            errorPlacement: function (error, element) {
                if (element.attr('type') == 'checkbox' || element.attr('type') == 'radio') {
                    if($(element).closest('.inline')) {
                        element.closest('.inline').prepend(error);
                    }
                    if($(element).closest('.answer')) {
                        element.closest('.answer').prepend(error);
                    }
                } else {
                    if($(element).hasClass("isButton")){
                        error.insertAfter(element.closest('.radio-button'));
                    } else {
                        error.insertAfter(element);
                    }
                }
            },
            showErrors: function () {
                //do not show errors on saving
                var btn = $(document).find('form').find('input[type=submit][clicked=true]');
                if (btn.attr('name') != 'saving') {
                    this.defaultShowErrors();
                } else {
                    //remove all error msg
                    $("label.error").hide();
                    $(".error").removeClass("error");
                }
            }

        }
    );

    $(".otherradio").focus(function () {
        // click a radio's otherbox and you will clear the other ones
        var name = $(this).attr("name");
        var id = "#" + $(this).attr("id");
        name = name.substring(0, name.lastIndexOf("a"));
        $(".other" + name + ":not(" + id + ")").val("");
    });

    $(".otherbox").change(function () {
        // focus on an other box and you should make sure the element is checked
        if ($(this).val() != "") {
            var name = $(this).attr("name");
            name = name.replace("text", "");
            $("#" + name).attr('checked', true);
        }
    });

    $(".otherbox").keypress(function (e) {
        // focus on an other box and you should make sure the element is checked
        if (e.keyCode < 37 || e.keyCode > 40) {
            var name = $(this).attr("name");
            name = name.replace("text", "");
            $("#" + name).attr('checked', true);
        }
    });

    $(".radio").click(function () {
        //Radio click means clear all other boxes except the one on this question
        var name = $(this).attr("name");
        var id = "#" + $(this).attr("id") + "text";
        $(".other" + name + ":not(" + id + ")").val("");
    });

    $(".multioption").click(function () {
        // If you click and it's checked now focus
        // If you click and it's not checked now clear it
        if ($(this).attr("checked")) {
            var id = "#" + $(this).attr("id") + "text";
            $(id).focus();
        } else {
            var id = "#" + $(this).attr("id") + "text";
            $(id).val("").trigger("keyup");
        }
    });

    $(".delete_set").click(function () {

        var name = $(this).attr('name');

        alertify
            .okBtn('Yes')
            .cancelBtn('No')
            .confirm(
                'Are you sure you want to delete this data set?',
                function(){

                    $.ajax({
                        type: 'GET',
                        dataType: 'json',
                        url: '/ManageData/ajax/delete_response_sets.php?action=delete&set_id=' + name,
                        success: function (data) {

                            if (data.result === 'success') {

                                // Reload the page with added parameter to signal notification to user.
                                let params = getAllUrlParams();
                                window.location.href = '/Submit/ReviewArticles.php?filter=reviewed&delete_response_set=success&form=' + params.formid + '&level=' + params.levelid ;
                            } else if (data.result === 'unchanged' ) {

                                alertify.success(data.msg);
                                $('#theform').trigger('reset');
                            } else {

                                alertify.error(data.msg);
                            }
                        },
                        error: function () {

                            alertify.error('Delete failed.');
                        }
                    });
                }
            );
    });

    $(".clone_set").click(function () {
        var name = $(this).attr("name");
                // confirm dialog
        alertify
            .okBtn("Yes")
            .cancelBtn("No")
            .confirm("Are you sure you want to make an exact copy of this data set?<br/>", function () {
                // user clicked "ok"
                $.ajax({
                    type: "GET",
                    dataType: 'json',
                    url: "/Submit/ajax/DataExtractionCloneResponseSets.php?action=clone&set_id=" + name + "&submit=1",
                    success: function (data) {

                        if (data.result == 'success') {
                            // success notification
                            alertify.success("Set Cloned");
                            
                            if (typeof data.redirect_url!= 'undefined') {
                                //navigate to the new response
                                alertify
                                    .okBtn("Yes")
                                    .cancelBtn("No")
                                    .confirm("Do you want to navigate to the new response?<br/>", function () {
                                       //yes
                                       window.location.replace(data.redirect_url);
                                    }, function() {
                                       //no
                                       //do nothing
                                    });
                            }

                            

                        } else {
                            alertify.error("Clone Failed");
                            alertify.error(data.msg);
                        }
                    },
                    error: function () {
                        alertify.error("Clone Failed");
                    }
                });
               
                
        }, function () {
            // user clicked "cancel"
        });
    });


    window.onbeforeunload = function () {
        if (goodExit == true) {

            goodExit = true; //then that confirmation will not be asked

        } else {
            goodExit = true;
            return 'WARNING: Your changes to this form have not been saved'; //this will display on confirmation
        }
    }

}

function init_submit_form_title_screening() {

    var currentDate = new Date();
    millisAtStart = currentDate.valueOf();

    $('input[type=submit]').click(function () {
        $("input[type=submit]", $(this).parents("form")).removeAttr("clicked");
        $(this).attr('clicked', 'true');
    });

    var validator = $("#theform").validate({

            highlight: function (element) {
                $(element).parents('td').eq(1).find('.noscroll').addClass('error');
                $(element).addClass('error');
            },
            unhighlight: function (element, e) {
                $(element).parents('td').eq(1).find('.noscroll').removeClass('error');
                $(element).removeClass('error');
            },
            submitHandler: function (form) {

                var btn = $(form).find('input[type=submit][clicked=true]');

                if (btn.attr('name') == 'saving') {
                    //define submit type
                    $('input[name="submit_type"]').val('save_only');
                } else {
                    //define submit type
                    $('input[name="submit_type"]').val('submit');
                }

                if ($(form).valid()) {
                    $('input[name="validated"]').val("1");
                } else {
                    $('input[name="validated"]').val("0");
                }

                checkTime();
                goodExit = true;

                $("#submit1").prop("disabled", true);
                setTimeout('$("#submit1").prop("disabled",false)', 10000);

                form.submit();
            },
            errorPlacement: function (error, element) {
                if (element.attr('type') == 'checkbox' || element.attr('type') == 'radio') {
                    // error.insertBefore(element.closest('table'));
                    element.closest('.scrolling-class').prepend(error);
                } else {
                    error.insertBefore(element);
                }
            },
            showErrors: function () {
                //do not show errors on saving
                var btn = $(document).find('form').find('input[type=submit][clicked=true]');
                if (btn.attr('name') != 'saving') {
                    this.defaultShowErrors();
                } else {
                    //remove all error msg
                    $("label.error").hide();
                    $(".error").removeClass("error");
                }
            }

        }
    );

    $(".otherradio").focus(function () {
        // click a radio's otherbox and you will clear the other ones
        var name = $(this).attr("name");
        var id = "#" + $(this).attr("id");
        name = name.substring(0, name.lastIndexOf("a"));
        $(".other" + name + ":not(" + id + ")").val("");
    });

    $(".otherbox").change(function () {
        // focus on an other box and you should make sure the element is checked
        if ($(this).val() != "") {
            var name = $(this).attr("name");
            name = name.replace("text", "");
            $("#" + name).attr('checked', true);
            $("#" + name).valid();
        }
    });

    $(".otherbox").keypress(function (e) {
        // focus on an other box and you should make sure the element is checked
        if (e.keyCode < 37 || e.keyCode > 40) {
            var name = $(this).attr("name");
            name = name.replace("text", "");
            $("#" + name).attr('checked', true);
        }
    });

    $(".radio").click(function () {
        //Radio click means clear all other boxes except the one on this question
        var name = $(this).attr("name");
        var id = "#" + $(this).attr("id") + "text";
        $(".other" + name + ":not(" + id + ")").val("");
    });

    $(".multioption").click(function () {
        // If you click and it's checked now focus
        // If you click and it's not checked now clear it
        if ($(this).attr("checked")) {
            var id = "#" + $(this).attr("id") + "text";
            $(id).focus();
        } else {
            var id = "#" + $(this).attr("id") + "text";
            $(id).val("");
        }
    });

    //todo - refactor to ajax, change dialog confirm box
    $(".delete_set").click(function () {
        var name = $(this).attr("name");
        if (confirm("Are you sure you want to delete this data set?")) {
            location.href = "/ManageData/DeleteResponseSets.php?action=delete&set_id=" + name;
        }
    });

    $(".clone_set").click(function () {
        var name = $(this).attr("name");
        alertify
            .okBtn("Yes")
            .cancelBtn("No")
            .confirm("Are you sure you want to make an exact copy of this data set?<br/>", function () {
                // user clicked "ok"
                $.ajax({
                    type: "GET",
                    dataType: 'json',
                    url: "/Submit/ajax/DataExtractionCloneResponseSets.php?action=clone&set_id=" + name + "&submit=1",
                    success: function (data) {

                        if (data.result == 'success') {
                            // success notification
                            alertify.success("Set Cloned");
                            
                            if (typeof data.redirect_url!= 'undefined') {
                                //navigate to the new response
                                alertify
                                    .okBtn("Yes")
                                    .cancelBtn("No")
                                    .confirm("Do you want to navigate to the new response?<br/>", function () {
                                       //yes
                                       window.location.replace(data.redirect_url);
                                    }, function() {
                                       //no
                                       //do nothing
                                    });
                            }

                        } else {
                            alertify.error("Clone Failed");
                            alertify.error(data.msg);
                        }
                    },
                    error: function () {
                        alertify.error("Clone Failed");
                    }
                }, function () {
                    // user clicked "cancel"
                });
            });

    });

    window.onbeforeunload = function () {
        if (goodExit == true) {

            goodExit = true; //then that confirmation will not be asked

        } else {
            goodExit = true;
            return 'WARNING: Your changes to this form have not been saved'; //this will display on confirmation
        }
    }

}

function checkTime() {

    var cd = new Date();
    var millisAtEnd = cd.valueOf();

    $("#timetofillout").val(millisAtEnd - millisAtStart);
    console.log('time set - ' + $("#timetofillout").val());

}

function clear_sub_elements(id) {

    $("#" + id).find(':input').each(function () {
        switch (this.type) {
            case 'password':
            case 'select-multiple':
            case 'select-one':
            case 'text':
            case 'textarea':
                $(this).val('');
                break;
            case 'checkbox':
            case 'radio':
                this.checked = false;
        }
    });

    $("#" + id).hide();
}

function sum_checkboxes(id, valArrayForCalcs) {
    var total = 0;
    $("." + id).each(function () {
        if (this.checked) {
            total += parseFloat(valArrayForCalcs[this.id]);
        }
    });
    return total;
}

function sum_checkboxes2(id, valArrayForCalcs) {
    var total = 0;
    if ($("#" + id).data('select2')) {
        var values = $("#" + id).select2('data');
        for (var i = 0; i < values.length; i++) {
            total += parseFloat(valArrayForCalcs[values[i].id]);
        }
    }
    return total;
}

Number.prototype.decimals = function (places) {
    return +(Math.round(this + "e+" + places) + "e-" + places);
};


var errornum = 0;
var successnum = 0;
var errorsms = "";
var success_alert = "";
var error_alert = "";

function dragenteratt(event, obj) {
    event.stopPropagation();
    event.preventDefault();
    $(obj).css('background-color', '#D0D0D0');
}

function dragoveratt(event, obj) {
    event.stopPropagation();
    event.preventDefault();
    $(obj).css('background-color', '#D0D0D0');
}

function dragleaveatt(event, obj) {
    event.stopPropagation();
    event.preventDefault();
    $(obj).css('background-color', 'transparent');
}

function dropatt(de_screen, pdf_option, event, obj, nr, action) {
    event.stopPropagation();
    event.preventDefault();
    $(obj).css('background-color', '#ededed');
    $(obj).css('display', 'none');
    dodropatt(de_screen, nr, pdf_option, event, nr, action, null);
}

function getfilesatt(files, event) {
    if (files == null) {
        return event.dataTransfer.files;
    }
    else {
        return files;
    }
}

function dodropatt( de_screen, article_id, pdf_option, event, nr, action, files) {
    //de_screen if 0 then is screening, if 1 then is de

    var filedata = getfilesatt(files, event);
    var i = 0, len = filedata.length, img, reader, file;
    errornum = 0;
    successnum = 0;
    errorsms = "";
    success_alert = "";
    error_alert = "";
    for (i = 0; i < len; i++) {
        /*****************************/
        file = filedata[i];
        if (file.size < 100000000) {
            var formdata = false;
            if (window.FormData) {
                formdata = new FormData();
            }
            if (formdata) {
                formdata.append("Filedata", file);
                formdata.append("action", action);
                formdata.append("id", nr);
                $.ajax({
                    url: "/ManageArticles/ProcurementAjax.php?a="+jQuery.now(),
                    type: "POST",
                    data: formdata,
                    processData: false,
                    contentType: false,
                    cache: false,
                    beforeSend:function () {
                        $("#spinner").addClass('show');
                    },
                    success: function (res) {
                        if (res) {
                            var json_object = JSON.parse(res);
                            var json_object_sms = json_object.sms;
                            if (json_object_sms[0].hasOwnProperty('success')) {
                                var success_message = json_object_sms[0]['success'];
                                alertify.success(success_message);
                                /******* update list **********/
                                $.ajax({
                                    url: "PrintAttachments.php",
                                    type: "POST",
                                    dataType: 'html',
                                    cache: false,
                                    data: {
                                        "article_id": article_id,
                                        "pdf_option": pdf_option,
                                        "de_screen": de_screen
                                    },
                                    success: function (res1) {
                                        if (de_screen == 1) {
                                            $("#tabs div.ui-tabs-panel").each(function () {
                                                $(this).find("#kot_wrapper").html(res1);
                                            });
                                        } else if (de_screen == 0) {
                                            $("#kot_wrapper").html(res1);
                                        }
                                    },
                                    error: function (res1) {
                                    }
                                });
                            }
                            if (json_object_sms[0].hasOwnProperty('error')) {
                                var error_message = json_object_sms[0]['error'];
                                alertify.error(error_message);
                            }
                        }
                        /******* hide the spinner *******/
                        $("#spinner").removeClass('show');
                    },
                    error: function (res) {
                        /******* hide the spinner *******/
                        $("#spinner").removeClass('show');
                    }
                });
            }
        }
        else {
            errorsms += "<b>" + file.name + "</b> (" + (file.size / 1000000).toFixed(2).toString() + "MiB). <br/>";
            errornum++;
            /******* hide the spinner *******/
            $("#spinner").removeClass('show');
        }
    }
    if(errornum >0) {
        alertify.error("Max filesize: 100MiB.<br/>" + errorsms);
    }

}

function clickatt(event, obj, formid) {
    $(formid + '#kot').css("display","block");
}

function clickcloseatt(event, obj, de, formid) {
    if(de == 1){
        $("#form-"+formid + " #kot").css("display","none");
    } else {
        $("#kot").css("display","none");
    }
}

function changeatt(event, obj, article, pdf_option, de, formid) {
    if(de == 1){
        $("#form-"+formid + " #kot").css("display","none");
    } else {
        $("#kot").css("display","none");
    }
    //if it's screening de_screen is 0 otherwise is 1
    dodropatt(de, article, pdf_option, event, $(obj).attr("name"), 'upload_attachments', obj.files);
    event.target.value = "";
}
function fromKeyCode(n) {
    if (47 <= n && n <= 90) return unescape('%' + (n).toString(16));
    if (96 <= n && n <= 105) return 'NUM ' + (n - 96);
    if (112 <= n && n <= 135) return 'F' + (n - 111);

    if (n == 3) return 'Cancel'; //DOM_VK_CANCEL
    if (n == 6) return 'Help';   //DOM_VK_HELP
    if (n == 8) return 'Backspace';
    if (n == 9) return 'Tab';
    if (n == 12) return 'NUM 5';  //DOM_VK_CLEAR
    if (n == 13) return 'Enter';
    if (n == 16) return 'Shift';
    if (n == 17) return 'Ctrl';
    if (n == 18) return 'Alt';
    if (n == 19) return 'Pause|Break';
    if (n == 20) return 'CapsLock';
    if (n == 27) return 'Esc';
    if (n == 32) return 'Space';
    if (n == 33) return 'PageUp';
    if (n == 34) return 'PageDown';
    if (n == 35) return 'End';
    if (n == 36) return 'Home';
    if (n == 37) return 'Left Arrow';
    if (n == 38) return 'Up Arrow';
    if (n == 39) return 'Right Arrow';
    if (n == 40) return 'Down Arrow';
    if (n == 42) return '*'; //Opera
    if (n == 43) return '+'; //Opera
    if (n == 44) return 'PrntScrn';
    if (n == 45) return 'Insert';
    if (n == 46) return 'Delete';

    if (n == 91) return 'WIN Start';
    if (n == 92) return 'WIN Start Right';
    if (n == 93) return 'WIN Menu';
    if (n == 106) return '*';
    if (n == 107) return '+';
    if (n == 108) return 'Separator'; //DOM_VK_SEPARATOR
    if (n == 109) return '-';
    if (n == 110) return '.';
    if (n == 111) return '/';
    if (n == 144) return 'NumLock';
    if (n == 145) return 'ScrollLock';

// Firefox 15+ (bug 787504)
// https://bugzilla.mozilla.org/show_bug.cgi?id=787504
// https://github.com/openlayers/openlayers/issues/605
    if (-1 != navigator.userAgent.indexOf('Firefox')) {
        if (n == 173 && KeyEvent && n == KeyEvent.DOM_VK_HYPHEN_MINUS) return '- _';
        if (n == 181 && KeyEvent && n == KeyEvent.DOM_VK_VOLUME_MUTE) return 'Mute On|Off';
        if (n == 182 && KeyEvent && n == KeyEvent.DOM_VK_VOLUME_DOWN) return 'Volume Down';
        if (n == 183 && KeyEvent && n == KeyEvent.DOM_VK_VOLUME_UP) return 'Volume Up';
    }

//Media buttons (Inspiron laptops) 
    if (n == 173) return 'Mute On|Off';
    if (n == 174) return 'Volume Down';
    if (n == 175) return 'Volume Up';
    if (n == 176) return 'Media >>';
    if (n == 177) return 'Media <<';
    if (n == 178) return 'Media Stop';
    if (n == 179) return 'Media Play|Pause';

    if (n == 182) return 'WIN My Computer';
    if (n == 183) return 'WIN Calculator';
    if (n == 186) return '; :';
    if (n == 187) return '= +';
    if (n == 188) return ', <';
    if (n == 189) return '- _';
    if (n == 190) return '. >';
    if (n == 191) return '/ ?';
    if (n == 192) return '\` ~';
    if (n == 219) return '[ {';
    if (n == 220) return '\\ |';
    if (n == 221) return '] }';
    if (n == 222) return '\' "';
    if (n == 224) return 'META|Command';
    if (n == 229) return 'WIN IME';

    if (n == 255) return 'Device-specific'; //Dell Home button (Inspiron laptops)

    return null;
}

//add this function to decrease a number of requests on searching the reference
//Solution from https://stackoverflow.com/questions/1909441/how-to-delay-the-keyup-handler-until-the-user-stops-typing/1909508#1909508
function delay(fn, ms) {
    let timer = 0;
    if (ms === undefined) {
        ms = 300
    }
    return function (args) {
        clearTimeout(timer);
        timer = setTimeout(fn.bind(this, args), ms || 0);
    };
}

var fade_in_time = 200;
var fade_out_time = 2000;
var fade_delay_time = 8000;

$(document).ready(function(){

  $('.form-success, .form-error').each(function(){

    if( $(this).attr('autoshow') != 'false' ){

      $(this).fadeIn( fade_in_time );

    }

    if( $(this).width() < 300 ){

      $(this).css('width', '100%');

    }

  });

  if( navigator.userAgent.indexOf("MSIE") == -1 && navigator.userAgent.indexOf("Trident") == -1 && navigator.userAgent.indexOf("Edge") == -1){

    $('.form-helper-text').each(function(){
      $(this).prepend('<span class="form-helper-text-arrow"></span>');
    });

    $('span.form-helper-text-arrow').each(function() {

      var parent = $(this).parent(),
          height = parseInt(parent.css('height'),10),
          padding = parseInt(parent.css('padding-top'),10)*2,
          border = parseInt(parent.css('border-top-width'),10)*2,
          hypotenuse = height + padding + border,
          sides = Math.sqrt((hypotenuse * hypotenuse) / 2);

      $(this).css({

          // "width":sides+"px",
          // "height":sides+"px",
          "width":"14px",
          "height":"14px",
          "left":-((sides/2) - 7) + "px",
          "margin-top":-((sides/2) - 7)+"px"

      });

    });

  } else {

    // $("textarea").resizable();

  }
  //Tooltip conflict with jQuery UI workaround
  //https://github.com/twbs/bootstrap/issues/6303
  $.widget.bridge('uibutton', $.ui.button);
  $.widget.bridge('uitooltip', $.ui.tooltip);
  var bootstrapTooltip = $.fn.tooltip.noConflict();
  $.fn.bstooltip = bootstrapTooltip;

  $(".form-helper-tooltip").bstooltip();

    /*
    Function to get url Parameters
    Usage: $.urlParam('questionID')
     */
    $.urlParam = function (name) {
        var results = new RegExp('[\?&]' + name + '=([^]*)').exec(window.location.href);
        if (results == null) {
            return null;
        }
        else {
            return results[1] || 0;
        }
    }
});

/**
 * getAllUrlParams( @url );
 * url: https://www.sitepoint.com/get-url-parameters-with-javascript/
 */

function getAllUrlParams(url) {
    var queryString = url ? url.split('?')[1] : window.location.search.slice(1);
    var obj = {};
  
    if (queryString) {
      queryString = queryString.split('#')[0];
      var arr = queryString.split('&');
  
      for (var i=0; i<arr.length; i++) {
        var a = arr[i].split('=');
        var paramNum = undefined;
        var paramName = a[0].replace(/\[\d*\]/, function(v) {
          paramNum = v.slice(1,-1);
          return '';
        });
  
        var paramValue = typeof(a[1])==='undefined' ? true : a[1];
        paramName = paramName.toLowerCase();
        paramValue = paramValue.toLowerCase();
  
        if (obj[paramName]) {
          if (typeof obj[paramName] === 'string') {
            obj[paramName] = [obj[paramName]];
          }
          if (typeof paramNum === 'undefined') {
            obj[paramName].push(paramValue);
          } else {
            obj[paramName][paramNum] = paramValue;
          }
        }
        else {
          obj[paramName] = paramValue;
        }
      }
    }
  
    return obj;
}

// return true for IE and Edge browsers
function isThisIEBrowser() {
    return (document.documentMode || /Edge/.test(navigator.userAgent));
}

// DSR-232. Sticky buttons line for the Forms
function initFormStickyButtons($stickyElement, specifiedClass)
{
    specifiedClass = specifiedClass || "";

    var isSticky = !isThisIEBrowser();
    var stickyDistance = 100;

    var unsubmittedVisible = $('#unsubmitted').is(':visible');
    var auditVisible = $('#audit_for_user_msg').is(':visible');

    var buttons = $('.form_action_buttons');

    if (specifiedClass !== "") {
        buttons.addClass(specifiedClass);
    } else {
        if (unsubmittedVisible && auditVisible) {
            buttons.addClass('audit-unsubmitted');
            stickyDistance = 120;
        } else {
            buttons.removeClass('audit-unsubmitted');
        }

        // If top alert "You have unsubmitted response(s)." is visible
        if (unsubmittedVisible) {
            buttons.removeClass('lessmargin');
        } else {
            buttons.addClass('lessmargin');
        }

        // If top alert "You are editing data on a form originally created by ..." is visible
        if (auditVisible) {
            buttons.addClass('auditusers');
        } else {
            buttons.removeClass('auditusers');
        }
    }

    if (isSticky) {  // position: sticky
        var scrollTop = $(window).scrollTop(),
        elementOffset = $stickyElement.offset().top,
        distance      = (elementOffset - scrollTop);

        if (distance < stickyDistance) {
            $stickyElement.addClass('sticky-block');
        } else {
            $stickyElement.removeClass('sticky-block');
        }

    } else { // position: fixed
        if ( $(window).scrollTop() > 200) {
            $stickyElement.addClass('fixed-block');
        } else {
            $stickyElement.removeClass('fixed-block');
        }
    }
}

function init_label_select_field(selector, labels, allow_create_labels) {

    var editing = false;
    var deleteOne = false;
    var deleteAll = false;

    function init_select2(data_source, dynamic_label) {

        $(selector).select2({
            placeholder: 'Select Labels',
            theme: 'bootstrap',
            allowClear: true,
            multiple: true,
            tags: dynamic_label,
            tokenSeparators: [','],
            data: data_source
        }).on("select2:select", function (e) {

            var selected = e.params.data;
            var regex = /^[a-zA-Z0-9 \-_]+$/;
            var identifier = selector.replace(".","").replace("#","");

            if( regex.test(selected.text) ) {
                $("#" + identifier + "_spinner").remove();
                $(selector).next(".select2-container").find("ul").append("<span id='"+ identifier + "_spinner' title='Adding Label' style='margin: 12px;' class='fa fa-sync fa-spin pull-right'></span>");
                $.ajax({
                    url: '/Submit/ajax/ajaxLabelsCRUD.php',
                    dataType: 'json',
                    cache: false,
                    data: {
                        label: selected.text,
                        label_id: selected.id,
                        action: 'add'
                    }
                }).then(function () {
                    $("#" + identifier + "_spinner").remove();
                    if (dynamic_label === false) {
                        alertify.error('Dynamic label creation is not allowed.');
                    }
                });
            } else {
                alertify.error('Label not created. Please check the value entered.');
                var $select = $(this);
                var arr = $select.val();
                arr.pop();
                $select.val(arr).change();
            }
        }).on("select2:unselect", function (e)  {

            if (e.params.originalEvent) {

                e.params.originalEvent.stopPropagation();
            }

        }).on("select2:opening", function (e) {

            if (editing) {

                e.preventDefault();
                editing = false;
            }

            if (deleteOne) {

                e.preventDefault();
                deleteOne = false;

                $.ajax({
                    url: '/Submit/ajax/ajaxLabelsCRUD.php',
                    dataType: 'json',
                    cache: false,
                    data: {
                        action: 'getAndSelected'
                    }
                }).then(function (data) {

                    if (data !== false && typeof data.results !== 'undefined') {

                        reInit(data.results);
                    }

                });

            }

            if (deleteAll) {

                e.preventDefault();
                deleteAll = false;
                reInit([]);
            }
        });
    }

    init_select2(labels.results, allow_create_labels);

    function reInit(dataSource) {

        // Add a timeout to circumvent javascript error, select2 issue.
        //https://github.com/select2/select2/issues/3992
        setTimeout(function () {

            // Remove event handlers.
            // https://github.com/select2/select2/issues/4403
            $(selector).off('select2:select');
            $(selector).off('select2:unselect');
            $(selector).off('select2:unselecting');
            $(selector).off('select2:opening');

            // Destroy select2.
            $(selector).select2('destroy');
            $(selector).html('');

            // Re-initialize.
            init_select2(dataSource, true);
        }, 100);
    }

    $(selector).change( function(){

        var userSelectedLabels = $(selector).select2('data');
        collectNewLabels(userSelectedLabels);
    });

    function collectNewLabels(userSelectedLabels) {

        userSelectedLabels = JSON.stringify(userSelectedLabels);

        // Add a timeout since it doesn't like to be rushed. *eyes rolling*
        setTimeout(function () {

            $.ajax({
                url: '/Submit/ajax/ajaxLabelsCRUD.php',
                dataType: 'json',
                cache: false,
                data: {
                    labels: userSelectedLabels,
                    action: 'getIdByLabelList'
                },
                complete: function(data) {
                    var labelids = [];
                    $.each(data.responseJSON, function(key, value) {
                        labelids.push(value.id);
                    });
                    $("input#labelids").val(labelids.join()); //set a csv of ids
                }
            });
        }, 100);
    }
}

function toggleNavbarMethod() {
    $('.navbar .dropdown a').on('mouseover', function(){
        $(this).trigger('click');
        $(this).parents("li.dropdown").addClass("open");
    }).on('mouseout', function(){
        $(this).trigger('click').blur();
    });
}

$(document).ready(function() {
    toggleNavbarMethod();
});
