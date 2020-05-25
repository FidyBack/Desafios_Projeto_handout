var show = function($curr) {
  $curr.css('display', 'block');
  $curr.animate({opacity: 1});
};

var hide = function($curr, callback) {
  $curr.animate({opacity: 0}, 400, 'swing', function() {
    $(this).css('display', 'none');

    if(callback) {
      callback();
    }
  });
};


$(document).ready(function() {
  if(window.location.hash) {
    return;
  }

  var $h3 = $('h3:first');

  if(!$h3.length) {
    return;
  }

  var $curr = $h3.next();

  while($curr.length) {
    var $next = $curr.next();

    var callback = null;

    if(!$next.length) {
      callback = function() {
        show($h3);
      };
    }

    hide($curr, callback);

    $curr = $next;
  }

  $('h3 a').click(function() {
    $h3 = $(this).parent();

    var html = $(this).html();

    hide($h3, function() {
      $curr = $h3.next();

      while($curr.length) {
        if(html == 'continuar') {
          show($curr);

          if($curr.is('h3')) {
            break;
          }
        }
        else {
          if(!$curr.is('h3')) {
            show($curr);
          }
        }

        $curr = $curr.next();
      }
    });

    return false;
  });
});
