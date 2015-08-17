var carrier; // this is the oscillator we will hear
var modulator; // this oscillator will modulate the amplitude of the carrier
var fft; // we'll visualize the waveform 

var w = $( window ).width();
var h = 450;

var Member = 'Adjany';

var apiEndPoint = 'http://intotheokavango.org/api/features/';

var days = [];

var focusDay;

var displayFont;

var teamMember;
var hrLabel;
var totalBeats;

var cBPM = 0;
var tBPM = 100;

var totalHeartBeats = 0;

var mainCanvas;

var soundStarted = false;

var mainPath;

var timeMode = 0;
var startTimeField = 0;
var startTimeApp = 0;

var nowField;

function preload() {
  
}

function setup() {
  mainCanvas = createCanvas(w,h);
  noFill();
  background(0); // alpha

  //Set time to be about a minute before the hippo attack.
  var startMoment = new Date(Date.UTC(2015, 06, 11, 8, 57, 00));
  startTimeField = startMoment.getTime();
  startTimeApp = (new Date()).getTime();
 

  //Top label
  totalBeats = createSpan('').addClass('graphLabel')
  totalBeats.position(50,15);
  totalBeats.style("display", "block");
  totalBeats.style("position", "relative");
  totalBeats.style("left", "10px");
  totalBeats.style("top", "0px");
  totalBeats.style("color", "#999");
  totalBeats.style("font-family", "Helvetica");
  totalBeats.style("font-size", "18px");
  totalBeats.style("visibility", "hidden");

  teamMember = createSpan('Loading...').addClass('graphLabel');
  teamMember.position(50,35);
  teamMember.style("display", "block");
  teamMember.style("position", "relative");
  teamMember.style("left", "10px");
  teamMember.style("top", "0px");
  teamMember.style("color", "#333");
  teamMember.style("font-family", "Helvetica");
  teamMember.style("font-size", "36px");
  teamMember.style("visibility", "hidden");

  //HR label
  hrLabel = createSpan('#').addClass('graphLabel').id('hrLabel');;
  hrLabel.style("display", "block");
  hrLabel.style("position", "fixed");
  hrLabel.style("left", "10px");
  hrLabel.style("top", "200px");
  hrLabel.style("color", "#666");
  hrLabel.style("font-family", "Helvetica");
  hrLabel.style("font-size", "30px");
  $('#hrLabel').hide();

  timeLabel = createSpan('').addClass('graphLabel').id('timeLabel');;
  timeLabel.style("display", "block");
  timeLabel.style("position", "fixed");
  timeLabel.style("left", "10px");
  timeLabel.style("top", "240px");
  timeLabel.style("color", "#999");
  timeLabel.style("font-family", "Helvetica");
  timeLabel.style("font-size", "14px");
  $('#timeLabel').hide();

  //Move the canvas so it's inside the correct holder.
  $("#defaultCanvas").appendTo($("#graph"));
  $(".graphLabel").appendTo($("#graph"));

  //*-------------- DATA
  loadRange("Steve", 57,58);

  //*-------------- PATH DATA
  mainPath = loadPath("Steve", 57)

  //*-------------- SOUND

  //Sound maker
  carrier = new p5.Oscillator(); // connects to master output by default
  carrier.freq(220);
  carrier.amp(0);
  //carrier.start();

  //Modulator for the sound
  modulator = new p5.Oscillator('sine');
  modulator.disconnect();  // disconnect the modulator from master output
  modulator.freq(5);
  modulator.amp(1);
  //modulator.start();

  // Modulate the carrier's amplitude with the modulator
  // Optionally, we can scale the signal.
  carrier.amp(modulator.scale(-1,1,1,-1));

}

function mousePressed() {
  if (focusDay.buttonOver) {
    focusDay.sorted = !focusDay.sorted;
    focusDay.renderBeats();
  }
}

function clock() {
  var now = new Date();
  var elapsed = now.getTime() - startTimeApp;
  nowField = startTimeField + elapsed;
  //This value is in seconds
  setTime(nowField);
}

function setTime(time) {
  //This parameter takes milliseconds(?)
  var now = moment(time);
  var d = now.tz('Africa/Johannesburg').format('DD/MM/YYYY h:mm:ssa');     // 8am EDT
  timeLabel.html(d);
  //setTimeOnPath(time);
}

