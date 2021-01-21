$(async function () {
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navPost = $("#navLinkPost");
  const $navFavorites = $("#navLinkFavorites");
  const $navMyStories = $("#navLinkMyStories");
  const $favoritedArticles = $("#favorited-articles");
  const $navWelcome = $("#nav-welcome");
  const $navUserProfile = $("#nav-user-profile");
  const $userProfile = $("#user-profile");

  // global storyList variable
  let storyList = null;

  // global user variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showProfileDetails();
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();

    // get a user profile
    showProfileDetails();
  }

  // Grabs current user's info andadds to profile section
  function showProfileDetails() {
    $("#profile-name").text(`Name: ${currentUser.name}`);
    $("#profile-username").text(`Username: ${currentUser.username}`);
    $("#profile-account-date").text(
      `Account Created: ${currentUser.createdAt.slice(0, 10)}`
    );
    $navUserProfile.text(`${currentUser.username}`);
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $userProfile.hide();
    $("#navLinksContainer, #user-profile").toggleClass("hidden");
    $navWelcome.show();
    $navLogOut.show();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   *  A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story, usersPost) {
    let hostName = getHostName(story.url);
    let star = isFavorite(story) ? "fas" : "far";
    const trash = usersPost
      ? `<span class="trash-can">
          <i class="fas fa-trash-alt"></i>
        </span>`
      : "";

    // render  story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        ${trash}
        <span class="star">
          <i class="${star} fa-star"></i>
        </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
          </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  // Make a list of favorites if favorites are available
  function generateFaves() {
    $favoritedArticles.empty();
    if (currentUser.favorites.length === 0) {
      $favoritedArticles.append("<h5>No favorites!</h5>");
    } else {
      for (let story of currentUser.favorites) {
        let favoriteHTML = generateStoryHTML(story, false, true);
        $favoritedArticles.append(favoriteHTML);
      }
    }
  }

  // Make a list of stories submitted by user
  function generateMyStories() {
    $ownStories.empty();
    if (currentUser.ownStories.length === 0) {
      $ownStories.append("<h5>No stories yet!</h5>");
    } else {
      for (let story of currentUser.ownStories) {
        let ownStoryHTML = generateStoryHTML(story, true);
        $ownStories.append(ownStoryHTML);
      }
    }
    $ownStories.show();
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $userProfile,
      $favoritedArticles,
      $loginForm,
      $createAccountForm,
      $userProfile,
    ];
    elementsArr.forEach(($elem) => $elem.hide());
  }

  // Return if story has been favorited and assigned an id
  function isFavorite(story) {
    let favStoryIds = new Set();
    if (currentUser) {
      favStoryIds = new Set(currentUser.favorites.map((obj) => obj.storyId));
    }
    return favStoryIds.has(story.storyId);
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }

  //** EVENT HANDLERS

  /**
   * Event listener for logging in.
   *  If successful, will set up the user instance
   */

  $loginForm.on("submit", async function (event) {
    event.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);

    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successful, will setup a new user instance
   */

  $createAccountForm.on("submit", async function (event) {
    event.preventDefault(); // no page refresh

    // grab the required fields
    const name = $("#create-account-name").val();
    const username = $("#create-account-username").val();
    const password = $("#create-account-password").val();

    // call create method, which calls  API and then builds a new user instance
    const newUser = await User.create(username, password, name);

    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function () {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  // Handler for submitting a post
  $submitForm.on("submit", async function (event) {
    event.preventDefault();
    const title = $("#title").val();
    const url = $("#url").val();
    const hostName = getHostName(url);
    const author = $("#author").val();
    const username = currentUser.username;

    const currentStory = await storyList.addStory(currentUser, {
      title,
      author,
      url,
      username,
    });
    const $li = $(`
      <li id="${currentStory.storyId}" class="id-${currentStory.storyId}">
        <span class="star">
          <i class="far fa-star"></i>
        </span>
        <a class="article-link" href="${url}" target="a_blank">
          <strong>${title}</strong>
        </a>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-author">by ${author}</small>
        <small class="article-username">posted by ${username}</small>
      </li>
    `);
    $allStoriesList.prepend($li);
    $submitForm.slideUp();
    $submitForm.trigger("reset");
  });

  // Handler for adding fill to star icon
  $(".articles-container").on("click", ".star", async function (event) {
    if (currentUser) {
      const $target = $(event.target);
      const $closestLi = $target.closest("li");
      const storyId = $closestLi.attr("id");
      if ($target.hasClass("fas")) {
        await currentUser.removeFavorite(storyId);
        $target.closest("i").toggleClass("fas far");
      } else {
        await currentUser.addFavorite(storyId);
        $target.closest("i").toggleClass("fas far");
      }
    }
  });

  // Handler for deleting posts
  $ownStories.on("click", ".trash-can", async function (event) {
    const $closestLi = $(event.target).closest("li");
    const storyId = $closestLi.attr("id");
    await storyList.removeStory(currentUser, storyId);
    await generateStories();
    hideElements();
  });

  // NAVIGATION HANDLERS

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function () {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  // Handler for showing user profile
  $navUserProfile.on("click", function () {
    hideElements();
    $userProfile.show();
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function () {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  // Handler for showing submit form
  $navPost.on("click", function () {
    if (currentUser) {
      $allStoriesList.show();
      $submitForm.slideToggle();
    }
  });

  // Handler for showing favorites
  $navFavorites.on("click", function () {
    hideElements();
    if (currentUser) {
      generateFaves();
      $favoritedArticles.show();
    }
  });

  // Handler for showing My Stories
  $navMyStories.on("click", function () {
    hideElements();
    if (currentUser) {
      $userProfile.hide();
      generateMyStories();
      $ownStories.show();
    }
  });
});
