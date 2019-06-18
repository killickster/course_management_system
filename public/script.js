var logout = function(){
    $.ajax({
        type: 'POST',
        url: 'logout/',
        success: function(path){
            window.location = path
        }
    })
}

var displayCourses = function(){
    $.ajax({
        type: 'POST',
        url: 'displayClasses/',
        success: function(path){
            window.location = path
        }
    })
}

var searchClasses = function(){
    $.ajax({
        type: 'POST',
        url: 'searchClasses/',
        success: function(path){
            window.location = path

        }
    })
}

var selectCourse = function(class_id){
    
    selected = {class_id:class_id}
    $.ajax({
        type: 'POST',
        url: 'requestClass/',
        data: selected,
        success: function(result){
            var elem = document.getElementById(result)
            elem.remove();

        }
    }).done(function(){
    })

}