function setTimeOnPath(time) {
  if (mainPath != undefined && mainPath.points != undefined) {
  //Go through the paths and find the one that is before the time point
  for(var i = 1; i < mainPath.points.length - 1; i++) {
    var p = mainPath.points[i];
    var t = p.properties.t_utc;

    if (t > time) {
      //.css("border-bottom", "thick dotted #ff0000");
      //get the fraction between this time and the next segment's time
      var p1 = mainPath.points[i - 1];
      var t1 = p1.properties.t_utc;
      var f = (time - t1)/(t - t1);
      if (f < 1 && f > 0) {
        $('#pathMarker').appendTo(mainPath.pathSegments[i -1]);
        $('#pathMarker').css("left", f * mainPath.pathSegments[i].width());
      } 

      break;
    }
  }
  
  }
}

function loadPath(member, day) {
  var p = new Path(member, day);
  p.requestPath();
  return(p);

}

function loadRange(member, start, end) {
  totalHeartBeats = 0;
  Member = member;
  teamMember.html(member);
  days = [];
  var stack = 0;
  var dh = height / (end - start);
  for (var d = start; d < end; d++) {
    var day = new HRDay(Member, d, 0, stack, width, dh);
    days.push(day);
    day.requestHR(Member, d);
    stack += day.fh;
  }
}

function draw() {

  timeMode = (mouseY > 0 && mouseY < height) ? 1:0;

  focusDay = days[0];

  for (var i =0 ; i < mainPath.pathSegments.length; i++) {
      var s = mainPath.pathSegments[i];
      if (s.position().top < $('body').scrollTop() && s.css('opacity') == 0) {
        s.animate({opacity: 1}, 1000); 
      } 
  }

  //Clock
  if (timeMode == 0) clock();

  //Start the sound when we get to a certain scroll position
  //Also show the heart rate labels.

  if ($('body').scrollTop() > 200 && $('body').scrollTop() < 2100) {

    $('#timeLabel').fadeIn(1000);
    $('#hrLabel').fadeIn(1000);

  }

  //console.log($('body').scrollTop());
  if (!soundStarted && ($('body').scrollTop() > 150 && $('body').scrollTop() < 2100)) {
    var startMoment = new Date(Date.UTC(2015, 06, 11, 8, 57, 00));

    //reset the clock if we're coming from the top
    if ($('body').scrollTop() < 300) {
      console.log("START:" + startMoment);
      startTimeField = startMoment.getTime();
      startTimeApp = (new Date()).getTime();
   }

    modulator.start();
    carrier.start();
    soundStarted = true;
    focusDay.active = true;
    focusDay.playing = true;
  } else if (($('body').scrollTop() < 150 || $('body').scrollTop() > 2100) && soundStarted) {
    modulator.stop();
    carrier.stop();
    soundStarted = false;
    $('#timeLabel').fadeOut(1000);
    $('#hrLabel').fadeOut(1000);
    focusDay.playHead = 0.120 * this.w;
    focusDay.playing = true;
    focusDay.active = false;
  }

  background(30,30,30); // alpha

  focusDay = days[floor(map(mouseY, 0, height, 0, days.length))];

  for (var i = 0; i < days.length; i++) {
    days[i].render();
  }

  cBPM += (tBPM - cBPM) * 0.1;
  hrLabel.html(round(cBPM) + "b.p.m.");

  var modFreq = cBPM / 60;
  modulator.freq(modFreq);

  var modAmp = 0.5;//map(mouseX, 0, width, 0, 1);
  modulator.amp(modAmp, 0.03); // fade time of 0.1 for smooth fading

}

function Path(member, day) {
  this.member = member;
  this.day = day;
  this.points;
  this.pathSegments = [];
}

Path.prototype.requestPath = function() {
  console.log("LOAD PATH " + this.member + " " + this.day);
  var url = apiEndPoint + "?FeatureType=ambit_geo&Member=" + this.member + "&limit=800&expeditionDay=" + this.day;
  console.log(url);
  var test = $.ajax({
    dataType: "json",
    url: url,
    context: this,
    success: this.receivePath
  });
}

Path.prototype.receivePath = function(data) {
  console.log("PATH RECEIVED");
  this.points = data.results.features;
  this.build();
}

