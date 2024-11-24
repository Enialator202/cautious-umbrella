const yaml = require('js-yaml');
const fs = require('fs');

// Load secrets.yml file
let secrets;
try {
  secrets = yaml.load(fs.readFileSync('secrets.yml', 'utf8'));
} catch (e) {
  console.error("Error loading secrets.yml:", e);
}

// Access the API key and Client ID from secrets
const API_KEY = secrets.api_key;
const CLIENT_ID = secrets.client_id;

console.log(API_KEY, CLIENT_ID); // Test logging the values (remove in production)

// Initialize Google API client
function initClient() {
  gapi.client
    .init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      scope: "https://www.googleapis.com/auth/youtube.readonly",
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"],
    })
    .then(() => {
      console.log("Google API client initialized");
      const authInstance = gapi.auth2.getAuthInstance();
      updateSigninStatus(authInstance.isSignedIn.get());
      authInstance.isSignedIn.listen(updateSigninStatus);
    })
    .catch((err) => {
      console.error("Error initializing Google API client:", err);
    });
}

// Load the Google API client library
function loadClient() {
  gapi.load("client:auth2", initClient);
}

// Handle user sign-in
function handleAuthClick() {
  console.log("Sign-in button clicked. Initiating sign-in...");
  gapi.auth2
    .getAuthInstance()
    .signIn()
    .then(() => {
      console.log("User signed in successfully.");
      fetchUserData();
    })
    .catch((err) => {
      console.error("Error during sign-in:", err);
    });
}

// Handle user sign-out
function handleSignoutClick() {
  console.log("Sign-out button clicked. Signing out...");
  gapi.auth2
    .getAuthInstance()
    .signOut()
    .then(() => {
      console.log("User signed out successfully.");
      updateSigninStatus(false);
    })
    .catch((err) => {
      console.error("Error during sign-out:", err);
    });
}

// Update the UI based on sign-in status
function updateSigninStatus(isSignedIn) {
  console.log("Sign-in status changed:", isSignedIn);
  if (isSignedIn) {
    console.log("User is signed in.");
    document.getElementById("signinBtn").style.display = "none";
    document.getElementById("signoutBtn").style.display = "inline-block";
    fetchUserData();
  } else {
    console.log("User is not signed in.");
    document.getElementById("signinBtn").style.display = "inline-block";
    document.getElementById("signoutBtn").style.display = "none";
  }
}

// Fetch the user's YouTube activity
function fetchUserData() {
  console.log("Attempting to fetch user data...");
  gapi.client.youtube.activities
    .list({
      part: "snippet,contentDetails",
      mine: true,
    })
    .then((response) => {
      console.log("User data fetched successfully:", response);
      const activities = response.result.items || [];
      updateVideoList(
        activities.map((item) => ({
          id: item.contentDetails?.upload?.videoId || null,
          snippet: item.snippet,
        }))
      );
    })
    .catch((err) => {
      console.error("Error fetching user data:", err);
    });
}

// Update the video list in the UI
function updateVideoList(videos) {
  const videoList = document.getElementById("videoList");
  videoList.innerHTML = ""; // Clear existing content
  if (videos.length === 0) {
    videoList.innerHTML = "<li>No recent activities found.</li>";
    return;
  }

  videos.forEach((video) => {
    const listItem = document.createElement("li");
    if (video.id) {
      listItem.innerHTML = `<a href="https://www.youtube.com/watch?v=${video.id}" target="_blank">${video.snippet.title}</a>`;
    } else {
      listItem.textContent = video.snippet.title;
    }
    videoList.appendChild(listItem);
  });
}

// Initialize the app when the page loads
window.onload = () => {
  console.log("Loading Google API client...");
  loadClient();
};

function fetchUserData() {
  gapi.client.youtube.activities.list({
    part: 'snippet,contentDetails',
    mine: true
  }).then(response => {
    const activities = response.result.items;
    updateVideoList(activities.map(item => ({
      id: item.contentDetails.upload.videoId,
      snippet: item.snippet
    })));
  }).catch(err => console.error("Error fetching user data:", err));
}

function updateVideoList(videos) {
  const videoList = document.getElementById('videoList');
  videoList.innerHTML = '';
  if (videos && videos.length > 0) {
    videos.forEach(video => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `<a href="https://www.youtube.com/watch?v=${video.id}" target="_blank">${video.snippet.title}</a>`;
      videoList.appendChild(listItem);
    });
  } else {
    videoList.innerHTML = '<li>No videos found.</li>';
  }
}

loadClient();
