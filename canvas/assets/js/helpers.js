$(document).ready(function() {
	console.log('Removed Device Manager Prompt...');
	$('#cs-dm-add').remove();
	$('body').removeClass('cs-dm-add');
	$('html').removeClass('cs-dm-add');
});