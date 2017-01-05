// Initialize Firebase
var config = {
	apiKey: "AIzaSyC-zjmCBUm3a5TqvcD4mwjS8-NG0J-OBYw",
    authDomain: "test-7c7a2.firebaseapp.com",
    databaseURL: "https://test-7c7a2.firebaseio.com",
    storageBucket: "test-7c7a2.appspot.com",
    messagingSenderId: "867493498100"
};
firebase.initializeApp(config);
database = firebase.database();

var googleAPIKey = "AIzaSyD-v-7mR5Rs0s1dGKX4pEbfvp6aImogy4E";
var latitude = 30.2672; 
var longitude = -97.7431;
var date = "today";
var email;
var password;
var placeName;




function login() {


	// hide user registration and user login
	$("#loginPanel").hide();
	 	

	// display user status
	$("#loginStatus").html("<h3><small>You are currently logged in as: " + email + "</small></h3><button id='changePassword'>Change Password</button><button id='changeUserButton'>Login as a Different User</button>");
}

function changePassword() {
	var user = firebase.auth().currentUser;
	var newPassword = getASecureRandomPassword();

	user.updatePassword(newPassword).then(function() {
	  // Update successful.
	}, function(error) {
	  // An error happened.
	});
}

function checkIfLoggedIn() {
	email = localStorage.getItem("user");
	if (email == null || email == "null") {
		$("#loginStatus").html("<h3><small>You are currently not logged in.</small></h3>");
		email = "Guest";
	} else {
		login();
	}
}

function getData() {
	database.ref().on("child_added", function(snapshot) {
		var data = snapshot.val();
		if (data.user == email) {
			$("#previousSearches").append("<tr><td>" + data.location + "</td><td>" + data.latitude + "</td><td>" + data.longitude + "</td></tr>");
		}
	});
}
function getSolarTimes() {

	var timestamp = moment().unix();

	timezoneURL = "https://maps.googleapis.com/maps/api/timezone/json?location=" + latitude + "," + longitude + "&timestamp=" + timestamp + "&key=" + googleAPIKey;

	solarQueryURL = "http://api.sunrise-sunset.org/json?lat=" + latitude + "&lng=" + longitude + "&date=" + date;

	$.ajax({ url: timezoneURL, method: "GET" }).done(function(response) {

		var offset = (response.rawOffset + response.dstOffset)/3600;

		$.ajax({ url: solarQueryURL, method: "GET" }).done(function(response) {
			var solarData = response.results;

			var sunrise = moment(moment(solarData.sunrise, "hh:mm:ss A")).add(offset, "hours").format("hh:mm:ss A");
			var sunset = moment(moment(solarData.sunset, "hh:mm:ss A")).add(offset, "hours").format("hh:mm:ss A");
			var solar_noon = moment(moment(solarData.solar_noon, "hh:mm:ss A")).add(offset, "hours").format("hh:mm:ss A");
			var day_length = solarData.day_length;

			$("#location").html("Location: " + placeName);
			$("#sunrise").html("Sunrise: " + sunrise);
			$("#sunset").html("Sunset: " + sunset);
			$("#solar_noon").html("Solar Noon: " + solar_noon);
			$("#day_length").html("Day Length: " + day_length);
		});
	});
};


//LOG IN WITH EMAIL AND PASSWORD ** THIS VERSION USES FIREBASE AUTH FRAMEWORK **

function submitCredentials() {


	//grab data from html forms
	email = $("#email").val().trim();
	password = $("#password").val().trim();

	getData();

	// ???
	localStorage.setItem("user", email);

	// code to handle errors thrown back by Firebase auth framework
	firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
  		
  		// catch errors
  		var errorCode = error.code;
  		var errorMessage = error.message;

  		// handle errors
  		if (errorCode == 'auth/wrong-password') {
    		// WRITE CODE HERE if password is incorrect
			$('#errorMessage').html("Incorrect password.");	
  		} else if (errorCode == 'auth/invalid-email') {
			// WRITE CODE HERE if firebase throws invalid email
  			$('#errorMessage').html("Invalid email.");
  		} else if (errorCode == 'auth/user-disabled') {
  			// WRITE CODE HERE if firebase throws disabled user
  			$('#errorMessage').html("User has been disabled.");
  		} else if (errorCode == 'auth/user-not-found') {
  			// WRITE CODE HERE if firebase throws user not found
  			$('#errorMessage').html("User not found.");
  		} else {
    		alert(errorMessage);
  		}
  		console.log(errorCode);
  		$("#submitUsernameButton").prop("disabled", true);
	});
		
	$("#submitUsernameButton").prop("disabled", false);
	$("#submitUsernameButton").html("Sign Out");

	// commenting out this code as it is throwing an error
	/*if (data.currentUser) {
		login();
	}*/
}


