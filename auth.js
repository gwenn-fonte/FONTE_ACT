$(function () {

  var VALID_USER = 'admin';
  var VALID_PASS = '12345';
  var MAX_ATTEMPTS = 3;
  var LOCK_SECONDS = 30;

  function showMessage(text, type) {
    $('#formMessage')
      .removeClass('error success warning')
      .addClass('show ' + type)
      .text(text);
  }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem('users') || '[]');
    } catch (e) {
      return [];
    }
  }

  $.validator.addMethod('phPhone', function (value, element) {
    return this.optional(element) || /^(09|\+639)\d{9}$/.test(value);
  }, 'Enter a valid PH number (e.g. 09123456789).');

  $.validator.addMethod('strongPass', function (value, element) {
    return this.optional(element) || (/[A-Za-z]/.test(value) && /\d/.test(value));
  }, 'Password must contain at least one letter and one number.');

  var baseOptions = {
    errorElement: 'label',
    errorPlacement: function (error, element) {
      error.insertAfter(element.closest('.input-group'));
    },
    onkeyup: function (el) { $(el).valid(); }
  };

  if ($('#loginForm').length) {

    if (sessionStorage.getItem('loggedIn') === 'true') {
      window.location.replace('landing.html');
    }

    var timer = null;

    function getLockUntil() { return parseInt(localStorage.getItem('lockUntil') || '0', 10); }

    function startLockCountdown() {
      $('#loginForm :input').prop('disabled', true);
      clearInterval(timer);
      timer = setInterval(function () {
        var left = Math.ceil((getLockUntil() - Date.now()) / 1000);
        if (left <= 0) {
          clearInterval(timer);
          localStorage.removeItem('lockUntil');
          localStorage.setItem('attempts', '0');
          $('#loginForm :input').prop('disabled', false);
          showMessage('You can try logging in again.', 'warning');
        } else {
          showMessage('Too many failed attempts. Account locked. Try again in ' + left + 's.', 'error');
        }
      }, 250);
    }

    if (getLockUntil() > Date.now()) { startLockCountdown(); }

    $('#loginForm').validate($.extend({}, baseOptions, {
      rules: {
        username: { required: true, minlength: 3 },
        password: { required: true, minlength: 5 }
      },
      messages: {
        username: {
          required: 'Please enter your username.',
          minlength: 'Username must be at least 3 characters.'
        },
        password: {
          required: 'Please enter your password.',
          minlength: 'Password must be at least 5 characters.'
        }
      },
      submitHandler: function (form) {
        if (getLockUntil() > Date.now()) { return; }

        var user = $.trim($('#username').val());
        var pass = $('#password').val();

        var input = user.toLowerCase();
        var found = getUsers().some(function (u) {
          return (u.email === input || u.name.toLowerCase() === input) && u.password === pass;
        });

        if (found || (user === VALID_USER && pass === VALID_PASS)) {
          localStorage.setItem('attempts', '0');
          sessionStorage.setItem('loggedIn', 'true');
          showMessage('Login successful! Redirecting…', 'success');
          setTimeout(function () { window.location.href = 'landing.html'; }, 900);
          return;
        }

        var attempts = parseInt(localStorage.getItem('attempts') || '0', 10) + 1;
        localStorage.setItem('attempts', String(attempts));

        if (attempts >= MAX_ATTEMPTS) {
          localStorage.setItem('lockUntil', String(Date.now() + LOCK_SECONDS * 1000));
          startLockCountdown();
        } else {
          var left = MAX_ATTEMPTS - attempts;
          showMessage('Incorrect username or password. ' + left + ' attempt' + (left > 1 ? 's' : '') + ' left.', 'error');
          form.reset();
          $('#username').focus();
        }
      }
    }));
  }

  if ($('#registerForm').length) {
    $('#registerForm').validate($.extend({}, baseOptions, {
      rules: {
        name: { required: true, minlength: 2 },
        email: { required: true, email: true },
        phone: { required: true, phPhone: true },
        password: { required: true, minlength: 6, strongPass: true },
        confirm_password: { required: true, equalTo: '#password' }
      },
      messages: {
        name: {
          required: 'Please enter your full name.',
          minlength: 'Name must be at least 2 characters.'
        },
        email: {
          required: 'Please enter your email address.',
          email: 'Enter a valid email (e.g. name@example.com).'
        },
        phone: { required: 'Please enter your phone number.' },
        password: {
          required: 'Please create a password.',
          minlength: 'Password must be at least 6 characters.'
        },
        confirm_password: {
          required: 'Please confirm your password.',
          equalTo: 'Passwords do not match.'
        }
      },
      submitHandler: function (form) {
        var users = getUsers();
        var email = $.trim($('#registerForm [name="email"]').val()).toLowerCase();

        if (users.some(function (u) { return u.email === email; })) {
          showMessage('Email is already registered. Please log in.', 'error');
          return;
        }

        users.push({
          name: $.trim($('#registerForm [name="name"]').val()),
          email: email,
          phone: $('#registerForm [name="phone"]').val(),
          password: $('#password').val()
        });
        localStorage.setItem('users', JSON.stringify(users));

        // Make sure the user must log in after registering
        sessionStorage.removeItem('loggedIn');

        showMessage('Registration successful! Redirecting to login…', 'success');
        form.reset();
        $('#registerForm input').removeClass('valid error');
        setTimeout(function () { window.location.href = 'login.html'; }, 1800);
      }
    }));
  }
});