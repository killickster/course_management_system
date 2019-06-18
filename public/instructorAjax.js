var returnHome = function(){
    $.ajax({
        type: 'POST',
        url: 'returnHome/',
        success: function(path){
            window.location = path
        }
    })
}