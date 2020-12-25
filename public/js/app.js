
function previewImage(file) {
    var input = document.getElementById("input");
    var imageType = /image.*/;

    if (!file.type.match(imageType)) {
        throw "File Type must be an image";
    }

    var img = document.createElement("img");
    img.file = file;
    input.innerHTML = "";
    input.append(img);

    var reader = new FileReader();
    reader.onload = (function(aImg) { return function(e) { aImg.src = e.target.result; }; })(img);
    reader.readAsDataURL(file);
    updateImageSize();

}

function addThumbnail() {
    var svgsrc = document.getElementById("svgsrc").value;
    var blob = new Blob([svgsrc], {type: 'image/svg+xml'});
    var url = URL.createObjectURL(blob);

    var thumbnail = document.createElement('img');
    thumbnail.src = url;
    thumbnail.id = makeid(5);
    thumbnail.className = "thumbnail";

    var downloadbutton = document.createElement('button');
    downloadbutton.classList.add("btn");
    downloadbutton.innerHTML = '<svg width="15" height="15" viewBox="0 0 16 16" class="bi bi-download" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"></path><path fill-rule="evenodd" d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"></path></svg>';
    
    var downloadspan = document.createElement('div');
    downloadspan.className = "download";
    downloadspan.appendChild(downloadbutton);

    var gallery = document.getElementById("thumbnails");
    gallery.prepend(downloadspan);
    gallery.prepend(thumbnail);

    var image = document.createElement('img');
    image.src = url;

    var output = document.getElementById("output");
    output.innerHTML = "";
    output.append(image);

    updateImageSize();
    stopProcessing();
}

function process(file){
    url = URL.createObjectURL(file);

    var targetnodes = {
    output: document.querySelector("#output"),
    svgsrc: document.querySelector("#svgsrc")
    }

    var steps = document.getElementById('count').value;
    var mode = document.getElementById('mode').value;
    var blur = document.getElementById('blur').value;

    var config = {
    computeSize: 500,
    viewHeight: $("#workpane").height(),
    viewWidth: ($("#workpane").width() / 2) - 40,
    steps: parseInt(steps),
    mode: parseInt(mode),
    blur: parseInt(blur),
    shapes: 200,
    alpha: 0.5,
    mutations: 30,
    mutateAlpha: false,
    fill: 'auto',
    linewidth: 1,
    nodes: targetnodes
    }

    var beast = new Beast(config);
    beast.load(url).then(original => beast.begin(original));
    startProcessing();
}

function downloadURL(url, name = 'file.txt') {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;

    document.body.appendChild(link);

    link.dispatchEvent(
    new MouseEvent('click', { 
        bubbles: true, 
        cancelable: true, 
        view: window 
    })
    );

    document.body.removeChild(link);
}

function makeid(length) {
    var result = '';
    var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function startProcessing() {
    $(".beforetext").hide();
    $(".duringtext").show();
}

function stopProcessing() {
    $(".beforetext").show();
    $(".duringtext").hide();
}

function updateImageSize() {
    var height = $("#workpane").height();
    $("#output").find("img").css("max-height", height);
    $("#output").find("svg").css("max-height", height);
    $("#input").find("img").css("max-height", height);
}

$(document).ready(function () {
    updateImageSize();
    stopProcessing();

    $(window).keydown(function(event){
    if(event.keyCode == 13) {
        event.preventDefault();
        return false;
    }
    });

    document.querySelector('#fileinput').addEventListener('change', function () {
        for(var i=0; i<this.files.length; i++){
            previewImage(this.files[i]); 
        }
    }, false);
    
    document.getElementById('process').addEventListener('click', function () {
        var files = document.querySelector('#fileinput').files;
        for(var i=0; i<files.length; i++){
            process(files[i]);
        }
    }, false);
    
    document.getElementById('count').addEventListener('change', function () {
        if (this.value > 150) { this.value = 150; this.style.width = '113px'; }
        if (this.value < 3) { this.value = 3; this.style.width = '96px'; }
    }, false);
    
    document.getElementById('count').addEventListener('input', function () {  
        if (this.value.length == 0) { this.style.width = '51px'}  
        if (this.value.length == 1) { this.style.width = '77px'}  
        if (this.value.length == 2) { this.style.width = '96px'}  
        if (this.value.length == 3) { this.style.width = '113px'}  
        if (this.value.length > 3) { this.value = 150; this.style.width = '113px'}
    }, false);

    $(window).resize(function() {
        updateImageSize();
    });
    
    $('body').on('click', '.download', function (){
        downloadURL($(this).prev().attr('src'), "beast-" + $(this).prev().attr('id') + ".svg");
    });
    
    $('body').on('click', '.thumbnail', function (){
        var image = document.createElement('img');
        image.src = this.src;
    
        var height = $("#workpane").height();
    
        var output = document.getElementById("output");
        output.innerHTML = "";
        output.append(image);
    
        $("#output").find("img").css("max-height", height);
    });
    
    $("#output").change(function() { updateImageSize()});
    
    document.getElementById('output').addEventListener('beast', function () {
        addThumbnail();
    }, false);
    
    document.getElementById('output').addEventListener('shape', function (e) {
        if (e.detail.stepsremaining > 0) {
        var count = document.getElementById("currentcount");
        count.innerHTML = e.detail.stepsremaining;
        }
        updateImageSize();
    }, false);
    
    $('select').change(function(){
        var text = $(this).find('option:selected').text();
        var $aux = $('<select/>').append($('<option/>').text(text));
        $(this).after($aux);
        $(this).width($aux.width());
        $aux.remove();
    }).change();
    
    $('body').on('mouseover', '.thumbnail, .download', function () {
        if ($(this).attr('class') == "thumbnail") {
        $(this).next().show();
        } else {
        $(this).show();
        }
    });
    
    $('body').on('mouseleave', '.thumbnail, .download', function () {
        if ($(this).attr('class') == "thumbnail") {
        $(this).next().hide();
        } else {
        $(this).hide();
        }
    });
});


