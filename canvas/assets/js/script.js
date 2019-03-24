var tasks;
var token;
var names = [];
var quickLoad_state = false;
document.onkeydown = quickLoad;
var currentMoment = moment();

function getAccessToken() {
	$('.token-fade').fadeToggle(200);
	setTimeout(function() {
		$('.token-box').toggleClass('token-hide');
	}, 200);
}

$('#token_button').click(function() {
	if ($('.token-text').val().length > 1) {
		chrome.storage.local.set({'access_token': $('.token-text').val().trim()});
		$('.token-fade').fadeToggle(200);
		setTimeout(function() {
			$('.token-box').toggleClass('token-hide');
		}, 200);
	}
});


chrome.storage.local.get('quickLoad_state', function(result) {
   	quickLoad_state = result.quickLoad_state;
   	$('.quickload-text').val(quickLoad_state);
});

chrome.storage.local.get('completeHidden_state', function(result) {
	 if (!result.completeHidden_state) {
	 	completeHidden = false;
	 	chrome.storage.local.set({'completeHidden_state': completeHidden});
	 } else {
	 	 completeHidden = result.completeHidden_state;
	 }
});

function quickLoad(e) {
	var e = window.event;
	if (e.keyCode == 32) {
		if (completeHidden == false) {
			$('.homework-item').each(function() {
				if ($(this).children('.homework-checkbox').hasClass('checked'))
					$(this).hide();
				else
					$(this).show();
			});
			completeHidden = true;
			$('.homework-completeHidden-message').show();
		} else {
			$('.homework-item').show();
			completeHidden = false;
			$('.homework-completeHidden-message').hide();
		}
		chrome.storage.local.set({'completeHidden_state': completeHidden});
		if ($('.homework-item:visible').length == 0)
			$('.homework-noHomework-message').show();
		else 
			$('.homework-noHomework-message').hide();
	}
	if (e.keyCode == 9) {
		chrome.storage.local.get('quickLoad_state', function(result) {
			if (result.quickLoad_state) {
			   	quickLoad_state = result.quickLoad_state;
			   	var quickLoad_urls = quickLoad_state.replace(", ", ",");
			   	var url_array = quickLoad_urls.split(',');
			   	var url_first = true;
			   	$.each(url_array, function(key) {
			   		if (url_first == true) {
			   			window.location.href = url_array[key];
			   			url_first = false;
			   		} else {
			   			chrome.tabs.create({url: url_array[key]});
			   		}
			   	});
		   	} else {
		   		$('.fullscreen-fade').fadeToggle(200);
				setTimeout(function() {
					$('.quickload-box').toggleClass('quickload-hide');
				}, 200);
		   	}
		});
	}

	if (e.keyCode == 192) {
		$('.fullscreen-fade').fadeToggle(200);
		setTimeout(function() {
			$('.quickload-box').toggleClass('quickload-hide');
		}, 200);
	}
}

$('#quickload_button').click(function() {
	if ($('.quickload-text').val().length > 1) {
		chrome.storage.local.set({'quickLoad_state': $('.quickload-text').val()});
		$('.fullscreen-fade').fadeToggle(200);
		setTimeout(function() {
			$('.quickload-box').toggleClass('quickload-hide');
		}, 200);
	} else {
		$('.fullscreen-fade').fadeToggle(200);
		setTimeout(function() {
			$('.quickload-box').toggleClass('quickload-hide');
		}, 200);
	}
});

$(window).on('beforeunload', function() {
    $(window).scrollTop(0);
});

$('.favourites').click(function() {
	$('.favourites').fadeOut(200);
	$('.favourites-box').addClass('box-hidden');
	$('.favourites-link').addClass('link-hidden');
});

$('.favourites').on('mousewheel', function(e) {
    var delta = e.originalEvent.wheelDelta;

    if (delta > 0) {
        $('.favourites').fadeOut(200);
		$('.favourites-box').addClass('box-hidden');
		$('.favourites-link').addClass('link-hidden');
    }
});

$('.fav-button').click(function(e) {
	e.preventDefault();
	$('.favourites').fadeIn(200);
	$('.favourites-box').removeClass('box-hidden');
	setTimeout(function() {
		$('.favourites-link').removeClass('link-hidden');
	}, 100);
});

chrome.storage.local.get('access_token', function(result) {
   if (!result.access_token) {
   		getAccessToken();
   } else {
   	   	token = result.access_token;
		$.getJSON('https://myuni.adelaide.edu.au/api/v1/courses?access_token'+token, function(courses) {
			for (var i = 0; i < courses.length; i++) {
				var course = courses[i];		
				var id = course.id;
				names.push({'id': id, 'name': course.name});
				$item = '<a style="color: black;" href="https://myuni.adelaide.edu.au/courses/'+id+'"><div class="favourite"><h1 class="favourites-title">'+course.name+' <span class="pin">'+id+'</span></h1></div></a>';
				$('.favourites-box').append($item);
			}
			currentDate = moment().format('YYYY-MM-DD');
		   	tomorrowDate = relativeDate(+1);
	   		loadTasks(currentDate, tomorrowDate);
		});
	}
});

