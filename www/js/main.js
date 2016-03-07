var tempGlobal;
var contact;

ons.ready(function() {
  document.querySelector('#myNavigator')
    .addEventListener('init', function(event) {
      var page = event.target;
      if (page.id === "list") {
        initListPage();
      } else if (page.id === "contact-page") {
        initContactPage(myNavigator.getCurrentPage().options.contact);
      }
    });
  
  // NFCが検出された場合の処理
  nfc.addTagDiscoveredListener(function(event) {
    console.log("Read NFC: " + JSON.stringify(event.tag, null, 4));
    var id = (event.tag.id[0] + event.tag.id[1] + event.tag.id[2] + event.tag.id[3]) % 10; // Get id from 0 to 10
    var contact = $("#list ons-list-item")[id];
    $(contact).click();
  });
  
});

function authLogin() {
  $.oauth2({
    auth_url: 'https://login.salesforce.com/services/oauth2/authorize',
    response_type: 'token',
    client_id: '3MVG9ZL0ppGP5UrB.q5j0Dg8DQXtSREFD4QyPGrk74OJ3WwAubNe3R6_X68.NJyGHXmA6TukYdVi7nB7tsl9k',
    client_secret: '18735646984976367',
    redirect_uri: 'https://continue.auth/',
    other_params: {}
  }, function(token, response) {
    accessToken = token;
    localStorage.setItem('accessToken', token.replace("%21", "!"));
    console.log("Successfully obtained access token = " + accessToken);

    myNavigator.pushPage("listPage.html");
  }, function(error, response) {
    alert('Failed to get token!');
    $("#logs")
      .append("<p class='error'><b>error: </b>" + JSON.stringify(error) + "</p>");
    $("#logs")
      .append("<p class='error'><b>response: </b>" + JSON.stringify(response) + "</p>");
  });
}

function buildRequest(api, type, data) {
  var API_PREFIX = "https://ap2.salesforce.com/services/data/v36.0";
  return {
    url: API_PREFIX + api,
    type: type,
    dataType: 'json',
    contentType: 'application/json',
    beforeSend: function($xhr) {
      $xhr.setRequestHeader('Authorization', 'OAuth ' + localStorage.getItem('accessToken'));
    },
    data: data || null,
  };
}

function initListPage() {
  $.ajax(buildRequest('/query?q=SELECT+id,name,phone,email,title,mailingstreet,account.name,account.phone,account.website+from+Contact', 'GET'))
    .done(function(data) {
      formatList(data.records);
    })
    .fail(function($xhr, textStatus, errorThrown) {
      alert("一覧の取得に失敗しました。");
      console.log(textStatus);
    });
}

function formatList(records) {
  var i, html = "";
  for (i = 0; i < records.length; i++) {
    var record = records[i];
    html += '<ons-list-item modifier="tappable" class="item" data-item="' + i + '"><ons-row>';
    html += '<ons-col><div class="record-name">' + record.Name + '</div>';
    html += '<div class="record-title">' + record.Title + '</div></ons-col></ons-row></ons-list-item>';
  }
  html += '</ons-list>';
  
  $('#contacts-list').append(html);
  
  $('.item').each(function(item) {
      this.onclick = function() {
        var i = $(this).data("item");
        myNavigator.pushPage('contact.html', { contact: records[i] });
      };
    });
}

function initContactPage(contact) {
  //var account = contact.Account;
  $("#personal-name")
    .html(contact.Name);
  $("#personal-phone")
    .html(contact.Phone)
    .parent().click(function() {
      document.location.href = "tel:" + contact.Phone;
    });
  $("#email")
    .html(contact.Email)
    .parent().click(function() {
      location.href = "mailto:" + contact.Email;
    });
  $("#mailing-street")
    .html(contact.MailingStreet)
    .parent().click(function() {
      location.href = "geo:" + contact.MailingStreet;
    });
  $("#company-name")
    .html(contact.Account.Name);
  $("#position-name")
    .html(contact.Title);
  $('#company-phone')
    .html(contact.Account.Phone)
    .parent().click(function() {
      document.location.href = "tel:" + contact.Phone;
    });
  $('#url-address')
    .html(contact.Account.Website)
    .parent().click(function() {
      window.open(contact.Account.Website, "_system")
    });
}
