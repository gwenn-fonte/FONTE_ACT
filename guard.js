if (sessionStorage.getItem('loggedIn') !== 'true') {
  window.location.replace('login.html');
}