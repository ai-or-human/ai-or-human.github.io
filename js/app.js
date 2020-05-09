var page = 0;
var startTime = new Date().toUTCString();
var id = Math.floor(Math.random() * 10000);
var db = null;

var dbEntryPath = 'survey-data-' + env + '/entries/entry_';
var dbOverviewPath = 'survey-data-' + env + '/overview/';

function initDB()
{
  db = firebase.database();
}

function initQuiz(){
  var currentPage = $("#page"+page);
  var mosaic = $(".highlight-container.media-large .item");

  $('.page.load').removeClass('load');

  currentPage.addClass('show');

  for(var i = 0; i < mosaic.length; i++){
    var target = Math.floor(Math.random() * mosaic.length -1) + 1;
    var target2 = Math.floor(Math.random() * mosaic.length -1) +1;
    mosaic.eq(target).before(mosaic.eq(target2));
  }

  randomizePage();

  page++;

  randomizeContent(page);
}

function updateEntries(sendObject){
  var updates = {};

  db.ref(dbEntryPath + id).update(sendObject);
}

function changePage(page){
  var currentPage = $("#page"+page);

  $('.page.show').removeClass('show');

  currentPage.addClass('show');
}

function nextPage(button){
  var countParticipants;
  var currentPage = $("#page"+page);

  if (page == 1){
    db.ref(dbOverviewPath + 'total/participants/started').transaction(function(countParticipants) {
      if (countParticipants == null) {
        return 1;
      } else {
        return countParticipants + 1;
      }
    })
  }

  $("#page"+page+" .question-title").each(function(){
    $(this).text("Question "+(page-1));
  })

  collectAndSendInputs(page, button);

  changePage(page);

  page++;

  randomizeContent(page);

  if($(currentPage).find(".page-results").length !== 0){
    displayResult();
  }
}

function loadResultData(callback){
  var object;

  db.ref(dbEntryPath + id + '/results/').once('value').then(function(snapshot){
    object = snapshot.val();
    callback(object);
  });
}

function loadOverviewData(callback){
  var object;

  db.ref(dbOverviewPath).once('value').then(function(snapshot){
    object = snapshot.val();
    callback(object);
  });
}

