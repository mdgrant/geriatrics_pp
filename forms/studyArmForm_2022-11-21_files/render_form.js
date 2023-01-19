$(document).ready(function () {
    // sticky form buttons
    $(window).scroll(function(e){
        initFormStickyButtons( $('.form_action_buttons') );
    });
});