function relativeDate(change) {
	return moment().hours(change*24).format('YYYY-MM-DD');
}

function loadTasks(start, end) {
	$.getJSON('https://myuni.adelaide.edu.au/api/v1/planner/items?start_date='+start+'&end_date='+end+'&per_page=100&access_token='+token, function(data) {
		var dayOfMonth = moment(currentMoment).date();
		var today = moment().date();
		if (dayOfMonth == today){
			$('.day').html('Today');
		} else if(dayOfMonth == today + 1){
			$('.day').html('Tomorrow');
		} else if(dayOfMonth == today - 1){
			$('.day').html('Yesterday');
		} else {
			$('.day').html(moment(currentMoment).format("dddd"));
		}
		$('.date-full').html(moment(currentMoment).format("Do of MMMM, YYYY"));
		$('.homework-body').html('');
		for (var i = 0; i <= data.length-1; i++) {
			addTask(data[i]);
		}

		if ($('.homework-item:visible').length == 0)
			$('.homework-noHomework-message').show();
		else 
			$('.homework-noHomework-message').hide();

		if (completeHidden == true)
			$('.homework-completeHidden-message').show();
		else 
			$('.homework-completeHidden-message').hide();
	});
}

function addTask(task) {
	var course;
	var title = task.plannable.title;
	var type = task.plannable_type;

	for (i = 0; i <= names.length-1; i++) {
		if (task.course_id == names[i].id)
			var course = names[i].name;
	}

	var status;
	if (task.plannable_type == 'quiz') {
		if (task.planner_override == null)
			status = task.submissions.submitted;
		else
			status = task.planner_override.marked_complete;
	} else {
		if (task.planner_override == null)
			status = false;
		else
			status = task.planner_override.marked_complete;
	}

	checkedClass = (status == true) ? 'checked' : '';
	checkedHTML = (status == true) ? '<svg style="width:32px;height:32px" viewBox="0 0 24 24"><path fill="grey" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>' : '';
	$item = '<div id="'+task.plannable_id+'" class="homework-item"><div class="homework-checkbox '+checkedClass+'">'+checkedHTML+'</div><div class="homework-info"><a href="https://myuni.adelaide.edu.au'+task.html_url+'"><h1 class="homework-title">'+title+'</h1></a><h3 class="homework-details">'+task.plannable_type+' <span class="homework-subject">'+course+'</span></h3></div>';
	$('.homework-body').append($item);

	if (completeHidden == true && status == true)
		$('.homework-item').last().hide();
   		
}

$(document).ready(function() {
	setTimeout(function() {
		if ($('.homework-body').html() == '') {
			$('.homework-body').html('<div class="no-login"><div class="no-login-icon"><svg style="width:100px;height:100px" viewBox="0 0 24 24"><path fill="#F44336" d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z" /></svg></div><h1 class="no-login-text">Unable to connect.</h1></div></div>');
		}

		if ($('.favourites-box').html() == '') {
			$('.favourites-box').html('<div class="no-login"><div class="no-login-icon"><svg style="width:100px;height:100px" viewBox="0 0 24 24"><path fill="#F44336" d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z" /></svg></div><h1 class="no-login-text">Unable to connect.</h1></div></div>');
		}
	}, 3000);
});

$('.left-arrow').click(function() {
	currentMoment = moment(currentMoment).hours(-24).format('YYYY-MM-DD');
	nextMoment = moment(currentMoment).hours(24).format('YYYY-MM-DD');
	loadTasks(currentMoment, nextMoment);
});

$('.right-arrow').click(function() {
	currentMoment = moment(currentMoment).hours(24).format('YYYY-MM-DD');
	nextMoment = moment(currentMoment).hours(24).format('YYYY-MM-DD');
	nextMoment = moment(currentMoment).hours(24).format('YYYY-MM-DD');
	loadTasks(currentMoment, nextMoment);
});

function showHomeworkTile() {
	$('.items').addClass('hidden-top');
	$('.homework-panel').removeClass('homework-hidden');
	$('.up-arrow').show();
	setTimeout(function() {
		$('.up-arrow').removeClass('up-arrow-hidden');
	}, 300);
}

function hideHomeworkTile() {
	$('.items').removeClass('hidden-top');
		$('.homework-panel').addClass('homework-hidden');
		$('.up-arrow').addClass('up-arrow-hidden');
		setTimeout(function() {
			$('.up-arrow').hide();
	}, 100);
}

$('.up-arrow').click(function() {
	window.location.href = "https://myuni.adelaide.edu.au/";
});

$('.wrapper').on('mousewheel', function(e) {
    var delta = e.originalEvent.wheelDelta;
    if (delta < 0) {
        showHomeworkTile();
    } else if (delta > 0) {
    	if ($('.homework-body')[0].scrollHeight > $('.homework-panel')[0].scrollHeight) {
    		if ($(e.target).parents('.homework-body').length <= 0)
    			hideHomeworkTile();
		} else {
			hideHomeworkTile();
		}
    }
});