function displayResult(){
  var resultObject;
  var overviewObject;

  db.ref(dbOverviewPath + 'total/participants/completed').transaction(function(counter){
    if (counter == null) {
      return 1;
    } else {
      return counter + 1;
    }
  })  

  loadResultData(function(object){
    resultObject = object;

    var resultTotalAnswered = resultObject.total.answered;
    var resultTotalCorrect = resultObject.total.correct || 0;
    var resultTotalWrong = resultObject.total.wrong || 0;

    db.ref(dbOverviewPath + 'total/answersCompleted/answers').transaction(function(counter){
      if (counter == null) {
        return resultTotalAnswered;
      } else {
        return counter + resultTotalAnswered;
      }
    })

    db.ref(dbOverviewPath + 'total/answersCompleted/correct').transaction(function(counter){
      if (counter == null) {
        return resultTotalCorrect;
      } else {
        return counter + resultTotalCorrect;
      }
    })

    db.ref(dbOverviewPath + 'total/answersCompleted/wrong').transaction(function(counter){
      if (counter == null) {
        return resultTotalWrong;
      } else {
        return counter + resultTotalWrong;
      }
    }) 

    loadOverviewData(function(object){
      overviewObject = object;

      var questionIndex = 0;

      var overviewImageAnswers = overviewObject.perContentType.image.answers;
      var overviewImageCorrect = overviewObject.perContentType.image.correct || 0;

      var overviewTextAnswers = overviewObject.perContentType.text.answers;
      var overviewTextCorrect = overviewObject.perContentType.text.correct || 0;

      var overviewTotalAnswers = overviewObject.total.answers.answers;
      var overviewTotalCorrect = overviewObject.total.answers.correct || 0;

      var overviewParticipants = overviewObject.total.participants.completed;

      var overviewAnswers = overviewObject.total.answersCompleted.answers;
      var overviewCorrect = overviewObject.total.answersCompleted.correct || 0;
      var overviewAvgResult = (overviewCorrect/overviewParticipants).toFixed(0);

      var overviewImageAnswers = overviewObject.perContentType.image.answers;
      var overviewImageCorrect = overviewObject.perContentType.image.correct || 0;
      var overviewImagePercentage = ((overviewImageCorrect/overviewImageAnswers) * 100).toFixed(0);

      var overviewTextAnswers = overviewObject.perContentType.text.answers;
      var overviewTextCorrect = overviewObject.perContentType.text.correct || 0;
      var overviewTextPercentage = ((overviewTextCorrect/overviewTextAnswers) * 100).toFixed(0);

      var resultTemplate = $("template#resultItem").html();

      $('span[data="correct"').text(resultTotalCorrect);
      $('span[data="answered"').text("/" + resultTotalAnswered);
      $('span[data="participants"').text(overviewParticipants);
      $('span[data="avgResult"').text(overviewAvgResult + "/" + resultTotalAnswered);
      $('span[data="imagePercentage"').text(overviewImagePercentage);
      $('span[data="textPercentage"').text(overviewTextPercentage);

      $.map(resultObject, function(question){
        questionIndex++

        if ("id" in question){
          var questionId = question.id;
          var questionContentId = question.contentId;
          var questionContentType = question.contentType;
          var questionResult = question.result;
          var questionValidity = question.validity;

          var questionContent = $("#"+questionContentId);

          var questionImageSrc = questionContent.attr("src");
          var questionTextTitle = $(questionContent).find(".text-title > span").text();
          var questionTextContent = $(questionContent).find(".text-content > p").text();
          var questionValidityText;

          var questionContentAnswers = overviewObject.perContent[questionContentType + "_" + questionContentId].answers;
          var questionContentCorrect = overviewObject.perContent[questionContentType + "_" + questionContentId].correct || 0;
          var questionContentPercentage = ((questionContentCorrect/questionContentAnswers) * 100).toFixed(0);

          var $result = $(resultTemplate);

          $result.addClass(questionContentType);

          if (questionContentType == "text"){
            $result.find('div[data="contentTypeImage"]').css("display","none");
            $result.find('div[data="contentTypeText"] > .text-title > span').text(questionTextTitle);
            $result.find('div[data="contentTypeText"] > .text-content > p').text(questionTextContent);
            questionValidityText = "Written by " + questionValidity; 

          } else if(questionContentType == "image"){
            $result.find('div[data="contentTypeText"]').css("display","none");
            $result.find('img[data="contentImage"]').attr("src",questionImageSrc);
      
            if (questionValidity == "Humans"){
              questionValidityText = "A real Human";
            } else if (questionValidity == "AI"){
              questionValidityText = "Generated by " + questionValidity;
            }
          };

          if (questionValidity == "Humans"){
            $result.find('div[data="validity"] img[value="ai"]').css("display","none");
            $result.find('div[data="validity"] > span').text(questionValidityText);
            if (questionResult == "correct"){
              $result.find('div[data="guess"] > span').text("You guessed Human");
            } else if (questionResult == "wrong"){
              $result.find('div[data="guess"] > span').text("You guessed AI");
            }
          } else if (questionValidity == "AI"){
            $result.find('div[data="validity"] img[value="human"]').css("display","none");
            $result.find('div[data="validity"] > span').text(questionValidityText);
            if (questionResult == "correct"){
              $result.find('div[data="guess"] > span').text("You guessed AI");
            } else if (questionResult == "wrong"){
              $result.find('div[data="guess"] > span').text("You guessed Human"); 
            }
          }

          $result.find('div[data="result"]').addClass(questionResult);

          for (var i = 0; i < src[questionContentId].href.length; i++){
            var source = $result.find('div[data="source"]');

            if (i > 0){
              $("<span/>",
              {
                text: " + ",
              }).appendTo(source);
            }

            $("<a/>",
            {
              "target": "_blank",
              "href": src[questionContentId].href[i],
              text: src[questionContentId].text[i],
            }).appendTo(source);
          }

          $result.find('div[data="percentage"] > span').text(questionContentPercentage + "% of people guessed correctly from a total of " + questionContentAnswers + " answers")

          if (questionResult == "correct"){
            $result.find('div[data="result"] > svg[value="wrong"]').css("display","none");
          } else if (questionResult == "wrong"){
            $result.find('div[data="result"] > svg[value="correct"]').css("display","none");
          }
          $result.find('span[data="questionNumber"]').text("Question "+questionIndex);

          $(".result.breakdown").append($result);
        }
      })

    });
  });
}

function randomizeContent(page) {
  var randomContent = $('#page'+page+' .random');
  var chosenContent;

  for(var i = 0; i < randomContent.length; i++){
    var target = Math.floor(Math.random() * randomContent.length -1) + 1;
    var target2 = Math.floor(Math.random() * randomContent.length -1) +1;
    randomContent.eq(target).before(randomContent.eq(target2));
  }

  chosenContent = $('#page'+page+' .randomize > *:nth-child(2)');
  chosenContent.addClass("chosen");

  for(var i = 0; i < randomContent.length; i++){
    if(!$(randomContent[i]).hasClass("chosen")){
      randomContent[i].remove();
    }
  }
}

function randomizePage(){
  var pages = $('.page[value="question"]');
  var num = 2;

  for(var i = 0; i < pages.length; i++){
    var target = Math.floor(Math.random() * pages.length -1) + 1;
    var target2 = Math.floor(Math.random() * pages.length -1) +1;
    pages.eq(target).before(pages.eq(target2));
  }

  pages = $('.page[value="question"]');

  pages.each(function(){
    $(this).attr("id","page"+num);
    num++
  })
}