Path.prototype.build = function() {
  //Calc min and max lat/lon
  var minBounds = [180,180];
  var maxBounds = [-180,-180];
  for(var i = 0; i < this.points.length; i++) {
    var geom = this.points[i].geometry.coordinates;
    if (geom[0] < minBounds[0]) minBounds[0] = geom[0];
    if (geom[1] < minBounds[1]) minBounds[1] = geom[1];
    if (geom[0] > maxBounds[0]) maxBounds[0] = geom[0];
    if (geom[1] > maxBounds[1]) maxBounds[1] = geom[1];
  }

  //Make the marker
  $('#pathHolder').append("<div id='pathMarker'></div>");
  //Draw it
  $('#pathHolder').append("<div id='pathSystem'></div>").css({"display":"block", "position":"relative"});
  
  
  var p0 = this.points[0].geometry.coordinates;
  var mag = 33500;
  for(var i = 0; i < this.points.length - 1; i++) {
    
    var p1 = this.points[i].geometry.coordinates;
    var pd = [p1[0] - p0[0], p1[1] - p0[1]];

    var p2 = this.points[i + 1].geometry.coordinates;
    var pd2 = [p2[0] - p0[0], p2[1] - p0[1]];

    var dx = p2[0] - p1[0];
    var dy = p2[1] - p1[1];

    var d = Math.sqrt((dx * dx) + (dy * dy));
    var th = Math.atan2(dy, dx);


    $('#pathHolder').append("<div id='path_" + i + "'> </div>")
    $('#pathHolder').css({
        "display":"block",
        "position":"absolute",
        "left":"48%",
        "top":200,
        "z-index": -1
    })
    $('#path_' + i).append("<div id='line_" + i + "'></div>");
    $('#path_' + i).css(
      {
        "display":"block", 
        "position":"absolute", 
        "top": pd[1] * -mag,
        "left": (pd[0] * mag),
        "width": d * mag,
        "transform-origin": "top left",
        "-webkit-transform": "rotate(" + -th +  "rad)",
        "opacity": 0
      })
    $('#line_' + i).css(
      {
        "display":"block", 
        "position":"absolute", 
        "border-bottom": "dotted #4BFF87",
        "width": d * mag,
        "transform-origin": "top left",
      });

    this.pathSegments.push($('#path_' + i));
  }
  
  
}

function HRDay(member, day, x, y, w, h, graphing) {
  this.graphing = graphing;
  this.member = member;
  this.day = day;
  this.startTime;
  this.endTime;
  this.dateTime;
  this.w = w;
  this.h = h;
  this.fh = h;
  this.pos = {};
  this.pos.x = x;
  this.pos.y = y;
  this.beats = [];
  this.rBeats = [];
  this.cumulativeBeats = [];
  this.totalTime = 0;
  this.canvas = createGraphics(w,this.fh);
  this.canvas.background(0);
  this.canvas.stroke(255);
  this.sorted = false;
  this.loaded = false;
  this.shadeW = w;
  this.tshadeW = w;
  this.buttonOver = false;
  this.dragging = false;
  this.dragX = 0;
  this.boundLeft = 0;
  this.boundRight = 0;
  this.playHead = 0.122 * this.w;
  this.playing = true;
  this.playSpeed = 1.0 / this.w;
  this.active = false;
}

HRDay.prototype.render = function() {
  this.shadeW += (this.tshadeW - this.shadeW) * 0.1;
  this.buttonOver = mouseX > this.pos.x + this.w - 30 && mouseX < this.pos.x + this.w - 10 && mouseY > this.pos.y + 10 && mouseY < this.pos.y + 30;

  push();
    translate(this.pos.x, this.pos.y);
    //tint(255, (focusDay == this) ? 255:150);
    fill(255);
    noStroke();
    image(this.canvas, 0, 0);
    

    //console.log(mouseX / this.w);

    if (!this.playing) {
      this.playHead = mouseX;
    } else {
      if (this.active) this.playHead += this.playSpeed;
      if (this.playHead > this.w) this.playHead = 0;
    }

    //Is this the Day that the mouse is currently over or are we playing??
    if (focusDay == this || this.playing) {

      //Drag rectangle
      if (mouseIsPressed && !this.dragging && !this.buttonOver) {
        this.playing = false;
        console.log("Start drag");
        this.dragging = true;
        this.dragX = mouseX;

      } else if (mouseIsPressed && this.dragging) {
        fill(255,50);
        rect(this.dragX, 0, mouseX - this.dragX, this.h);

      } else if (!mouseIsPressed) {
        if (this.dragging) {
          var nbl = floor(map(this.dragX, 0, this.w, this.boundLeft, this.boundRight));
          var nbr = floor(map(mouseX, 0, this.w, this.boundLeft, this.boundRight));
          console.log("stop drag" + nbl + ":" + nbr)
          if (nbr - nbl > 100) {
            this.boundLeft = nbl ;
            this.boundRight = nbr;
            this.renderBeats();
          } else {
            var refresh = false;
            if (this.boundLeft != 0) refresh = true;
            this.boundLeft = 0;
            this.boundRight = this.beats.length;
            if (refresh) this.renderBeats();

          }
          
          this.dragging = false;

        }
        
      }


      var ind;
      var range = 3;

      if (timeMode == 0) {
        //Find the HR record that is closest to the current time
        var f = (((nowField/1000) - this.startTime) / (this.endTime - this.startTime));
        ind = floor(f * this.rBeats.length);

      } else {
        ind = floor(map(this.playHead, 0, this.w, this.boundLeft, this.boundRight));
        setTime(this.cumulativeBeats[ind] * 1000); 
      }

      //Set the HR record off of index
        var tot = 0;
        var c = 0;
        for(var i = max(0,ind - range); i < min(this.rBeats.length, ind + range); i++) {
          tot += this.rBeats[i];
          c ++;
        }
        //Average interval between heart beats (millis per beat)
        var av = tot / c;
        var hr = 60000 / av;

        if (!isNaN(hr)) {
          tBPM = hr;
        }
      

      

      

      //Sort button 
      push();
      translate(w-30,10)

      noStroke();
      fill(255, this.buttonOver ? 255:100);
      rect(0,0,20,20)
      var stack = !this.sorted ? [6,12,16]:[16,6,10];

      translate(0,18);
      for (var j = 0; j < stack.length; j++) {
        fill(255);
        rect(2,0,5,-stack[0]);
        rect(8,0,5,-stack[1]);
        rect(14,0,5,-stack[2]);
      }
      pop();

      //Indicator line
      stroke(255);
      line(this.playHead,0,this.playHead,this.h);
    }
    fill(0);
    noStroke();
    rect(this.w,0,-this.shadeW,this.h);

  pop();
}

