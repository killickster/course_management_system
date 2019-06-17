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
            success(id){

                if(id=='unable'){
                    document.getElementById('message').innerText = "Unable to register for this course"
                }else{
                    document.getElementById('message').innerText = "Registered" 
                    var elem = document.getElementById(id)
                    elem.remove();
                }
            }
        }
    )
}


var viewClasses = function(){
    $.ajax({
        type: 'POST',
        url: 'viewClasses/',
        success(path){
            window.location = path
        }
    })
}

var returnHome = function(){
    $.ajax({
        type:'POST',
        url:'returnHome/',
        success(path){
            window.location = path
        }
    })
}