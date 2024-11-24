const yaml = require('js-yaml');
const fs = require('fs');

// Load secrets.yml file
let secrets;
try {
  secrets = yaml.load(fs.readFileSync('secrets.yml', 'utf8'));
} catch (e) {
  console.error(e);
}

// Access the API key and Client ID from secrets
const apiKey = secrets.api_key;
const clientId = secrets.client_id;

console.log(apiKey, clientId);  // Test logging the values (but don't log in production)

// Initialize Google API client
function initClient() {
  gapi.client.init({
    apiKey: apiKey,
    clientId: clientId,
    scope: 'https://www.googleapis.com/auth/youtube.readonly', // YouTube Read-Only Access
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'],
    redirect_uri: 'http://127.0.0.1:5500/' // Ensure this matches the redirect URI in Google Cloud Console
  }).then(function() {
    // Check if the user is signed in
    const authInstance = gapi.auth2.getAuthInstance();
    if (authInstance.isSignedIn.get()) {
      console.log("User is signed in");
      fetchUserData();  // Fetch YouTube activity if the user is signed in
    } else {
      // Show the sign-in button if the user is not signed in
      document.getElementById('signinBtn').style.display = 'inline-block';
    }
  }).catch(function(error) {
    console.log("Error initializing client:", error);
  });
}

// Load the Google API client and authentication library
function loadClient() {
  gapi.load('client:auth2', initClient);
}

// Sign in the user when the "Sign In" button is clicked
function signIn() {
  gapi.auth2.getAuthInstance().signIn({
    prompt: 'select_account' // Ensure this does not conflict with your Google account settings
  }).then(function() {
    console.log("User signed in successfully");
    fetchUserData();  // Fetch YouTube activity after successful sign-in
  }).catch(function(error) {
    console.log("Error during sign-in:", error);
  });
}


// Sign out the user when the "Sign Out" button is clicked
function signOut() {
  gapi.auth2.getAuthInstance().signOut().then(function() {
    console.log("User signed out successfully");
    document.getElementById('signinBtn').style.display = 'inline-block';
    document.getElementById('signoutBtn').style.display = 'none';
  }).catch(function(error) {
    console.log("Error during sign-out:", error);
  });
}

// Fetch the user's YouTube activity
function fetchUserData() {
  const request = gapi.client.youtube.activities.list({
    part: 'snippet,contentDetails',
    mine: true
  });

  request.execute(function(response) {
    if (response.error) {
      console.error("Error fetching user data:", response.error);
      return;
    }

    // Display the activity (e.g., the videos user has been watching)
    const activities = response.items;
    let output = '<h3>Your Recent YouTube Activity:</h3>';
    if (activities && activities.length > 0) {
      activities.forEach(activity => {
        output += `
          <div class="activity">
            <h4>${activity.snippet.title}</h4>
            <p>Type: ${activity.snippet.type}</p>
            <p><a href="https://www.youtube.com/watch?v=${activity.contentDetails.upload.videoId}" target="_blank">Watch Video</a></p>
          </div>
        `;
      });
    } else {
      output += '<p>No recent activities found.</p>';
    }

    // Display the activity on the page
    document.getElementById('activityList').innerHTML = output;

    // Hide the sign-in button and show the sign-out button
    document.getElementById('signinBtn').style.display = 'none';
    document.getElementById('signoutBtn').style.display = 'inline-block';
  });
}

// HTML to render the sign-in and sign-out buttons
document.body.innerHTML = `
  <div id="app">
    <h2>Share Your YouTube Activity</h2>
    <button id="signinBtn" onclick="signIn()" style="display: inline-block;">Sign In with Google</button>
    <button id="signoutBtn" onclick="signOut()" style="display: none;">Sign Out</button>
    <div id="activityList"></div>
  </div>
`;

// Load the client and initiate the sign-in process
loadClient();