//CREATE USER PROVIDING EMAIL AND PASSWORD ** THIS VERSION USES FIREBASE AUTH FRAMEWORK **

function registerUser() {

	// grab data from html forms
	email = $("#email").val().trim();
	password = $("#password").val().trim();

	// provide email and password to create user using firebase's framework
	firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
  		
  		// catch errors
  		var errorCode = error.code;
  		var errorMessage = error.message;
  			
  		// handle errors	
  		if (errorCode == 'auth/weak-password') {
  			// firebase demands passwords to be at least 6-characters long
  			// WRITE CODE HERE if firebase throws back weak password error
    		$('#errorMessage').html("Password is too short.");
  		} else if (errorCode == 'auth/email-already-in-use') {
  			// WRITE CODE HERE if firebase throws email already in use
  			$('#errorMessage').html("Email already used.");
  		} else if (errorCode == 'auth/invalid-email') {
  			// WRITE CODE HERE if firebase throws invalid email
  			$('#errorMessage').html("Invalid email.");
  		} else if (errorCode == 'auth/operation-not-allowed') {
  			// WRITE CODE HERE if auth not enabled
			$('#errorMessage').html("Auth not enabled.");
  		} else {
    		alert(errorMessage);
  		}
  		console.log(errorCode);
	});

	// clear out html forms
	$("#newUsername").val("");
	$("#newPassword").val("");	
}




function storeData() {
	database.ref().push( {
		user: email,
		latitude: latitude,
		longitude: longitude,
		location: placeName
	})
}



function initAutocomplete() {
	var map = new google.maps.Map(document.getElementById('map'), {
	  center: {lat: 30.2672, lng: -97.7431},
	  zoom: 13,
	  mapTypeId: 'roadmap'
	});

	// Create the search box and link it to the UI element.
	var input = document.getElementById('pac-input');
	var searchBox = new google.maps.places.SearchBox(input);
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

	// Bias the SearchBox results towards current map's viewport.
	map.addListener('bounds_changed', function() {
		searchBox.setBounds(map.getBounds());
	});

	var markers = [];
	// Listen for the event fired when the user selects a prediction and retrieve
	// more details for that place.
	searchBox.addListener('places_changed', function() {
		var places = searchBox.getPlaces();

		if (places.length == 0) {
			return;
		}

		// Clear out the old markers.
		markers.forEach(function(marker) {
			marker.setMap(null);
		});
		markers = [];

		// For each place, get the icon, name and location.
		var bounds = new google.maps.LatLngBounds();
		places.forEach(function(place) {
			placeName = place.name;
			if (!place.geometry) {
				console.log("Returned place contains no geometry");
			return;
			}
			latitude = ((place.geometry.viewport.f.f + place.geometry.viewport.f.b)/2);
			longitude = ((place.geometry.viewport.b.f + place.geometry.viewport.b.b)/2);
			getSolarTimes();
			storeData();
			var icon = {
				url: place.icon,
				size: new google.maps.Size(71, 71),
				origin: new google.maps.Point(0, 0),
				anchor: new google.maps.Point(17, 34),
				scaledSize: new google.maps.Size(25, 25)
			};

			// Create a marker for each place.
			markers.push(new google.maps.Marker({
				map: map,
				icon: icon,
				title: place.name,
				position: place.geometry.location
			}));

			if (place.geometry.viewport) {
				// Only geocodes have viewport.
				bounds.union(place.geometry.viewport);
			} else {
				bounds.extend(place.geometry.location);
			}
		});
		map.fitBounds(bounds);
	});
}

function initApp() {
	checkIfLoggedIn();
	getData();
	getSolarTimes();
	// listen for changes in the auth state
	firebase.auth().onAuthStateChanged(function(user) {
		if(user) {
			// user signed in
			$("#loginPanel").hide();
			login();
		} else {
			// user signed out
		}
	});

	// add event listeners to buttons
	$(document).on("click", "#submitUsernameButton", function(event) {
		event.preventDefault();
		$("#previousSearches").html("");
		submitCredentials();
	});

	$(document).on("click", "#changeUserButton", function() {

		firebase.auth().signOut().then(function() {
	  		// Sign-out successful.
		}, function(error) {
			// An error happened.
		});

		$("#submitUsernameButton").html("Sign In");
		$("#previousSearches").html("");
		localStorage.setItem("user", null);
		checkIfLoggedIn();
		$("#changeUserButton").remove();
		$("#loginPanel").show();
	});

	$(document).on("click", "#changePassword", function() {

	});

	$(document).on("click", "#newUserButton", function(event) {
		event.preventDefault();
		registerUser();
	});
}

$(document).ready(function() {
	initApp();
});