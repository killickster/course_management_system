var register = function(){
    $.ajax({
        type: 'POST',
        url: 'searchClasses/',
        success: function(path){
            window.location = path
        }
    })
}


var selectCourse = function(class_id){
    var selected = {class_id:class_id}
    $.ajax(
        {
            type: 'POST',
            url: 'requestClass/',
            data:selected,
            success(){

            }
        }
    )
}