function collectAndSendInputs(page, button) {
  var buttonClicked = $(button);
  var answerPath = 'results/question_'
  var sendObject = {}
  var overviewQuestionObject = {};
  var currentPage = page-1;
  var num = currentPage-2;

  //Question
  $('#page'+currentPage+' .question').each(function(){
    var question = $(this);
    var content = $('.chosen'+'[question='+question.attr("id")+']');

    var dataQuestionId = question.attr("id");
    var dataContentId = content.attr("id");
    var dataContentType = question.attr("type");
    var dataResult = "no answer";
    var dataValidity;

    //Validity
    if (dataContentId % 2 == 0){
      dataValidity = "AI";
    }else{
      dataValidity = "Humans";
    }

    //Answer
    $('input', question).each(function(){
      var input = $(this);

      sendObject[answerPath + num + "_" + dataQuestionId + '/' + input.attr("value")] = "false";

      if (input = buttonClicked){
        sendObject[answerPath + num + "_" + dataQuestionId + '/' + input.attr("value")] = "true";

        if (buttonClicked.attr("value") == "selectsAI" && dataContentId % 2 == 0){
          dataResult = "correct";
        } else if (buttonClicked.attr("value") == "selectsHuman" && Math.abs(dataContentId % 2) == 1){
          dataResult = "correct";
        } else {
          dataResult = "wrong";
        }
      }
    })

    //Overview Counters
    var overviewTotalPath = 'total/';
    var overviewQuestionPath = 'perQuestion/question_' + dataQuestionId;
    var overviewContentPath = 'perContent/' + dataContentType + "_" + dataContentId;
    var overviewTypePath = 'perContentType/' + dataContentType;

    db.ref(dbOverviewPath + overviewTotalPath + '/answers/answers').transaction(function(counter){
      if (counter == null) {
        return 1;
      } else {
        return counter + 1;
      }
    });

    db.ref(dbOverviewPath + overviewTotalPath + '/answers/' + dataResult).transaction(function(counter){
      if (counter == null) {
        return 1;
      } else {
        return counter + 1;
      }
    });

    db.ref(dbOverviewPath + overviewQuestionPath + '/answers').transaction(function(counter){
      if (counter == null) {
        return 1;
      } else {
        return counter + 1;
      }
    });

    db.ref(dbOverviewPath + overviewQuestionPath + '/' + dataResult).transaction(function(counter){
      if (counter == null) {
        return 1;
      } else {
        return counter + 1;
      }
    });

    db.ref(dbOverviewPath + overviewTypePath + '/answers').transaction(function(counter){
      if (counter == null) {
        return 1;
      } else {
        return counter + 1;
      }
    });

    db.ref(dbOverviewPath + overviewTypePath + '/' + dataResult).transaction(function(counter){
      if (counter == null) {
        return 1;
      } else {
        return counter + 1;
      }
    });

    db.ref(dbOverviewPath + overviewContentPath + '/answers').transaction(function(counter){
      if (counter == null) {
        return 1;
      } else {
        return counter + 1;
      }
    });

    db.ref(dbOverviewPath + overviewContentPath + '/' + dataResult).transaction(function(counter){
      if (counter == null) {
        return 1;
      } else {
        return counter + 1;
      }
    });

    //Construct Object
    sendObject["id"] = id
    sendObject["startTime"] = startTime
    sendObject["completeTime"] = new Date().toUTCString();

    sendObject[answerPath + num + "_" + dataQuestionId + '/id'] = dataQuestionId;
    sendObject[answerPath + num + "_" + dataQuestionId + '/contentId'] = dataContentId;
    sendObject[answerPath + num + "_" + dataQuestionId + '/contentType'] = dataContentType;
    sendObject[answerPath + num + "_" + dataQuestionId + '/validity'] = dataValidity;
    sendObject[answerPath + num + "_" + dataQuestionId + '/result'] = dataResult;

    updateEntries(sendObject);

    //Counter
    db.ref(dbEntryPath + id + '/results/total/answered').transaction(function(counter){
      if (counter == null) {
        return 1;
      } else {
        return counter + 1;
      }
    });

    db.ref(dbEntryPath + id + '/results/total/' + dataResult).transaction(function(counter){
      if (counter == null) {
        return 1;
      } else {
        return counter + 1;
      }
    });
  })
}

function animateFavicon(){
  var favicon_images = [
      "assets/favicon-1.ico",
      "assets/favicon-2.ico"
  ],
  image_counter = 0;

  setInterval(function() {
    $("link[rel='icon']").remove();
    $("link[rel='shortcut icon']").remove();
    $("head").append('<link rel="icon" href="' + baseurl + favicon_images[image_counter] + '" type="image/x-icon">');
        
    if(image_counter == favicon_images.length -1)
      image_counter = 0;
    else
      image_counter++;
  }, 500);
}

function start()
{
  initDB();
  initQuiz();
  animateFavicon();
}