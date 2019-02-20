var tasks;
var user_id = '';
var quickLoad_state = false;
document.onkeydown = quickLoad;

function getUserID() {
	var new_username = prompt('Please enter your keystone username');
	$.getJSON('https://keystone-apps.stpeters.sa.edu.au/api/people/'+new_username, function(data) {
		user_id = data.id;
		chrome.storage.local.set({'ks_username': user_id});
	});
}

chrome.storage.local.get('ks_username', function(result) {
   if (!result.ks_username) {
   		getUserID();
   } else {
   		user_id = result.ks_username;
   		// Load Homework
		$.getJSON('https://keystone-apps.stpeters.sa.edu.au/api/tasks/users/'+user_id, function(data) {
			tasks = data['tasks'];
			console.log(tasks);
			loadDate(moment());
		});
	}
});

chrome.storage.local.get('quickLoad_state', function(result) {
   	quickLoad_state = result.quickLoad_state;
   	$('.quickload-text').val(quickLoad_state);
});

function quickLoad(e) {
	var e = window.event;
	if (e.keyCode == 9) {
		chrome.storage.local.get('quickLoad_state', function(result) {
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
		});
	}

	if (e.keyCode == 192) {
		$('.fullscreen-fade').fadeToggle(200);
		setTimeout(function() {
			$('.quickload-box').toggleClass('quickload-hide');
		}, 200);
	}
}

$('.done-button').click(function() {
	if ($('.quickload-text').val().length > 1) {
		chrome.storage.local.set({'quickLoad_state': $('.quickload-text').val()});
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
})

var currentMoment = moment();
function loadRelativeDate(change){
	loadDate(currentMoment.hours(change*24).minutes(0).seconds(0).milliseconds(0));
}

function loadDate(theMoment){
	currentMoment = theMoment;
	var dayOfMonth = currentMoment.date();
	var today = moment().date();

	if (dayOfMonth == today){
		$('.day').html('Today');
	} else if(dayOfMonth == today + 1){
		$('.day').html('Tomorrow');
	} else if(dayOfMonth == today - 1){
		$('.day').html('Yesterday');
	} else {
		$('.day').html(currentMoment.format("dddd"));
	}

	$('.date-full').html(currentMoment.format("Do of MMMM, YYYY"));
	$('.homework-body').html('');
	var date = currentMoment.format("YYYY-MM-DD HH:mm:ss");
	for(var i = 0; i < tasks.length; i++){
		var task = tasks[i];
		if(dateWithin(task.dateStart, task.dateDue, date)){
			addTask(task);
		}
	}
}

function dateWithin(b,e,c) {
    if((c <= e && c >= b)) {
        return true;
    }
    return false;
}

function addTask(task) {
	var timeago = "today";
	var taskMoment = moment(task.dateDue);
	if(currentMoment.date() != taskMoment.date()){
		timeago = taskMoment.from(currentMoment);
		if (timeago == 'in 2 days') {
			timeago = 'in 1 day';
		}
	}

	var title = task.title.replace(task.title.match(/\[(.*?)\] /g),"");

	var schoolClass = "";
	if(task.schoolClass)
		schoolClass = task.schoolClass;

	if (task.status == 2) {
		checkedClass = 'checked';
		checkedHTML = '<svg style="width:32px;height:32px" viewBox="0 0 24 24"><path fill="grey" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>'
	} else {
		checkedClass = '';
		checkedHTML = '';
	}

	$item_1 = '<div id="'+task.id+'" class="homework-item"><div class="homework-checkbox '+checkedClass+'">'+checkedHTML+'</div><div class="homework-info"><h1 class="homework-title">'+title+'</h1><h3 class="homework-details">Due '+timeago+' <span class="homework-subject">'+schoolClass+'</span></h3>';

	if (task.description == null) {
		$item_2 = '';
	} else {
		$item_2 = '<div class="expand-arrow"><svg style="width:30px;height:30px" viewBox="0 0 24 24"><path fill="grey" d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" /></svg></div><p class="homework-description detail-hidden">'+task.description+'</p></div>'
	}
	
	$item_3 = '</div>';

	$item = $item_1 + $item_2 + $item_3;
	console.log($item);
	$('.homework-body').append($item);
}

$(document).ready(function() {
	// Load Favourites
	$.getJSON('https://keystone.stpeters.sa.edu.au/_layouts/StPeters.Keystone/MyFavourites/MyFavouritesHttpHandler.ashx?action=LISTFAVOURITES&s=1489370427302&operation=get_children&id=00000000-0000-0000-0000-000000000000&_=1489370427672', function(data) {
		favourites = data;
		for(var i = 0; i < favourites.length; i++){
			var favourite = favourites[i];		
			var id = favourite.attr.url.substr(favourite.attr.url.indexOf("?") + 1);
			$item = '<a style="color: black;" href="'+favourite.attr.url+'"><div class="favourite"><h1 class="favourites-title">'+favourite.data+' <span class="pin">'+id+'</span></h1></div></a>';
			$('.favourites-box').append($item);
		}
	});

	setTimeout(function() {
		if ($('.homework-body').html() == '') {
			$('.homework-body').html('<div class="no-login"><div class="no-login-icon"><svg style="width:100px;height:100px" viewBox="0 0 24 24"><path fill="#F44336" d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z" /></svg></div><h1 class="no-login-text">Unable to connect.</h1></div></div>');
		}

		if ($('.favourites-box').html() == '') {
			$('.favourites-box').html('<div class="no-login"><div class="no-login-icon"><svg style="width:100px;height:100px" viewBox="0 0 24 24"><path fill="#F44336" d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z" /></svg></div><h1 class="no-login-text">Unable to connect.</h1></div></div>');
		}
	}, 2000);
});

$('.left-arrow').click(function() {
	loadRelativeDate(-1);
});

$('.right-arrow').click(function() {
	loadRelativeDate(1);
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

function switchCompleteStatus(id, status){
	$.post('https://keystone-apps.stpeters.sa.edu.au/api/tasks/'+id+'/status/'+status, function (result) {
		// Test
	});	
}

$('.up-arrow').click(function() {
	window.location.href = "https://keystone-apps.stpeters.sa.edu.au/tasks";
});

$('body').on('click', '.homework-checkbox', function() {
	$id = $(this).parent().attr('id');
	if ($(this).hasClass('checked')) {
		$(this).removeClass('checked');
		$(this).html('');
		switchCompleteStatus($id, 1);
	} else {
		$(this).addClass('checked');
		$(this).html('<svg style="width:32px;height:32px" viewBox="0 0 24 24"><path fill="grey" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>');
		switchCompleteStatus($id, 2);
	}
});

$('body').on('click', '.expand-arrow', function() {
	if ($(this).hasClass('expanded')) {
		$(this).removeClass('expanded');
		$(this).parent().parent().removeClass('expanded-item');
		$(this).parent().children('.homework-description').addClass('detail-hidden');
	} else {
		$(this).addClass('expanded');
		$(this).parent().parent().addClass('expanded-item');
		$(this).parent().children('.homework-description').removeClass('detail-hidden');
	}
});

$('.wrapper').on('mousewheel', function(e) {
    var delta = e.originalEvent.wheelDelta;

    if (delta < 0) {
        // Scrolled Down
        showHomeworkTile();
    } else if (delta > 0) {
       	// Scroll Up
       	hideHomeworkTile();
    }
});