HRDay.prototype.renderBeats = function() {
  this.canvas.background(0);
  this.shadeW = this.w;

  this.rBeats = this.beats.slice(0);
  if (this.sorted) {
    sort(this.rBeats);
    reverse(this.rBeats);
  }

  var cum = this.startTime;

  for (var i = this.boundLeft ; i < this.boundRight; i++) {
    //Get a running average of the last 10 points to look for outliers
    var tot = 0;
    var c = 0;
    for (var j = i; j > i - 10; j--) {
      tot+= this.rBeats[j];
      c++;
    }
    var av = tot / c;

    //Don't render outliers.
    var minBeat = 100;
    var maxBeat = 1000;

      


    this.canvas.colorMode(HSB);

    if (i < 10 || abs(this.rBeats[i] - av) < 75) {

      var n = map(this.rBeats[i], minBeat, maxBeat, 0, 1);
      n = constrain(n, 0,1);
      var ni = 1 - n;

      var x = map(this.cumulativeBeats[i], this.cumulativeBeats[this.boundLeft], this.cumulativeBeats[this.boundRight - 1], 0, this.w);

      var c = this.canvas.color(80 + (ni * 180), 255, 50 + (200 * ni * ni));
      var ca = this.canvas.color(80 + (ni * 180), 255, 50 + (200 * ni * ni),5);

      this.canvas.stroke(ca);
      this.canvas.line(x,0,x,this.h);
      this.canvas.stroke(c);
      //this.canvas.line(x,this.h * n * 0.5,x,this.h - (this.h * n * 0.5));
      this.canvas.line(x,this.h * n,x,this.h);

      if (this.graphing) {
        this.canvas.stroke(255);
        this.canvas.point(x, this.h + (n * this.h));
      }

      
    }
    
  }
}

HRDay.prototype.requestHR = function(member, day) {

  var url = apiEndPoint + "?FeatureType=ambit_hr&Member=" + member + "&expeditionDay=" + day;
  console.log(url);
  var test = $.ajax({
    dataType: "json",
    url: url,
    context: this,
    success: this.receiveHR
  });

}

HRDay.prototype.receiveHR = function(data) {
  //console.log(this);
  //console.log(data);
  
  
  //console.log("START TIME:" + this.startTime);
  if (data.results.features.length == 0) {
    console.log("MISSING: " + this.dateTime);
  } else {

    this.startTime = data.results.features[0].properties.t_utc;
    this.dateTime = data.results.features[0].properties.DateTime;
    this.beats = data.results.features[0].properties.Beats;

    

    var cum = this.startTime;
    for (var i = 0; i < this.beats.length; i++) {
      this.cumulativeBeats[i] = cum;
      cum += this.beats[i] / 1000;
      this.totalTime += this.beats[i];
    }
    this.endTime = cum;

    totalHeartBeats += this.beats.length;
    totalBeats.html(totalHeartBeats + " heart beats.");
    this.boundRight = this.beats.length;
    this.renderBeats(this.beats, this.w, 100, false);
    this.loaded = true;
    this.tshadeW = 0;
    
  }
}





















