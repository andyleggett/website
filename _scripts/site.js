(function($, hljs, T, R){

	var navMenu = $(".nav-links");

	$(".nav-icon").click(function(e){

		navMenu.slideToggle("fast");
	});

	hljs.initHighlightingOnLoad();

	/*$("#contact-form").validate({
		submitHandler: function(form) {
			form.submit();
		},
		rules: {
			fullname: "required",
			email:{
				required: true,
				email: true
			},
			description: "required",
			budget: {
				min: 500,
				digits: true
			}
		},
		messages: {
			fullname: {
				required: "Don't keep it a secret - it'll take ages to guess"
			},
			email: {
				required: "I'll need an email address otherwise the pigeon gets really upset",
				email: "It'll need to be an address that will actually work!"
			},
			description: {
				required: "I know it's all hush hush but give me a small hint"
			},
			budget: {
				min: "I don't work on projects with budgets under £500 or accept livestock as payment",
			}
		},
		debug:true
	});*/

	$(".field").on("focus", function(){

		$("#" + $(this).data("messageid")).slideDown();
	}).on("blur", function(){
		$("#" + $(this).data("messageid")).slideUp();
	});

})(jQuery, hljs, Two, R);